import { describe, expect, it } from 'vitest'
import { sampleTrip } from '../data/sampleTrip'
import type { PublicTripDayDTO, PublicTripStopDTO } from '../types/dto'
import { toPublicTripDTO } from './tripDto'
import { publicDtoToTrip } from './publicView'

describe('publicDtoToTrip legacy compatibility', () => {
  it('fills Stage 2.1 fields missing from a schema v2 public revision', () => {
    const dto = toPublicTripDTO(sampleTrip)
    dto.schemaVersion = 2
    const legacyDay = dto.days[0] as PublicTripDayDTO
    const legacyStop = legacyDay.stops[0] as PublicTripStopDTO
    delete legacyDay.summary
    delete legacyDay.intensity
    delete legacyDay.options
    delete legacyDay.choiceBasis
    delete legacyDay.verificationItems
    delete legacyStop.summary

    const trip = publicDtoToTrip(dto)

    expect(trip.days[0]).toMatchObject({
      summary: '',
      intensity: '',
      options: [],
      choiceBasis: '',
      verificationItems: [],
    })
    expect(trip.days[0].stops[0].summary).toBe('')
  })
})
