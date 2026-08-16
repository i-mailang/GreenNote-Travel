import { APP_CONFIG_DEFAULTS } from '../config/appConfigDefaults'
import { demoTrip } from '../data/demoTrip'

export interface WeatherTimerEvent { Type?: string; TriggerName?: string; Time?: string; type?: string; triggerName?: string; time?: string }
export interface WeatherRuntimeState { lockedUntil?: string | null; lastCompletedSlot?: string | null; manualCooldownUntil?: string | null }
export interface WeatherCaller { uid?: string | null; isAnonymous?: boolean | null }
export interface WeatherScheduleConfig { startDate: string; endDate: string; leadDays: number; refreshTimes: { preTrip: readonly string[]; inTrip: readonly string[] } }

export const DEFAULT_WEATHER_SCHEDULE: WeatherScheduleConfig = { startDate: demoTrip.startDate, endDate: demoTrip.endDate, leadDays: APP_CONFIG_DEFAULTS.weather.leadDays, refreshTimes: APP_CONFIG_DEFAULTS.weather.refreshTimes }

export const isTrustedWeatherTimerEvent = (event: WeatherTimerEvent) => {
  const type = event.Type ?? event.type; const name = event.TriggerName ?? event.triggerName ?? ''
  return type === 'Timer' && /^trip-weather-(pretrip|intrip)$/.test(name)
}
export const weatherInvocationMode = (event: WeatherTimerEvent, caller: WeatherCaller): 'timer' | 'admin' | 'reject' => {
  if (caller.uid) return caller.isAnonymous ? 'reject' : 'admin'
  return isTrustedWeatherTimerEvent(event) ? 'timer' : 'reject'
}
export const evaluateWeatherRuntime = (runtime: WeatherRuntimeState, slot: string, manual: boolean, now: Date): 'acquire' | 'duplicate' | 'busy' | 'cooldown' => {
  if (runtime.lastCompletedSlot === slot) return 'duplicate'
  if (runtime.lockedUntil && new Date(runtime.lockedUntil) > now) return 'busy'
  if (manual && runtime.manualCooldownUntil && new Date(runtime.manualCooldownUntil) > now) return 'cooldown'
  return 'acquire'
}

const zoneParts = (date: Date) => Object.fromEntries(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date).map((part) => [part.type, part.value]))
const dateOnly = (date: Date) => { const parts = zoneParts(date); return `${parts.year}-${parts.month}-${parts.day}` }
const addDays = (date: string, days: number) => { const value = new Date(`${date}T00:00:00+08:00`); value.setUTCDate(value.getUTCDate() + days); return dateOnly(value) }
export const weatherWindow = (config: WeatherScheduleConfig = DEFAULT_WEATHER_SCHEDULE) => ({ startDate: addDays(config.startDate, -config.leadDays), endDate: config.endDate })

export function isExpectedWeatherTimerSlot(event: WeatherTimerEvent, fallback: Date, config: WeatherScheduleConfig = DEFAULT_WEATHER_SCHEDULE) {
  const name = event.TriggerName ?? event.triggerName ?? ''; const rawTime = event.Time ?? event.time; const instant = rawTime ? new Date(rawTime) : fallback
  if (Number.isNaN(instant.getTime())) return false
  const parts = zoneParts(instant); const date = `${parts.year}-${parts.month}-${parts.day}`; const time = `${parts.hour}:${parts.minute}`; const window = weatherWindow(config)
  if (date < window.startDate || date > window.endDate) return false
  if (name === 'trip-weather-pretrip') return date < config.startDate && config.refreshTimes.preTrip.includes(time)
  if (name === 'trip-weather-intrip') return date >= config.startDate && config.refreshTimes.inTrip.includes(time)
  return false
}
export function scheduledSlot(date: Date, source: 'timer' | 'manual') {
  const parts = zoneParts(date); const day = `${parts.year}-${parts.month}-${parts.day}`; const time = `${parts.hour}:${parts.minute}`
  return source === 'manual' ? `manual-${day}T${parts.hour}:${String(Math.floor(Number(parts.minute) / 5) * 5).padStart(2, '0')}` : `timer-${day}T${time}`
}
export function nextWeatherSchedule(date: Date, config: WeatherScheduleConfig = DEFAULT_WEATHER_SCHEDULE): string | null {
  const window = weatherWindow(config); const candidates: Date[] = []
  for (let day = window.startDate; day <= window.endDate; day = addDays(day, 1)) {
    const times = day < config.startDate ? config.refreshTimes.preTrip : config.refreshTimes.inTrip
    for (const time of times) { const [year, month, dateOfMonth] = day.split('-').map(Number); const [hour, minute] = time.split(':').map(Number); candidates.push(new Date(Date.UTC(year, month - 1, dateOfMonth, hour - 8, minute))) }
  }
  return candidates.sort((a, b) => a.getTime() - b.getTime()).find((item) => item > date)?.toISOString() ?? null
}
