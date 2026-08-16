import { z } from 'zod'
import { mergeDisplaySettings } from '../data/defaults'
import { CURRENT_TRIP_SCHEMA_VERSION } from '../data/schemaVersion'
import { TripSchema } from '../data/tripSchema'
import type { Trip } from '../types/trip'

export type TripDataErrorCode = 'JSON_SYNTAX' | 'MISSING_STRUCTURE' | 'FIELD_TYPE' | 'VERSION_TOO_NEW' | 'MIGRATION_FAILED'

const ERROR_MESSAGES: Record<TripDataErrorCode, string> = {
  JSON_SYNTAX: 'JSON 文件语法不正确，请检查文件是否完整。',
  MISSING_STRUCTURE: '旅行数据缺少必要结构，请使用本项目导出的 JSON 文件。',
  FIELD_TYPE: '旅行数据中有字段类型或格式不正确。',
  VERSION_TOO_NEW: '这份旅行数据版本高于当前程序支持的版本，请升级程序后再试。',
  MIGRATION_FAILED: '旧版旅行数据迁移失败，请恢复内置内容或检查原始文件。',
}

export class TripDataError extends Error {
  constructor(public readonly code: TripDataErrorCode, options?: { cause?: unknown; details?: string[] }) {
    super(ERROR_MESSAGES[code], { cause: options?.cause })
    this.name = 'TripDataError'
    this.details = options?.details ?? []
  }
  readonly details: string[]
}

export type SafeParseTripResult = { success: true; data: Trip } | { success: false; error: TripDataError }

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const cloneUnknown = (value: unknown): unknown => structuredClone(value)

function migrateV0ToV1(raw: Record<string, unknown>): Record<string, unknown> {
  return { ...cloneUnknown(raw) as Record<string, unknown>, schemaVersion: 1 }
}

function migrateV1ToV2(raw: Record<string, unknown>): Record<string, unknown> {
  const days = Array.isArray(raw.days) ? raw.days.map((value) => {
    if (!isRecord(value)) return value
    const hotel = isRecord(value.hotel) ? value.hotel : {}
    const plan = isRecord(value.plan) ? value.plan : {
      accommodation: {
        city: typeof value.stayCity === 'string' ? value.stayCity : '',
        summary: typeof hotel.name === 'string' ? hotel.name : '',
        phone: typeof hotel.phone === 'string' ? hotel.phone : '',
        phoneVisibility: 'admin',
      },
      meals: { primary: typeof value.meals === 'string' ? value.meals : '' },
      risks: {
        backupTriggers: typeof value.backupPlan === 'string' && value.backupPlan ? [value.backupPlan] : [],
        internalNotes: typeof value.reminders === 'string' ? value.reminders : '',
      },
    }
    const stops = Array.isArray(value.stops) ? value.stops.map((stop) => isRecord(stop) ? {
      ...stop,
      ticket: typeof stop.ticketNotes === 'string' ? stop.ticketNotes : '',
      phoneVisibility: 'admin',
    } : stop) : value.stops
    return { ...value, plan, stops }
  }) : raw.days
  return { ...cloneUnknown(raw) as Record<string, unknown>, schemaVersion: 2, days }
}

function migrateV2ToV3(raw: Record<string, unknown>): Record<string, unknown> {
  const days = Array.isArray(raw.days) ? raw.days.map((value) => {
    if (!isRecord(value)) return value
    const stops = Array.isArray(value.stops) ? value.stops.map((stop) => isRecord(stop) ? { summary: '', ...stop } : stop) : value.stops
    return { summary: '', intensity: '', options: [], choiceBasis: '', verificationItems: [], ...value, stops }
  }) : raw.days
  return { ...cloneUnknown(raw) as Record<string, unknown>, schemaVersion: 3, days }
}

/** 纯迁移入口：无版本/v0 → v1 → v2；未来版本明确拒绝。 */
export function migrateTrip(raw: unknown): unknown {
  if (!isRecord(raw)) return cloneUnknown(raw)
  const version = raw.schemaVersion
  if (version === undefined || version === 0) return migrateV2ToV3(migrateV1ToV2(migrateV0ToV1(raw)))
  if (typeof version !== 'number' || !Number.isInteger(version)) throw new TripDataError('FIELD_TYPE')
  if (version > CURRENT_TRIP_SCHEMA_VERSION) throw new TripDataError('VERSION_TOO_NEW')
  if (version < 0) throw new TripDataError('MIGRATION_FAILED')
  if (version === CURRENT_TRIP_SCHEMA_VERSION) return cloneUnknown(raw)
  if (version === 1) return migrateV2ToV3(migrateV1ToV2(raw))
  if (version === 2) return migrateV2ToV3(raw)
  throw new TripDataError('MIGRATION_FAILED')
}

function normalizeStop(raw: unknown): unknown {
  if (!isRecord(raw)) return raw
  return {
    arrivalTime: '', duration: '', address: '', navigationUrl: '', ticketNotes: '', internalNotes: '',
    visibility: 'route', phoneVisibility: 'admin', summary: '',
    ...raw,
  }
}

function normalizeDay(raw: unknown): unknown {
  if (!isRecord(raw)) return raw
  const hotel = raw.hotel === undefined ? { name: '', phone: '', address: '' } : isRecord(raw.hotel)
    ? { name: '', phone: '', address: '', ...raw.hotel }
    : raw.hotel
  return {
    departureTime: '', arrivalTime: '', reminder: '', meals: '', reminders: '', backupPlan: '', summary: '', intensity: '', options: [], choiceBasis: '', verificationItems: [],
    displayOverrides: {},
    ...raw,
    hotel,
    stops: Array.isArray(raw.stops) ? raw.stops.map(normalizeStop) : raw.stops,
  }
}

/** 纯规范化入口：深合并新增展示配置，并补齐可安全默认的非核心字段。 */
export function normalizeTrip(raw: unknown): unknown {
  if (!isRecord(raw)) return raw
  const normalizedDays = Array.isArray(raw.days) ? raw.days.map(normalizeDay) : raw.days
  if (raw.displaySettings !== undefined && !isRecord(raw.displaySettings)) {
    return { ...raw, days: normalizedDays }
  }
  const settings = isRecord(raw.displaySettings) ? raw.displaySettings : {}
  const normalizedSettings = mergeDisplaySettings({
    home: isRecord(settings.home) ? settings.home : undefined,
    card: isRecord(settings.card) ? settings.card : undefined,
    detail: isRecord(settings.detail) ? settings.detail : undefined,
  } as Parameters<typeof mergeDisplaySettings>[0])
  return {
    ...raw,
    displaySettings: normalizedSettings,
    days: normalizedDays,
  }
}

function classifyZodError(error: z.ZodError): TripDataError {
  const details = error.issues.map((issue) => `${issue.path.join('.') || '根对象'}：${issue.message}`)
  const missing = error.issues.some((issue) => issue.code === 'invalid_type' && issue.message.includes('received undefined'))
  return new TripDataError(missing ? 'MISSING_STRUCTURE' : 'FIELD_TYPE', { cause: error, details })
}

/** unknown → 版本迁移 → 默认值规范化 → Zod 校验 → Trip。 */
export function parseTripData(raw: unknown): Trip {
  try {
    const migrated = migrateTrip(raw)
    const normalized = normalizeTrip(migrated)
    const result = TripSchema.safeParse(normalized)
    if (!result.success) throw classifyZodError(result.error)
    return result.data
  } catch (error) {
    if (error instanceof TripDataError) throw error
    throw new TripDataError('MIGRATION_FAILED', { cause: error })
  }
}

export function safeParseTripData(raw: unknown): SafeParseTripResult {
  try { return { success: true, data: parseTripData(raw) } }
  catch (error) { return { success: false, error: error instanceof TripDataError ? error : new TripDataError('MIGRATION_FAILED', { cause: error }) } }
}

export function parseTripJson(text: string): Trip {
  let raw: unknown
  try { raw = JSON.parse(text) }
  catch (error) { throw new TripDataError('JSON_SYNTAX', { cause: error }) }
  return parseTripData(raw)
}
