import { DEMO_TRIP_WEATHER_CONFIG, type WeatherLocationConfig } from './weatherLocations'
import { createMockWeatherSnapshot, type MockWeatherScenario } from './weatherFixtures'
import type { WeatherProvider } from './weatherService'

export class MockWeatherProvider implements WeatherProvider {
  readonly name = 'mock' as const
  constructor(private scenario: MockWeatherScenario = 'ok') {}
  async fetchLocation(config: WeatherLocationConfig) {
    const value = createMockWeatherSnapshot(this.scenario).locations.find((item) => item.locationId === config.locationId)
    if (!value || value.status === 'unavailable' || (this.scenario === 'partial' && config.locationId === DEMO_TRIP_WEATHER_CONFIG.locationIds.at(-1))) throw Object.assign(new Error('Mock provider failure'), { code: 'MOCK_FAILURE' })
    return structuredClone(value)
  }
}
