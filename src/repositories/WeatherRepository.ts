import type { MockWeatherScenario } from '../weather/weatherFixtures'
import type { PublicWeatherSnapshot, WeatherAdminSummary } from '../weather/weatherSchema'

export interface WeatherRepository {
  loadPublicWeather(): Promise<PublicWeatherSnapshot>
  loadAdminWeather(): Promise<WeatherAdminSummary>
  refreshWeather(scenario?: MockWeatherScenario): Promise<WeatherAdminSummary>
}
