import { WeatherSnapshotSchema, type PublicWeatherSnapshot } from '../weather/weatherSchema'
import { storageKey } from '../config/appConfig'

export const PUBLIC_WEATHER_CACHE_KEY = storageKey('last-known-public-weather-v1')
export interface CachedPublicWeather { snapshot: PublicWeatherSnapshot; cachedAt: string }

export function writeWeatherCache(snapshot: PublicWeatherSnapshot) {
  localStorage.setItem(PUBLIC_WEATHER_CACHE_KEY, JSON.stringify({ snapshot, cachedAt: new Date().toISOString() }))
}
export function readWeatherCache(): CachedPublicWeather | null {
  try {
    const value = JSON.parse(localStorage.getItem(PUBLIC_WEATHER_CACHE_KEY) ?? 'null') as CachedPublicWeather | null
    if (!value?.cachedAt) return null
    return { snapshot: WeatherSnapshotSchema.parse(value.snapshot), cachedAt: value.cachedAt }
  } catch { return null }
}
