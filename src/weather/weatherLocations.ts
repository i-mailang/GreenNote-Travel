import { z } from 'zod'
import type { WeatherScene } from './weatherSchema'

export interface WeatherLocationConfig {
  locationId: string
  name: string
  longitude: number | null
  latitude: number | null
  fixtureCoordinates: { longitude: number; latitude: number }
  dayIds: string[]
  primaryDayIds: string[]
  scene: WeatherScene
  locator: { mode: 'coordinates'; coordinateType: 'bd09ll' | 'wgs84' | 'gcj02' }
  verification: { status: 'pending' | 'verified'; source: string; verifiedAt: string | null }
}

const WeatherLocationConfigSchema: z.ZodType<WeatherLocationConfig> = z.object({
  locationId: z.string().min(1), name: z.string().min(1), longitude: z.number().nullable(), latitude: z.number().nullable(),
  fixtureCoordinates: z.object({ longitude: z.number(), latitude: z.number() }), dayIds: z.array(z.string()).min(1), primaryDayIds: z.array(z.string()),
  scene: z.enum(['city', 'mountain', 'grassland', 'volcano', 'desert', 'return']), locator: z.object({ mode: z.literal('coordinates'), coordinateType: z.enum(['bd09ll', 'wgs84', 'gcj02']) }),
  verification: z.object({ status: z.enum(['pending', 'verified']), source: z.string(), verifiedAt: z.string().nullable() }),
})

export const TripWeatherConfigSchema = z.object({
  tripId: z.string().min(1),
  dayIds: z.array(z.string()).min(1),
  locationIds: z.array(z.string()).min(1),
  locations: z.array(WeatherLocationConfigSchema).min(1),
}).superRefine((value, ctx) => {
  const days = new Set(value.dayIds); const locations = new Set(value.locationIds)
  for (const location of value.locations) {
    if (!locations.has(location.locationId)) ctx.addIssue({ code: 'custom', message: `未知 locationId: ${location.locationId}` })
    for (const dayId of [...location.dayIds, ...location.primaryDayIds]) if (!days.has(dayId)) ctx.addIssue({ code: 'custom', message: `未知 dayId: ${dayId}` })
  }
})

export type TripWeatherConfig = z.infer<typeof TripWeatherConfigSchema>

export const DEMO_TRIP_WEATHER_CONFIG: TripWeatherConfig = TripWeatherConfigSchema.parse({
  tripId: 'demo-shanhai-3d',
  dayIds: ['demo-day-1', 'demo-day-2', 'demo-day-3'],
  locationIds: ['demo-coast', 'demo-ridge', 'demo-lake'],
  locations: [
    { locationId: 'demo-coast', name: 'Demo · 青屿海湾', longitude: null, latitude: null, fixtureCoordinates: { longitude: 120.1, latitude: 30.1 }, dayIds: ['demo-day-1'], primaryDayIds: ['demo-day-1'], scene: 'city', locator: { mode: 'coordinates', coordinateType: 'wgs84' }, verification: { status: 'pending', source: 'Fictional Demo coordinates', verifiedAt: null } },
    { locationId: 'demo-ridge', name: 'Demo · 松风岭', longitude: null, latitude: null, fixtureCoordinates: { longitude: 120.2, latitude: 30.2 }, dayIds: ['demo-day-2'], primaryDayIds: ['demo-day-2'], scene: 'mountain', locator: { mode: 'coordinates', coordinateType: 'wgs84' }, verification: { status: 'pending', source: 'Fictional Demo coordinates', verifiedAt: null } },
    { locationId: 'demo-lake', name: 'Demo · 镜湖步道', longitude: null, latitude: null, fixtureCoordinates: { longitude: 120.3, latitude: 30.3 }, dayIds: ['demo-day-3'], primaryDayIds: ['demo-day-3'], scene: 'return', locator: { mode: 'coordinates', coordinateType: 'wgs84' }, verification: { status: 'pending', source: 'Fictional Demo coordinates', verifiedAt: null } },
  ],
})

export const WEATHER_LOCATIONS = DEMO_TRIP_WEATHER_CONFIG.locations
export const weatherLocationsForDay = (dayId: string) => WEATHER_LOCATIONS.filter((location) => location.dayIds.includes(dayId))
export const primaryWeatherLocationForDay = (dayId: string) => WEATHER_LOCATIONS.find((location) => location.primaryDayIds.includes(dayId)) ?? weatherLocationsForDay(dayId)[0]
