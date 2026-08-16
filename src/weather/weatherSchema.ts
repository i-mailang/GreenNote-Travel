import { z } from 'zod'

export const WEATHER_SCHEMA_VERSION = 1 as const
export const WeatherStatusSchema = z.enum(['ok', 'partial', 'stale', 'unavailable'])
export const WeatherSceneSchema = z.enum(['city', 'mountain', 'grassland', 'volcano', 'desert', 'return'])

const optionalNumber = z.number().finite().nullable().optional()
const optionalText = z.string().trim().min(1).nullable().optional()

export const WeatherCurrentSchema = z.object({
  text: optionalText, temperature: optionalNumber, feelsLike: optionalNumber, humidity: optionalNumber,
  windDirection: optionalText, windScale: optionalText, windSpeed: optionalNumber,
  visibility: optionalNumber, precipitation: optionalNumber,
})

export const WeatherDailySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), dayText: optionalText, nightText: optionalText,
  high: optionalNumber, low: optionalNumber, dayWindDirection: optionalText, dayWindScale: optionalText,
  nightWindDirection: optionalText, nightWindScale: optionalText,
})

export const WeatherHourlySchema = z.object({
  time: z.string().min(1), text: optionalText, temperature: optionalNumber, humidity: optionalNumber,
  windDirection: optionalText, windScale: optionalText, precipitation: optionalNumber,
})

export const WeatherAlertSchema = z.object({
  title: z.string().min(1), type: optionalText, level: optionalText, publishedAt: optionalText,
  expiresAt: optionalText, description: optionalText,
})

export const WeatherLocationSnapshotSchema = z.object({
  locationId: z.string().min(1), name: z.string().min(1), dayIds: z.array(z.string()).min(1),
  scene: WeatherSceneSchema, current: WeatherCurrentSchema.nullable().optional(),
  daily: z.array(WeatherDailySchema).max(7), hourly: z.array(WeatherHourlySchema).max(24),
  alerts: z.array(WeatherAlertSchema).max(8), sourceUpdatedAt: z.string().nullable(),
  status: z.enum(['ok', 'stale', 'unavailable']), errorCode: z.string().optional(),
})

export const WeatherSnapshotSchema = z.object({
  schemaVersion: z.literal(WEATHER_SCHEMA_VERSION), tripId: z.string().min(1),
  provider: z.enum(['mock', 'baidu']), status: WeatherStatusSchema,
  lastCheckedAt: z.string(), lastSuccessAt: z.string().nullable(), providerUpdatedAt: z.string().nullable(),
  nextScheduledAt: z.string().nullable(), contentHash: z.string().min(1),
  locations: z.array(WeatherLocationSnapshotSchema).max(50), publicMessages: z.array(z.string()).max(12),
})

export type WeatherStatus = z.infer<typeof WeatherStatusSchema>
export type WeatherScene = z.infer<typeof WeatherSceneSchema>
export type WeatherCurrent = z.infer<typeof WeatherCurrentSchema>
export type WeatherDaily = z.infer<typeof WeatherDailySchema>
export type WeatherHourly = z.infer<typeof WeatherHourlySchema>
export type WeatherAlert = z.infer<typeof WeatherAlertSchema>
export type WeatherLocationSnapshot = z.infer<typeof WeatherLocationSnapshotSchema>
export type WeatherSnapshot = z.infer<typeof WeatherSnapshotSchema>

export type PublicWeatherLocation = Omit<WeatherLocationSnapshot, 'errorCode'>
export interface PublicWeatherSnapshot extends Omit<WeatherSnapshot, 'locations'> { locations: PublicWeatherLocation[] }
export interface WeatherAdminSummary {
  snapshot: PublicWeatherSnapshot | null
  provider: 'mock' | 'baidu'
  akConfigured: boolean
  counts: { ok: number; stale: number; unavailable: number }
  cooldownUntil: string | null
}

export function toPublicWeatherDTO(snapshot: WeatherSnapshot): PublicWeatherSnapshot {
  const parsed = WeatherSnapshotSchema.parse(snapshot)
  return { ...parsed, locations: parsed.locations.map((item) => { const { errorCode, ...location } = item; void errorCode; return location }) }
}
