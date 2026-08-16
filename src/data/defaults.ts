import type { CardField, DetailField, DisplaySettings, HomeField, Visibility } from '../types/trip'

export const HOME_FIELDS: readonly HomeField[] = ['subtitle', 'participants', 'vehicle', 'dateRange', 'countdown', 'status', 'notice', 'updatedAt', 'route', 'dayCards', 'credit']
export const CARD_FIELDS: readonly CardField[] = ['date', 'title', 'route', 'stay', 'departureTime', 'stops', 'status', 'reminder']
export const DETAIL_FIELDS: readonly DetailField[] = ['route', 'schedule', 'stopStatus', 'duration', 'tickets', 'address', 'navigation', 'hotel', 'hotelPhone', 'meals', 'reminders', 'backup', 'internalNotes']

const visibilityRecord = <T extends string>(keys: readonly T[], value: Visibility = 'public') =>
  Object.fromEntries(keys.map((key) => [key, value])) as Record<T, Visibility>

/** 系统级完整默认值：基础旅行内容公开，电话和内部备注默认不公开。 */
export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  home: visibilityRecord(HOME_FIELDS),
  card: visibilityRecord(CARD_FIELDS),
  detail: {
    ...visibilityRecord(DETAIL_FIELDS),
    hotelPhone: 'admin',
    internalNotes: 'admin',
  },
}

export function mergeDisplaySettings(input?: Partial<{
  home: Partial<Record<HomeField, Visibility>>
  card: Partial<Record<CardField, Visibility>>
  detail: Partial<Record<DetailField, Visibility>>
}>): DisplaySettings {
  return {
    home: { ...DEFAULT_DISPLAY_SETTINGS.home, ...input?.home },
    card: { ...DEFAULT_DISPLAY_SETTINGS.card, ...input?.card },
    detail: { ...DEFAULT_DISPLAY_SETTINGS.detail, ...input?.detail },
  }
}
