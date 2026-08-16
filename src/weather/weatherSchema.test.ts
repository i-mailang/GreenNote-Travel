import { describe, expect, it } from 'vitest'
import { createMockWeatherSnapshot } from './weatherFixtures'
import { toPublicWeatherDTO, WeatherSnapshotSchema } from './weatherSchema'

describe('weather schema', () => {
  it('validates the three-location Demo without a fixed production count', () => { const snapshot = WeatherSnapshotSchema.parse(createMockWeatherSnapshot()); expect(snapshot.locations).toHaveLength(3); expect(Math.max(...snapshot.locations.map((x) => x.daily.length))).toBe(3); expect(Math.max(...snapshot.locations.map((x) => x.hourly.length))).toBe(24) })
  it('removes provider-only error codes from the public DTO', () => { const snapshot = createMockWeatherSnapshot('partial'); expect(JSON.stringify(toPublicWeatherDTO(snapshot))).not.toContain('MOCK_PARTIAL_FAILURE') })
  it('allows optional provider fields to be missing', () => expect(() => WeatherSnapshotSchema.parse(createMockWeatherSnapshot('missing-fields'))).not.toThrow())
})
