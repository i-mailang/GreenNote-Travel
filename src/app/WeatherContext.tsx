import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { dataMode } from '../infra/cloudbase'
import { CloudBaseWeatherRepository } from '../repositories/CloudBaseWeatherRepository'
import { LocalWeatherRepository } from '../repositories/LocalWeatherRepository'
import { readWeatherCache } from '../services/weatherCache'
import type { MockWeatherScenario } from '../weather/weatherFixtures'
import type { PublicWeatherSnapshot, WeatherAdminSummary } from '../weather/weatherSchema'
import { WeatherContext } from './weather-context'

export function WeatherProvider({ children, scope }: { children: ReactNode; scope: 'public' | 'admin' }) {
  const repository = useMemo(() => dataMode === 'cloud' ? new CloudBaseWeatherRepository() : new LocalWeatherRepository(), [])
  const [snapshot, setSnapshot] = useState<PublicWeatherSnapshot | null>(null); const [adminSummary, setAdminSummary] = useState<WeatherAdminSummary | null>(null)
  const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState(''); const [cachedAt, setCachedAt] = useState<string | null>(null)
  const retry = useCallback(async () => {
    setError(''); setCachedAt(null)
    try { if (scope === 'admin') { const value = await repository.loadAdminWeather(); setAdminSummary(value); setSnapshot(value.snapshot) } else setSnapshot(await repository.loadPublicWeather()) }
    catch { const cache = readWeatherCache(); if (cache) { setSnapshot(cache.snapshot); setCachedAt(cache.cachedAt); setError('天气服务暂时不可用，当前显示最后成功快照。') } else setError('尚无天气数据。') }
    finally { setLoading(false) }
  }, [repository, scope])
  useEffect(() => { const timer = window.setTimeout(() => void retry(), 0); return () => window.clearTimeout(timer) }, [retry])
  const refresh = useCallback(async (scenario?: MockWeatherScenario) => { setRefreshing(true); setError(''); try { const value = await repository.refreshWeather(scenario); setAdminSummary(value); setSnapshot(value.snapshot) } catch (reason) { setError(reason instanceof Error ? reason.message : '天气刷新失败。') } finally { setRefreshing(false) } }, [repository])
  const value = useMemo(() => ({ snapshot, adminSummary, loading, refreshing, error, cachedAt, retry, refresh }), [snapshot, adminSummary, loading, refreshing, error, cachedAt, retry, refresh])
  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>
}
