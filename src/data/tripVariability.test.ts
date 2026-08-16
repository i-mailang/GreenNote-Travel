import { describe, expect, it } from 'vitest'
import { routeNodesForTrip } from '../services/routeNodes'
import { parseTripData } from '../services/tripData'
import type { TripDay } from '../types/trip'
import { demoTrip } from './demoTrip'

const copy = <T,>(value: T): T => structuredClone(value)
const makeDays = (count: number): TripDay[] => Array.from({ length: count }, (_, index) => ({ ...copy(demoTrip.days[index % demoTrip.days.length]), id: `variable-day-${index + 1}`, order: index + 1, date: `2031-06-${String(index + 1).padStart(2, '0')}`, stops: copy(demoTrip.days[index % demoTrip.days.length].stops).map((stop, stopIndex) => ({ ...stop, id: `variable-stop-${index + 1}-${stopIndex + 1}` })) }))

describe('arbitrary Trip day counts', () => {
  it('parses a 1 Day Trip', () => { const trip = { ...copy(demoTrip), startDate: '2031-06-01', endDate: '2031-06-01', days: makeDays(1) }; expect(parseTripData(trip).days).toHaveLength(1) })
  it('parses the 3 Day Demo', () => expect(parseTripData(demoTrip).days).toHaveLength(3))
  it('parses a 10 Day Trip', () => { const trip = { ...copy(demoTrip), startDate: '2031-06-01', endDate: '2031-06-10', days: makeDays(10) }; expect(parseTripData(trip).days).toHaveLength(10) })
  it('derives route nodes from supplied days and stops', () => { const trip = { ...copy(demoTrip), days: makeDays(1) }; expect(routeNodesForTrip(trip).length).toBe(trip.days[0].stops.filter((stop) => stop.visibility === 'route').length) })
})
