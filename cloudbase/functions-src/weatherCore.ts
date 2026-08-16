import { BaiduWeatherProvider } from '../../src/weather/baiduWeatherProvider'
import { DEMO_TRIP_WEATHER_CONFIG, WEATHER_LOCATIONS } from '../../src/weather/weatherLocations'
import { MockWeatherProvider } from '../../src/weather/mockWeatherProvider'
import { isWithinWeatherWindow, refreshWeatherSnapshot } from '../../src/weather/weatherService'
import { evaluateWeatherRuntime, isExpectedWeatherTimerSlot, nextWeatherSchedule, scheduledSlot, weatherInvocationMode } from '../../src/weather/weatherSchedule'
import { WeatherSnapshotSchema, toPublicWeatherDTO, type WeatherAdminSummary, type WeatherSnapshot } from '../../src/weather/weatherSchema'
import { app, db, failure, first, FunctionError, requireAdmin, success } from './core'
import { demoTrip } from '../../src/data/demoTrip'
import { APP_CONFIG_DEFAULTS } from '../../src/config/appConfigDefaults'

const WEATHER = 'trip_weather'; const RUNTIME = 'trip_weather_runtime'; const LOCK_MS = 2 * 60 * 1000; const MANUAL_COOLDOWN_MS = 5 * 60 * 1000
type WeatherEvent = { manual?: boolean; statusOnly?: boolean; Type?: string; TriggerName?: string; Time?: string; type?: string; triggerName?: string; time?: string }
type RuntimeDoc = { lockedUntil?: string | null; activeSlot?: string | null; lastCompletedSlot?: string | null; manualCooldownUntil?: string | null; lastRunSummary?: Record<string, unknown>; lastSkippedTimer?: Record<string, unknown> | null }
type Transaction = { collection: (name: string) => ReturnType<typeof db.collection> }

const counts = (snapshot: WeatherSnapshot | null) => ({ ok: snapshot?.locations.filter((x) => x.status === 'ok').length ?? 0, stale: snapshot?.locations.filter((x) => x.status === 'stale').length ?? 0, unavailable: snapshot?.locations.filter((x) => x.status === 'unavailable').length ?? 0 })
const providerName = process.env.WEATHER_PROVIDER === 'baidu' ? 'baidu' : 'mock'
const summary = (snapshot: WeatherSnapshot | null, runtime: RuntimeDoc | null): WeatherAdminSummary => ({ snapshot: snapshot ? toPublicWeatherDTO(snapshot) : null, provider: providerName, akConfigured: providerName === 'baidu' && Boolean(process.env.BAIDU_WEATHER_AK?.trim()), counts: counts(snapshot), cooldownUntil: runtime?.manualCooldownUntil ?? null })
async function readSnapshot() { const raw = first(await db.collection(WEATHER).doc('main').get()); return raw ? WeatherSnapshotSchema.parse(raw) : null }
async function readRuntime() { return first<RuntimeDoc>(await db.collection(RUNTIME).doc('main').get()) }

async function acquire(slot: string, manual: boolean, now: Date) {
  let duplicate = false
  await db.runTransaction(async (tx: Transaction) => {
    const runtime = first<RuntimeDoc>(await tx.collection(RUNTIME).doc('main').get()) ?? {}
    const decision = evaluateWeatherRuntime(runtime, slot, manual, now)
    if (decision === 'duplicate') { duplicate = true; return }
    if (decision === 'busy') throw new FunctionError('WEATHER_BUSY', '天气刷新正在进行，请稍后重试。')
    if (decision === 'cooldown') throw new FunctionError('WEATHER_COOLDOWN', '手动刷新间隔为5分钟，请稍后再试。')
    await tx.collection(RUNTIME).doc('main').set({
      activeSlot: slot,
      lockedUntil: new Date(now.getTime() + LOCK_MS).toISOString(),
      lastCompletedSlot: runtime.lastCompletedSlot ?? null,
      manualCooldownUntil: manual ? new Date(now.getTime() + MANUAL_COOLDOWN_MS).toISOString() : runtime.manualCooldownUntil ?? null,
      lastRunSummary: runtime.lastRunSummary ?? {},
      lastSkippedTimer: runtime.lastSkippedTimer ?? null,
    })
  })
  return !duplicate
}

export async function getPublicWeather() {
  try { const snapshot = await readSnapshot(); if (!snapshot) throw new FunctionError('NO_WEATHER', '尚无天气快照。'); return success(toPublicWeatherDTO(snapshot)) }
  catch (error) { return failure(error) }
}

export async function refreshTripWeather(event: WeatherEvent = {}) {
  const now = new Date(); const invocation = weatherInvocationMode(event, app.auth().getUserInfo()); const timer = invocation === 'timer'
  try {
    if (invocation === 'reject') throw new FunctionError('SESSION_EXPIRED', '请使用管理员账号重新登录。')
    if (invocation === 'admin') await requireAdmin()
    const previous = await readSnapshot(); const runtime = await readRuntime()
    if (event.statusOnly && !timer) return success(summary(previous, runtime))
    if (timer && !isExpectedWeatherTimerSlot(event, now)) {
      const lastSkippedTimer = { triggerName: event.TriggerName ?? event.triggerName ?? null, eventTime: event.Time ?? event.time ?? null, observedAt: now.toISOString() }
      await db.collection(RUNTIME).doc('main').update({ lastSkippedTimer: db.command.set(lastSkippedTimer) })
      return success({ ...summary(previous, runtime), skipped: true, reason: 'UNSCHEDULED_TIMER_SLOT' })
    }
    if (!timer && event.manual !== true) throw new FunctionError('INVALID_SOURCE', '天气刷新来源无效。')
    if (!isWithinWeatherWindow(now, demoTrip.startDate, demoTrip.endDate, APP_CONFIG_DEFAULTS.weather.leadDays)) return success({ ...summary(previous, runtime), skipped: true, reason: 'OUTSIDE_TRIP_WINDOW' })
    if (providerName === 'baidu' && !process.env.BAIDU_WEATHER_AK?.trim()) throw new FunctionError('WEATHER_NOT_CONFIGURED', '天气服务尚未配置。')
    const eventTime = event.Time ?? event.time
    const slot = scheduledSlot(eventTime ? new Date(eventTime) : now, timer ? 'timer' : 'manual')
    if (!await acquire(slot, !timer, now)) return success({ ...summary(previous, runtime), skipped: true, reason: 'DUPLICATE_SLOT' })
    try {
      const provider = providerName === 'baidu' ? new BaiduWeatherProvider(process.env.BAIDU_WEATHER_AK?.trim() ?? '') : new MockWeatherProvider()
      const outcome = await refreshWeatherSnapshot({ provider, locations: WEATHER_LOCATIONS, tripId: DEMO_TRIP_WEATHER_CONFIG.tripId, previous, now: now.toISOString(), nextScheduledAt: nextWeatherSchedule(now), batchDelayMs: providerName === 'baidu' ? 600 : 0 })
      if (outcome.changed || !previous) await db.collection(WEATHER).doc('main').set(outcome.snapshot)
      else await db.collection(WEATHER).doc('main').update({ lastCheckedAt: outcome.snapshot.lastCheckedAt, status: outcome.snapshot.status, nextScheduledAt: outcome.snapshot.nextScheduledAt })
      const runSummary = { successCount: outcome.successCount, failureCount: outcome.failureCount, reusedCount: outcome.reusedCount, changed: outcome.changed }
      await db.collection(RUNTIME).doc('main').update({ activeSlot: null, lockedUntil: null, lastCompletedSlot: slot, lastRunSummary: db.command.set(runSummary) })
      console.log('weather refresh completed', runSummary)
      return success({ ...summary(outcome.snapshot, await readRuntime()), run: runSummary })
    } catch (error) { await db.collection(RUNTIME).doc('main').update({ activeSlot: null, lockedUntil: null }); throw error }
  } catch (error) { return failure(error) }
}
