import { z } from 'zod'
import type { Trip } from '../types/trip'
import { CURRENT_TRIP_SCHEMA_VERSION } from './schemaVersion'

const visibilitySchema = z.enum(['public', 'admin', 'hidden', 'inherit'])
const stopVisibilitySchema = z.enum(['route', 'detail', 'admin', 'hidden'])
const phoneVisibilitySchema = z.enum(['public', 'admin', 'hidden'])
const timeSchema = z.string().regex(/^(|\d{2}:\d{2})$/, '时间必须为 HH:mm 或空字符串')
const optionalTimeSchema = timeSchema.optional()
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期必须为 YYYY-MM-DD')
const nonNegative = z.number().finite().nonnegative()

/** 只允许可安全在新标签页打开的 Web URL；空字符串代表未填写。 */
export const safeWebUrlSchema = z.string().refine((value) => {
  if (!value) return true
  try { return ['http:', 'https:'].includes(new URL(value).protocol) } catch { return false }
}, '链接必须是完整的 http 或 https 地址')

const homeSettingsSchema = z.object({
  subtitle: visibilitySchema, participants: visibilitySchema, vehicle: visibilitySchema,
  dateRange: visibilitySchema, countdown: visibilitySchema, status: visibilitySchema,
  notice: visibilitySchema, updatedAt: visibilitySchema, route: visibilitySchema,
  dayCards: visibilitySchema, credit: visibilitySchema,
})
const cardSettingsSchema = z.object({
  date: visibilitySchema, title: visibilitySchema, route: visibilitySchema,
  stay: visibilitySchema, departureTime: visibilitySchema, stops: visibilitySchema,
  status: visibilitySchema, reminder: visibilitySchema,
})
const detailSettingsSchema = z.object({
  route: visibilitySchema, schedule: visibilitySchema, stopStatus: visibilitySchema,
  duration: visibilitySchema, tickets: visibilitySchema, address: visibilitySchema,
  navigation: visibilitySchema, hotel: visibilitySchema, hotelPhone: visibilitySchema,
  meals: visibilitySchema, reminders: visibilitySchema, backup: visibilitySchema,
  internalNotes: visibilitySchema,
})

const imageSchema = z.object({
  src: safeWebUrlSchema.or(z.string().regex(/^\/(?!\/)/, '本地图片必须使用站点绝对路径')),
  alt: z.string().min(1),
  fallbackSrc: safeWebUrlSchema.or(z.string().regex(/^\/(?!\/)/)).optional(),
  credit: z.string().optional(),
})
const guideTableSchema = z.object({ columns: z.array(z.string()), rows: z.array(z.array(z.string())) })
const guideSectionSchema = z.object({ title: z.string().min(1), subtitle: z.string().optional(), paragraphs: z.array(z.string()).optional(), table: guideTableSchema.optional() })
const guideSchema = z.object({ title: z.string().min(1), subtitle: z.string(), overview: z.string(), sections: z.array(guideSectionSchema) })
const breakStopSchema = z.object({ name: z.string().min(1), plannedAt: optionalTimeSchema, durationMinutes: nonNegative.optional(), notes: z.string().optional() })
const drivingSchema = z.object({
  distanceKm: nonNegative.optional(), pureHours: nonNegative.optional(), plannedHours: nonNegative.optional(), toll: nonNegative.optional(),
  latestDeparture: optionalTimeSchema, breakStops: z.array(breakStopSchema).optional(), notes: z.string().optional(),
})
const roomSchema = z.object({ roomType: z.string().min(1), count: z.number().int().positive(), guests: z.number().int().positive().optional(), notes: z.string().optional() })
const candidateSchema = z.object({
  id: z.string().min(1), name: z.string().min(1), type: z.enum(['酒店', '公寓', '民宿', '整套公寓', '家庭套房', '其他']),
  roomCombinations: z.array(roomSchema).optional(), address: z.string().optional(), parking: z.string().optional(), totalPrice: nonNegative.optional(),
  freeCancelUntil: z.string().optional(), breakfast: z.string().optional(), phone: z.string().optional(), phoneVisibility: phoneVisibilitySchema.optional(),
  toNextStopMinutes: nonNegative.optional(), notes: z.string().optional(),
})
const accommodationSchema = z.object({
  city: z.string().optional(), area: z.string().optional(), summary: z.string().optional(), candidates: z.array(candidateSchema).optional(),
  parking: z.string().optional(), totalPrice: nonNegative.optional(), freeCancelUntil: z.string().optional(), breakfast: z.string().optional(),
  phone: z.string().optional(), phoneVisibility: phoneVisibilitySchema.optional(), toNextStopMinutes: nonNegative.optional(), notes: z.string().optional(),
})
const mealSchema = z.object({ primary: z.string().optional(), backups: z.array(z.string()).optional(), budgetPerPerson: nonNegative.optional(), parking: z.string().optional(), reservation: z.string().optional(), notes: z.string().optional() })
const riskSchema = z.object({ weather: z.string().optional(), traffic: z.string().optional(), reservation: z.string().optional(), physical: z.string().optional(), mainDelayPoint: z.string().optional(), backupTriggers: z.array(z.string()).optional(), internalNotes: z.string().optional() })
const weatherSchema = z.object({ summary: z.string().optional(), finalCheckAt: z.string().optional(), lastCheckedAt: z.string().optional(), source: safeWebUrlSchema.optional() })
const planSchema = z.object({ driving: drivingSchema.optional(), accommodation: accommodationSchema.optional(), meals: mealSchema.optional(), risks: riskSchema.optional(), weather: weatherSchema.optional() })
const hotelSchema = z.object({ name: z.string(), phone: z.string(), address: z.string() })
const stopSchema = z.object({
  id: z.string().min(1), name: z.string().min(1), type: z.enum(['集合', '行车', '景点', '酒店', '用餐', '休息']),
  status: z.enum(['待确认', '计划中', '已预约', '已完成']), arrivalTime: timeSchema, duration: z.string(), address: z.string(),
  navigationUrl: safeWebUrlSchema, ticketNotes: z.string(), internalNotes: z.string(), visibility: stopVisibilitySchema,
  entrance: z.string().optional(), openingHours: z.string().optional(), durationMinutes: nonNegative.optional(), ticket: z.string().optional(),
  reservation: z.string().optional(), parking: z.string().optional(), walkingIntensity: z.enum(['轻松', '适中', '较高']).optional(),
  weatherSensitivity: z.enum(['低', '中', '高']).optional(), backup: z.string().optional(), phone: z.string().optional(),
  phoneVisibility: phoneVisibilitySchema.optional(), image: imageSchema.optional(), summary: z.string(), guide: guideSchema.optional(),
})
const daySchema = z.object({
  id: z.string().min(1), order: z.number().int().positive(), date: dateSchema, title: z.string().min(1),
  origin: z.string(), destination: z.string(), stayCity: z.string(), departureTime: timeSchema, arrivalTime: timeSchema,
  status: z.enum(['待确认', '已确认', '进行中', '已完成']), reminder: z.string(), hotel: hotelSchema, meals: z.string(),
  reminders: z.string(), backupPlan: z.string(), summary: z.string(), intensity: z.string(),
  options: z.array(z.object({ title: z.string().min(1), description: z.string() })), choiceBasis: z.string(), verificationItems: z.array(z.string()), plan: planSchema.optional(),
  displayOverrides: z.object({ card: cardSettingsSchema.partial().optional(), detail: detailSettingsSchema.partial().optional() }),
  stops: z.array(stopSchema),
})

export const TripSchema: z.ZodType<Trip> = z.object({
  schemaVersion: z.literal(CURRENT_TRIP_SCHEMA_VERSION), id: z.string().min(1), title: z.string().min(1), subtitle: z.string(),
  startDate: dateSchema, endDate: dateSchema, participantCount: z.number().int().nonnegative(), vehicle: z.string(),
  status: z.enum(['筹备中', '即将出发', '旅途中', '已结束']), globalNotice: z.string(), credit: z.string(), updatedAt: z.string().min(1),
  displaySettings: z.object({ home: homeSettingsSchema, card: cardSettingsSchema, detail: detailSettingsSchema }), days: z.array(daySchema),
})
