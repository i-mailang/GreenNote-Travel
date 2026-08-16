import { callCloudFunction } from '../infra/cloudbase'
import { writeWeatherCache } from '../services/weatherCache'
import { WeatherSnapshotSchema, type PublicWeatherSnapshot, type WeatherAdminSummary } from '../weather/weatherSchema'
import type { WeatherRepository } from './WeatherRepository'

const validatePublic = (value: unknown) => WeatherSnapshotSchema.parse(value) as PublicWeatherSnapshot
export class CloudBaseWeatherRepository implements WeatherRepository {
  async loadPublicWeather() { const snapshot = validatePublic(await callCloudFunction('getPublicWeather')); writeWeatherCache(snapshot); return snapshot }
  async loadAdminWeather() { return callCloudFunction<WeatherAdminSummary>('refreshTripWeather', { statusOnly: true, manual: true }) }
  async refreshWeather() { const result = await callCloudFunction<WeatherAdminSummary>('refreshTripWeather', { manual: true }); if (result.snapshot) writeWeatherCache(result.snapshot); return result }
}
