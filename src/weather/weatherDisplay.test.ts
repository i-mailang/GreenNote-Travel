import { describe, expect, it } from 'vitest'
import { createMockWeatherSnapshot } from './weatherFixtures'
import { formatBeijingTime, isWeatherSnapshotStale } from './weatherDisplay'

describe('weather freshness display', () => {
  it('marks a successful snapshot stale after twelve hours', () => {
    const snapshot = createMockWeatherSnapshot('ok')
    const lastSuccessAt = new Date(snapshot.lastSuccessAt!).getTime()
    expect(isWeatherSnapshotStale(snapshot, lastSuccessAt + 12 * 60 * 60 * 1000)).toBe(false)
    expect(isWeatherSnapshotStale(snapshot, lastSuccessAt + 12 * 60 * 60 * 1000 + 1)).toBe(true)
  })

  it('treats a snapshot without a successful update as stale', () => {
    const snapshot = createMockWeatherSnapshot('unavailable')
    expect(isWeatherSnapshotStale({ ...snapshot, lastSuccessAt: null })).toBe(true)
  })

  it('formats Baidu local timestamps without crashing WebKit or Chromium', () => {
    expect(formatBeijingTime('2030-05-16 18:00:00')).toContain('18:00')
    expect(formatBeijingTime('20300516183000')).toContain('18:30')
    expect(formatBeijingTime('not-a-date')).toBe('时间待定')
  })
})
