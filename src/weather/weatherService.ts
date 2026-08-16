import type { WeatherLocationConfig } from './weatherLocations'
import type { PublicWeatherLocation, WeatherLocationSnapshot, WeatherSnapshot } from './weatherSchema'
import { WEATHER_SCHEMA_VERSION, WeatherSnapshotSchema, toPublicWeatherDTO } from './weatherSchema'

export interface WeatherProvider { name: 'mock' | 'baidu'; fetchLocation(config: WeatherLocationConfig): Promise<WeatherLocationSnapshot> }
export type RefreshOutcome = { snapshot: WeatherSnapshot; successCount: number; failureCount: number; reusedCount: number; changed: boolean }

const stable = (value: unknown): string => Array.isArray(value) ? `[${value.map(stable).join(',')}]` : value && typeof value === 'object' ? `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(',')}}` : JSON.stringify(value)
export function stableWeatherHash(locations: WeatherLocationSnapshot[] | PublicWeatherLocation[], messages: string[]): string { const text = stable({ locations, messages }); let hash = 2166136261; for (let index = 0; index < text.length; index += 1) { hash ^= text.charCodeAt(index); hash = Math.imul(hash, 16777619) }; return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}` }
export async function mapWithConcurrency<T, R>(items: T[], limit: number, worker: (item: T, index: number) => Promise<R>, batchDelayMs = 0): Promise<R[]> { const result: R[] = []; for (let start = 0; start < items.length; start += limit) { if (start && batchDelayMs) await new Promise((resolve) => setTimeout(resolve, batchDelayMs)); const batch = items.slice(start, start + limit); result.push(...await Promise.all(batch.map((item, offset) => worker(item, start + offset)))) }; return result }

export async function refreshWeatherSnapshot(options: { provider: WeatherProvider; locations: WeatherLocationConfig[]; tripId?: string; previous?: WeatherSnapshot | null; now: string; nextScheduledAt?: string | null; batchDelayMs?: number }): Promise<RefreshOutcome> {
  const { provider, locations, tripId = options.previous?.tripId ?? 'demo-shanhai-3d', previous = null, now, nextScheduledAt = null, batchDelayMs = 0 } = options
  const old = new Map(previous?.locations.map((item) => [item.locationId, item])); let successCount = 0; let reusedCount = 0
  const refreshed = await mapWithConcurrency(locations, 2, async (config) => { try { const value = await provider.fetchLocation(config); successCount += 1; return { ...value, status: 'ok' as const, errorCode: undefined } } catch (reason) { const prior = old.get(config.locationId); const errorCode = reason && typeof reason === 'object' && 'code' in reason ? String(reason.code) : 'PROVIDER_FAILED'; if (prior && prior.status !== 'unavailable' && (prior.current || prior.daily.length || prior.hourly.length)) { reusedCount += 1; return { ...prior, status: 'stale' as const, errorCode } }; return { locationId: config.locationId, name: config.name, dayIds: config.dayIds, scene: config.scene, current: null, daily: [], hourly: [], alerts: [], sourceUpdatedAt: null, status: 'unavailable' as const, errorCode } } }, batchDelayMs)
  const failureCount = locations.length - successCount; const status = successCount === locations.length ? 'ok' : successCount > 0 ? 'partial' : reusedCount > 0 ? 'stale' : 'unavailable'; const lastSuccessAt = successCount > 0 ? now : previous?.lastSuccessAt ?? null; const providerUpdatedAt = refreshed.map((x) => x.sourceUpdatedAt).filter((x): x is string => Boolean(x)).sort().at(-1) ?? previous?.providerUpdatedAt ?? null
  const publicMessages = ['天气快照仅供行程准备参考，请结合现场预警与实时导航复核。']; const hash = stableWeatherHash(refreshed, publicMessages)
  const snapshot = WeatherSnapshotSchema.parse({ schemaVersion: WEATHER_SCHEMA_VERSION, tripId, provider: provider.name, status, lastCheckedAt: now, lastSuccessAt, providerUpdatedAt, nextScheduledAt, contentHash: hash, locations: refreshed, publicMessages })
  return { snapshot, successCount, failureCount, reusedCount, changed: hash !== previous?.contentHash }
}

export function serializePublicWeather(snapshot: WeatherSnapshot) { return toPublicWeatherDTO(snapshot) }
export const isWithinWeatherWindow = (now: Date, startDate: string, endDate: string, leadDays: number) => { const first = new Date(`${startDate}T00:00:00+08:00`); first.setUTCDate(first.getUTCDate() - leadDays); const last = new Date(`${endDate}T23:59:59+08:00`); return now >= first && now <= last }
