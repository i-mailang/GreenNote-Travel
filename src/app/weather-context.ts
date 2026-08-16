import { createContext, useContext } from 'react'
import type { MockWeatherScenario } from '../weather/weatherFixtures'
import type { PublicWeatherSnapshot, WeatherAdminSummary } from '../weather/weatherSchema'

export interface WeatherContextValue {
  snapshot: PublicWeatherSnapshot | null; adminSummary: WeatherAdminSummary | null; loading: boolean; refreshing: boolean;
  error: string; cachedAt: string | null; retry: () => Promise<void>; refresh: (scenario?: MockWeatherScenario) => Promise<void>
}
export const WeatherContext = createContext<WeatherContextValue | null>(null)
export function useWeather() { const value = useContext(WeatherContext); if (!value) throw new Error('useWeather 必须在 WeatherProvider 中使用'); return value }
