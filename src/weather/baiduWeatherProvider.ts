import { z } from 'zod'
import type { WeatherLocationConfig } from './weatherLocations'
import type { WeatherLocationSnapshot } from './weatherSchema'
import type { WeatherProvider } from './weatherService'

const nullableNumber = z.union([z.number(), z.string().transform(Number)]).transform((value) => value === 999999 || !Number.isFinite(value) ? null : value).optional()
const nullableText = z.string().transform((value) => value === '暂无' ? null : value).optional()
const BaiduResponseSchema = z.object({
  status: z.number(), message: z.string().optional(), result: z.object({
    now: z.object({ text: nullableText, temp: nullableNumber, feels_like: nullableNumber, rh: nullableNumber, wind_class: nullableText, wind_dir: nullableText, wind_speed: nullableNumber, prec_1h: nullableNumber, vis: nullableNumber, uptime: nullableText }).passthrough().optional(),
    forecasts: z.array(z.object({ date: z.string(), high: nullableNumber, low: nullableNumber, wc_day: nullableText, wc_night: nullableText, wd_day: nullableText, wd_night: nullableText, text_day: nullableText, text_night: nullableText }).passthrough()).optional(),
    forecast_hours: z.array(z.object({ text: nullableText, temp_fc: nullableNumber, wind_class: nullableText, wind_dir: nullableText, rh: nullableNumber, prec_1h: nullableNumber, data_time: z.string() }).passthrough()).optional(),
    alerts: z.array(z.object({ title: z.string(), type: nullableText, level: nullableText, desc: nullableText, pub_time: nullableText, effective: nullableText }).passthrough()).optional(),
  }).passthrough().optional(),
}).passthrough()

export class WeatherProviderError extends Error { constructor(public code: string, message: string, public retryable = false) { super(message) } }
const baiduLocalTimeToIso = (value: string | null | undefined) => {
  if (!value) return value
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) return `${value.replace(' ', 'T')}+08:00`
  if (/^\d{14}$/.test(value)) return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(8, 10)}:${value.slice(10, 12)}:${value.slice(12, 14)}+08:00`
  return value
}
export function parseBaiduWeatherResponse(raw: unknown, config: WeatherLocationConfig): WeatherLocationSnapshot {
  const response = BaiduResponseSchema.parse(raw)
  if (response.status !== 0 || !response.result) throw new WeatherProviderError(response.status === 401 ? 'PROVIDER_AUTH' : response.status === 403 ? 'PROVIDER_PERMISSION' : 'PROVIDER_BUSINESS', '百度天气服务返回业务错误。')
  const result = response.result
  return {
    locationId: config.locationId, name: config.name, dayIds: config.dayIds, scene: config.scene, status: 'ok', errorCode: undefined,
    current: result.now ? { text: result.now.text, temperature: result.now.temp, feelsLike: result.now.feels_like, humidity: result.now.rh, windDirection: result.now.wind_dir, windScale: result.now.wind_class, windSpeed: result.now.wind_speed, visibility: result.now.vis, precipitation: result.now.prec_1h } : null,
    daily: (result.forecasts ?? []).slice(0, 7).map((item) => ({ date: item.date, dayText: item.text_day, nightText: item.text_night, high: item.high, low: item.low, dayWindDirection: item.wd_day, dayWindScale: item.wc_day, nightWindDirection: item.wd_night, nightWindScale: item.wc_night })),
    hourly: (result.forecast_hours ?? []).slice(0, 24).map((item) => ({ time: baiduLocalTimeToIso(item.data_time)!, text: item.text, temperature: item.temp_fc, humidity: item.rh, windDirection: item.wind_dir, windScale: item.wind_class, precipitation: item.prec_1h })),
    alerts: (result.alerts ?? []).slice(0, 8).map((item) => ({ title: item.title, type: item.type, level: item.level, publishedAt: baiduLocalTimeToIso(item.pub_time), expiresAt: baiduLocalTimeToIso(item.effective), description: item.desc })),
    sourceUpdatedAt: baiduLocalTimeToIso(result.now?.uptime) ?? null,
  }
}
export class BaiduWeatherProvider implements WeatherProvider {
  readonly name = 'baidu' as const
  constructor(private ak = '', private fetcher: typeof fetch = fetch, private timeoutMs = 8000) {}
  async fetchLocation(config: WeatherLocationConfig): Promise<WeatherLocationSnapshot> {
    if (!this.ak) throw new WeatherProviderError('MISSING_AK', '天气服务尚未配置。')
    if (config.verification.status !== 'verified' || config.longitude === null || config.latitude === null) throw new WeatherProviderError('COORDINATES_UNVERIFIED', '天气地点坐标尚未核验。')
    const params = new URLSearchParams({ location: `${config.longitude},${config.latitude}`, coordtype: config.locator.coordinateType, data_type: 'all', output: 'json', ak: this.ak })
    const endpoint = `https://api.map.baidu.com/weather/v1/?${params}`
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), this.timeoutMs)
      try {
        const response = await this.fetcher(endpoint, { signal: controller.signal })
        if (!response.ok) { const retryable = response.status >= 500; if (retryable && attempt === 0) continue; throw new WeatherProviderError(`HTTP_${response.status}`, '天气服务网络响应异常。', retryable) }
        return parseBaiduWeatherResponse(await response.json(), config)
      } catch (reason) {
        if (reason instanceof WeatherProviderError && !reason.retryable) throw reason
        if (attempt === 1) throw new WeatherProviderError(reason instanceof Error && reason.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK', '天气服务网络请求失败。', true)
      } finally { clearTimeout(timer) }
    }
    throw new WeatherProviderError('NETWORK', '天气服务网络请求失败。', true)
  }
}
