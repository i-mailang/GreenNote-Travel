import type { PublicWeatherLocation, PublicWeatherSnapshot } from './weatherSchema'
import { primaryWeatherLocationForDay, weatherLocationsForDay } from './weatherLocations'

const asBeijingInstant = (value: string) => {
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? `${value.replace(' ', 'T')}+08:00`
    : /^\d{14}$/.test(value)
      ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(8, 10)}:${value.slice(10, 12)}:${value.slice(12, 14)}+08:00`
      : value
  const date = new Date(normalized)
  return Number.isFinite(date.getTime()) ? date : null
}

export const formatBeijingTime = (value: string | null | undefined) => {
  if (!value) return '暂无'
  const date = asBeijingInstant(value)
  return date
    ? new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
    : '时间待定'
}
export const weatherDailyForDate = (location: PublicWeatherLocation, date: string) => location.daily.find((item) => item.date === date)
export const weatherLocationsForDaySnapshot = (snapshot: PublicWeatherSnapshot | null, dayId: string) => {
  if (!snapshot) return []
  const ids = new Set(weatherLocationsForDay(dayId).map((item) => item.locationId))
  return snapshot.locations.filter((item) => ids.has(item.locationId))
}
export const primaryWeatherForDay = (snapshot: PublicWeatherSnapshot | null, dayId: string) => {
  const config = primaryWeatherLocationForDay(dayId)
  return config ? snapshot?.locations.find((item) => item.locationId === config.locationId) : undefined
}
export const isWeatherSnapshotStale = (snapshot: PublicWeatherSnapshot, now = Date.now()) => {
  if (!snapshot.lastSuccessAt) return true
  const updatedAt = new Date(snapshot.lastSuccessAt).getTime()
  return !Number.isFinite(updatedAt) || now - updatedAt > 12 * 60 * 60 * 1000
}
export const weatherStatusText = (status: string) => ({ ok: '正常', partial: '部分更新失败', stale: '数据已过期', unavailable: '尚无天气数据' }[status] ?? status)
