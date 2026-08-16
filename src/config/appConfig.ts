import { z } from 'zod'
import { APP_CONFIG_DEFAULTS } from './appConfigDefaults'

const refreshTimesSchema = z.object({
  preTrip: z.array(z.string().regex(/^\d{2}:\d{2}$/)),
  inTrip: z.array(z.string().regex(/^\d{2}:\d{2}$/)),
})

export const AppConfigSchema = z.object({
  app: z.object({ name: z.string().min(1), shortName: z.string().min(1), description: z.string().min(1), locale: z.string().min(1), timeZone: z.string().min(1) }),
  theme: z.object({ themeColor: z.string().min(1), backgroundColor: z.string().min(1) }),
  features: z.object({ admin: z.boolean(), cloud: z.boolean(), weather: z.boolean(), pwa: z.boolean() }),
  storage: z.object({ namespace: z.string().regex(/^[a-z0-9.-]+$/) }),
  weather: z.object({ enabled: z.boolean(), provider: z.enum(['mock', 'baidu']), leadDays: z.number().int().nonnegative(), refreshTimes: refreshTimesSchema }),
  deployment: z.object({ supportsStaticHosting: z.boolean(), supportsCloudFunctions: z.boolean(), supportsCloudDatabase: z.boolean() }),
})

export type AppConfig = z.infer<typeof AppConfigSchema>

export const DEFAULT_APP_CONFIG: AppConfig = AppConfigSchema.parse(APP_CONFIG_DEFAULTS)

const envBoolean = (value: string | undefined, fallback: boolean) => value === undefined ? fallback : value === 'true'

export function resolveAppConfig(env: Record<string, string | undefined> = {}): AppConfig {
  const cloud = envBoolean(env.VITE_FEATURE_CLOUD, DEFAULT_APP_CONFIG.features.cloud)
  const weather = envBoolean(env.VITE_FEATURE_WEATHER, DEFAULT_APP_CONFIG.features.weather)
  const provider = env.VITE_WEATHER_PROVIDER === 'baidu' ? 'baidu' : DEFAULT_APP_CONFIG.weather.provider
  return AppConfigSchema.parse({ ...DEFAULT_APP_CONFIG, features: { ...DEFAULT_APP_CONFIG.features, cloud, weather }, weather: { ...DEFAULT_APP_CONFIG.weather, enabled: weather, provider } })
}

const runtimeEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}
export const appConfig = resolveAppConfig(runtimeEnv)
export const storageKey = (suffix: string) => `${appConfig.storage.namespace}.${suffix}`
