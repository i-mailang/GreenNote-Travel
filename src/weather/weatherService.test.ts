import { describe, expect, it } from 'vitest'
import { createMockWeatherSnapshot } from './weatherFixtures'
import { WEATHER_LOCATIONS } from './weatherLocations'
import { MockWeatherProvider } from './mockWeatherProvider'
import { isWithinWeatherWindow, refreshWeatherSnapshot, stableWeatherHash, type WeatherProvider } from './weatherService'

describe('weather refresh service', () => {
  it('reuses previous data when part of a refresh fails', async () => { const previous = createMockWeatherSnapshot(); const result = await refreshWeatherSnapshot({ provider: new MockWeatherProvider('partial'), locations: WEATHER_LOCATIONS, previous, now: '2030-05-16T01:00:00.000Z' }); expect(result.snapshot.status).toBe('partial'); expect(result.reusedCount).toBeGreaterThan(0); expect(result.snapshot.locations.some((x) => x.status === 'stale')).toBe(true) })
  it('keeps old data when every provider request fails', async () => { const previous = createMockWeatherSnapshot(); const provider: WeatherProvider = { name: 'mock', fetchLocation: async () => { throw Object.assign(new Error('down'), { code: 'NETWORK' }) } }; const result = await refreshWeatherSnapshot({ provider, locations: WEATHER_LOCATIONS, previous, now: '2030-05-16T02:00:00.000Z' }); expect(result.snapshot.status).toBe('stale'); expect(result.reusedCount).toBe(WEATHER_LOCATIONS.length); expect(result.snapshot.locations.every((x) => x.daily.length > 0)).toBe(true) })
  it('does not invent weather on a first total failure', async () => { const provider: WeatherProvider = { name: 'mock', fetchLocation: async () => { throw new Error('down') } }; const result = await refreshWeatherSnapshot({ provider, locations: WEATHER_LOCATIONS, now: '2030-05-16T02:00:00.000Z' }); expect(result.snapshot.status).toBe('unavailable'); expect(result.snapshot.locations.every((x) => !x.current && x.daily.length === 0)).toBe(true) })
  it('uses a stable public-content hash', () => { const snapshot = createMockWeatherSnapshot(); expect(stableWeatherHash(snapshot.locations, snapshot.publicMessages)).toBe(snapshot.contentHash) })
  it('derives the weather window from arbitrary Trip dates', () => { expect(isWithinWeatherWindow(new Date('2030-05-13T12:00:00Z'), '2030-05-16', '2030-05-18', 2)).toBe(false); expect(isWithinWeatherWindow(new Date('2030-05-14T00:00:00Z'), '2030-05-16', '2030-05-18', 2)).toBe(true); expect(isWithinWeatherWindow(new Date('2030-05-19T00:00:00Z'), '2030-05-16', '2030-05-18', 2)).toBe(false) })
})
