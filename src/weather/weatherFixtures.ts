import { WEATHER_LOCATIONS } from './weatherLocations'
import { DEMO_TRIP_WEATHER_CONFIG } from './weatherLocations'
import { WEATHER_SCHEMA_VERSION, WeatherSnapshotSchema, type WeatherLocationSnapshot, type WeatherSnapshot } from './weatherSchema'
import { stableWeatherHash } from './weatherService'
import { demoTrip } from '../data/demoTrip'

export type MockWeatherScenario = 'ok' | 'rain' | 'thunder-alert' | 'heat' | 'wind' | 'missing-fields' | 'partial' | 'stale' | 'unavailable'

const dates = demoTrip.days.map((day) => day.date)
export function createMockWeatherSnapshot(scenario: MockWeatherScenario = 'ok', checkedAt = `${demoTrip.startDate}T00:00:00.000Z`): WeatherSnapshot {
  const locations: WeatherLocationSnapshot[] = WEATHER_LOCATIONS.map((config, index) => {
    const text = scenario === 'rain' ? '小雨' : scenario === 'thunder-alert' ? '雷阵雨' : '晴'
    const high = scenario === 'heat' && config.scene === 'desert' ? 37 : 25 + (index % 5)
    const low = scenario === 'missing-fields' ? null : config.scene === 'grassland' ? 10 : 16 + (index % 3)
    const windScale = scenario === 'wind' ? '6级' : '3级'
    const status = scenario === 'partial' && index >= Math.ceil(WEATHER_LOCATIONS.length / 2) ? 'stale' : scenario === 'unavailable' ? 'unavailable' : scenario === 'stale' ? 'stale' : 'ok'
    return {
      locationId: config.locationId, name: config.name, dayIds: config.dayIds, scene: config.scene, status,
      errorCode: status === 'ok' ? undefined : status === 'stale' ? 'MOCK_PARTIAL_FAILURE' : 'MOCK_UNAVAILABLE',
      current: status === 'unavailable' ? null : { text, temperature: high - 3, feelsLike: scenario === 'missing-fields' ? null : high - 2, humidity: 48 + index, windDirection: '西北风', windScale, windSpeed: null, visibility: 12000, precipitation: text.includes('雨') ? 1.2 : 0 },
      daily: status === 'unavailable' ? [] : dates.map((date) => ({ date, dayText: text, nightText: text === '晴' ? '多云' : text, high, low, dayWindDirection: '西北风', dayWindScale: windScale, nightWindDirection: '北风', nightWindScale: '2级' })),
      hourly: status === 'unavailable' ? [] : Array.from({ length: 24 }, (_, hour) => ({ time: `${demoTrip.startDate}T${String(hour).padStart(2, '0')}:00:00+08:00`, text, temperature: high - 5 + Math.round(hour / 6), humidity: 55, windDirection: '西北风', windScale, precipitation: text.includes('雨') ? .4 : 0 })),
      alerts: scenario === 'thunder-alert' && index === 1 ? [{ title: '雷电黄色预警（测试）', type: '雷电', level: '黄色', publishedAt: checkedAt, expiresAt: null, description: 'Mock Fixture，仅用于本地测试。' }] : [],
      sourceUpdatedAt: status === 'unavailable' ? null : checkedAt,
    }
  })
  const ok = locations.filter((x) => x.status === 'ok').length
  const status = ok === 0 ? scenario === 'stale' ? 'stale' : 'unavailable' : ok < locations.length ? 'partial' : scenario === 'stale' ? 'stale' : 'ok'
  const base: WeatherSnapshot = { schemaVersion: WEATHER_SCHEMA_VERSION, tripId: DEMO_TRIP_WEATHER_CONFIG.tripId, provider: 'mock', status, lastCheckedAt: checkedAt, lastSuccessAt: ok ? checkedAt : null, providerUpdatedAt: ok ? checkedAt : null, nextScheduledAt: null, contentHash: 'pending', locations, publicMessages: ['Mock 天气仅用于 Local Demo，不代表真实预报。'] }
  base.contentHash = stableWeatherHash(base.locations, base.publicMessages)
  return WeatherSnapshotSchema.parse(base)
}

export const BAIDU_FIXTURES = {
  sunny: { status: 0, result: { now: { text: '晴', temp: 28, feels_like: 29, rh: 42, wind_class: '3级', wind_dir: '西北风', prec_1h: 0, vis: 12000, uptime: '20300516080000' }, forecasts: [{ date: demoTrip.startDate, high: 30, low: 18, wc_day: '3级', wc_night: '2级', wd_day: '西北风', wd_night: '北风', text_day: '晴', text_night: '多云' }], forecast_hours: [{ text: '晴', temp_fc: 28, wind_class: '3级', wind_dir: '西北风', rh: 42, prec_1h: 0, data_time: `${demoTrip.startDate} 08:00:00` }], alerts: [] } },
  missingFields: { status: 0, result: { now: { text: '多云', temp: 25, uptime: '20300516080000' }, forecasts: [{ date: demoTrip.startDate, text_day: '多云' }], forecast_hours: [], alerts: [] } },
  businessError: { status: 401, message: 'AK invalid' },
} as const
