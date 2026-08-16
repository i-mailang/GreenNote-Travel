import { describe, expect, it } from 'vitest'
import { evaluateWeatherRuntime, isExpectedWeatherTimerSlot, isTrustedWeatherTimerEvent, nextWeatherSchedule, scheduledSlot, weatherInvocationMode, weatherWindow, type WeatherScheduleConfig } from './weatherSchedule'

const config: WeatherScheduleConfig = { startDate: '2030-05-16', endDate: '2030-05-18', leadDays: 2, refreshTimes: { preTrip: ['06:00'], inTrip: ['05:30', '09:00'] } }

describe('weather schedule', () => {
  it('derives the active window from Trip dates and leadDays', () => expect(weatherWindow(config)).toEqual({ startDate: '2030-05-14', endDate: '2030-05-18' }))
  it('accepts only configured Beijing-time slots', () => { expect(isExpectedWeatherTimerSlot({ TriggerName: 'trip-weather-pretrip', Time: '2030-05-13T22:00:00Z' }, new Date(0), config)).toBe(true); expect(isExpectedWeatherTimerSlot({ TriggerName: 'trip-weather-intrip', Time: '2030-05-15T21:30:00Z' }, new Date(0), config)).toBe(true); expect(isExpectedWeatherTimerSlot({ TriggerName: 'trip-weather-intrip', Time: '2030-05-16T06:00:00Z' }, new Date(0), config)).toBe(false) })
  it('recognizes only generic template timer names', () => { expect(isTrustedWeatherTimerEvent({ Type: 'Timer', TriggerName: 'trip-weather-intrip' })).toBe(true); expect(isTrustedWeatherTimerEvent({ Type: 'Timer', TriggerName: 'unrelated' })).toBe(false) })
  it('separates timer, admin and anonymous callers', () => { expect(weatherInvocationMode({ Type: 'Timer', TriggerName: 'trip-weather-pretrip' }, {})).toBe('timer'); expect(weatherInvocationMode({}, { uid: 'demo-admin', isAnonymous: false })).toBe('admin'); expect(weatherInvocationMode({}, { uid: 'anon', isAnonymous: true })).toBe('reject') })
  it('keeps locks, cooldown and slot idempotency', () => { const now = new Date('2030-05-16T01:00:00Z'); const slot = scheduledSlot(now, 'timer'); expect(evaluateWeatherRuntime({ lastCompletedSlot: slot }, slot, false, now)).toBe('duplicate'); expect(evaluateWeatherRuntime({ lockedUntil: '2030-05-16T01:01:00Z' }, 'x', false, now)).toBe('busy'); expect(evaluateWeatherRuntime({ manualCooldownUntil: '2030-05-16T01:04:00Z' }, 'x', true, now)).toBe('cooldown') })
  it('finds the next configured Trip slot dynamically', () => expect(nextWeatherSchedule(new Date('2030-05-16T00:00:00Z'), config)).toBe('2030-05-16T01:00:00.000Z'))
})
