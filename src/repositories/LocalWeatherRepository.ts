import { DEMO_TRIP_WEATHER_CONFIG, WEATHER_LOCATIONS } from '../weather/weatherLocations'
import { createMockWeatherSnapshot, type MockWeatherScenario } from '../weather/weatherFixtures'
import { MockWeatherProvider } from '../weather/mockWeatherProvider'
import { refreshWeatherSnapshot } from '../weather/weatherService'
import { toPublicWeatherDTO, type WeatherAdminSummary, type WeatherSnapshot } from '../weather/weatherSchema'
import type { WeatherRepository } from './WeatherRepository'
import { writeWeatherCache } from '../services/weatherCache'
import { storageKey } from '../config/appConfig'

export const LOCAL_WEATHER_KEY = storageKey('weather-mock-snapshot-v1')
const read = (): WeatherSnapshot | null => { try { return JSON.parse(localStorage.getItem(LOCAL_WEATHER_KEY) ?? 'null') } catch { return null } }
const summary = (snapshot: WeatherSnapshot): WeatherAdminSummary => ({
  snapshot: toPublicWeatherDTO(snapshot), provider: 'mock', akConfigured: false,
  counts: { ok: snapshot.locations.filter((x) => x.status === 'ok').length, stale: snapshot.locations.filter((x) => x.status === 'stale').length, unavailable: snapshot.locations.filter((x) => x.status === 'unavailable').length }, cooldownUntil: null,
})

export class LocalWeatherRepository implements WeatherRepository {
  async loadPublicWeather() { const snapshot = read() ?? createMockWeatherSnapshot(); const publicSnapshot = toPublicWeatherDTO(snapshot); writeWeatherCache(publicSnapshot); return publicSnapshot }
  async loadAdminWeather() { return summary(read() ?? createMockWeatherSnapshot()) }
  async refreshWeather(scenario: MockWeatherScenario = 'ok') {
    const previous = read() ?? createMockWeatherSnapshot()
    const result = await refreshWeatherSnapshot({ provider: new MockWeatherProvider(scenario), locations: WEATHER_LOCATIONS, tripId: DEMO_TRIP_WEATHER_CONFIG.tripId, previous, now: new Date().toISOString() })
    localStorage.setItem(LOCAL_WEATHER_KEY, JSON.stringify(result.snapshot)); writeWeatherCache(toPublicWeatherDTO(result.snapshot)); return summary(result.snapshot)
  }
}
