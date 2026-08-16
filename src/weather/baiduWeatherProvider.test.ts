import { describe, expect, it, vi } from 'vitest'
import { BaiduWeatherProvider, parseBaiduWeatherResponse, WeatherProviderError } from './baiduWeatherProvider'
import { BAIDU_FIXTURES } from './weatherFixtures'
import { WEATHER_LOCATIONS } from './weatherLocations'

const config = WEATHER_LOCATIONS[0]
describe('BaiduWeatherProvider', () => {
  it('解析普通免费字段并忽略未使用字段', () => { const value = parseBaiduWeatherResponse({ ...BAIDU_FIXTURES.sunny, extra: 'ignored' }, config); expect(value.current?.temperature).toBe(28); expect(value.daily).toHaveLength(1); expect(value.hourly).toHaveLength(1) })
  it('非必要字段缺失时仍可解析', () => { const value = parseBaiduWeatherResponse(BAIDU_FIXTURES.missingFields, config); expect(value.current?.feelsLike).toBeUndefined(); expect(value.daily[0].low).toBeUndefined() })
  it('百度业务错误按类别返回', () => { expect(() => parseBaiduWeatherResponse(BAIDU_FIXTURES.businessError, config)).toThrowError(expect.objectContaining({ code: 'PROVIDER_AUTH' })) })
  it('AK缺失错误不泄露密钥或请求URL', async () => { const provider = new BaiduWeatherProvider(''); let error: WeatherProviderError | null = null; try { await provider.fetchLocation(config) } catch (reason) { error = reason as WeatherProviderError } expect(error?.code).toBe('MISSING_AK'); expect(error?.message).not.toMatch(/ak=|api\.map\.baidu/i) })
  it('网络错误最多重试一次且日志无需完整URL', async () => { const fetcher = vi.fn().mockRejectedValue(new Error('offline')); const verified = { ...config, longitude: 1, latitude: 1, verification: { status: 'verified' as const, source: 'test', verifiedAt: '2030-01-01' } }; const provider = new BaiduWeatherProvider('fixture-ak', fetcher as typeof fetch, 5); await expect(provider.fetchLocation(verified)).rejects.toMatchObject({ code: 'NETWORK' }); expect(fetcher).toHaveBeenCalledTimes(2) })
  it('按地点原生坐标系请求且不把URL写入错误', async () => { let requested = ''; const fetcher = vi.fn(async (input: string | URL | Request) => { requested = String(input); return new Response(JSON.stringify(BAIDU_FIXTURES.sunny), { status: 200 }) }); const provider = new BaiduWeatherProvider('fixture-ak', fetcher as typeof fetch); const verified = { ...config, longitude: 120.1, latitude: 30.1, locator: { mode: 'coordinates' as const, coordinateType: 'wgs84' as const }, verification: { status: 'verified' as const, source: 'test', verifiedAt: '2030-01-01' } }; await provider.fetchLocation(verified); const url = new URL(requested); expect(url.searchParams.get('coordtype')).toBe('wgs84'); expect(url.searchParams.get('location')).toBe('120.1,30.1') })
})
