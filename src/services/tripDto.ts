import { mergeDisplaySettings } from '../data/defaults'
import type { AdminTripDTO, PublicDayPlanDTO, PublicTripDTO, PublicTripStopDTO } from '../types/dto'
import type { Trip, TripDay } from '../types/trip'
import { parseTripData } from './tripData'
import { getVisibleStops, isVisible } from '../utils/visibility'

const visible = (day: TripDay, section: 'card' | 'detail', field: string, trip: Trip) =>
  isVisible(day.displayOverrides[section]?.[field as never], trip.displaySettings[section][field as never])
const defined = <T extends object>(value: T): T | undefined => Object.values(value).some((item) => item !== undefined && item !== '' && (!Array.isArray(item) || item.length)) ? value : undefined
const withoutUndefined = <T,>(value: T): T => {
  if (Array.isArray(value)) return value.map(withoutUndefined) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).map(([key, item]) => [key, withoutUndefined(item)])) as T
  }
  return value
}

function toPublicStop(stop: TripDay['stops'][number], day: TripDay, trip: Trip): PublicTripStopDTO {
  return {
    id: stop.id, name: stop.name, type: stop.type, visibility: stop.visibility as 'route' | 'detail',
    ...(visible(day, 'detail', 'stopStatus', trip) ? { status: stop.status } : {}),
    ...(visible(day, 'detail', 'schedule', trip) ? { arrivalTime: stop.arrivalTime } : {}),
    ...(visible(day, 'detail', 'duration', trip) ? { duration: stop.duration, durationMinutes: stop.durationMinutes } : {}),
    ...(visible(day, 'detail', 'address', trip) ? { address: stop.address, entrance: stop.entrance } : {}),
    ...(visible(day, 'detail', 'navigation', trip) ? { navigationUrl: stop.navigationUrl } : {}),
    ...(visible(day, 'detail', 'tickets', trip) ? { ticketNotes: stop.ticketNotes, ticket: stop.ticket, reservation: stop.reservation } : {}),
    parking: stop.parking, openingHours: stop.openingHours, walkingIntensity: stop.walkingIntensity,
    weatherSensitivity: stop.weatherSensitivity, backup: stop.backup, image: stop.image, summary: stop.summary, guide: stop.guide,
    ...(stop.phoneVisibility === 'public' && stop.phone ? { phone: stop.phone } : {}),
  }
}

function toPublicPlan(day: TripDay): PublicDayPlanDTO | undefined {
  const plan = day.plan
  if (!plan) return undefined
  const accommodation = plan.accommodation && defined({
    city: plan.accommodation.city, area: plan.accommodation.area, summary: plan.accommodation.summary,
    parking: plan.accommodation.parking, breakfast: plan.accommodation.breakfast,
    ...(plan.accommodation.phoneVisibility === 'public' ? { phone: plan.accommodation.phone } : {}),
    toNextStopMinutes: plan.accommodation.toNextStopMinutes,
  })
  const risks = plan.risks && defined({
    weather: plan.risks.weather, traffic: plan.risks.traffic, reservation: plan.risks.reservation,
    physical: plan.risks.physical, mainDelayPoint: plan.risks.mainDelayPoint, backupTriggers: plan.risks.backupTriggers,
  })
  return defined({
    driving: plan.driving && defined({ distanceKm: plan.driving.distanceKm, pureHours: plan.driving.pureHours, plannedHours: plan.driving.plannedHours, toll: plan.driving.toll, latestDeparture: plan.driving.latestDeparture, breakStops: plan.driving.breakStops }),
    accommodation, meals: plan.meals && defined({ primary: plan.meals.primary, backups: plan.meals.backups, budgetPerPerson: plan.meals.budgetPerPerson, parking: plan.meals.parking, reservation: plan.meals.reservation }),
    risks, weather: plan.weather && defined({ ...plan.weather }),
  })
}

/** 将完整 Trip 投影为普通端最小数据，排除候选住宿、价格、内部风险、内部备注与默认隐藏电话。 */
export function toPublicTripDTO(input: Trip): PublicTripDTO {
  const trip = parseTripData(input)
  const home = trip.displaySettings.home
  return withoutUndefined({
    schemaVersion: trip.schemaVersion, id: trip.id, title: trip.title, startDate: trip.startDate, endDate: trip.endDate,
    ...(isVisible(undefined, home.status) ? { status: trip.status } : {}),
    ...(isVisible(undefined, home.subtitle) ? { subtitle: trip.subtitle } : {}),
    ...(isVisible(undefined, home.participants) ? { participantCount: trip.participantCount } : {}),
    ...(isVisible(undefined, home.vehicle) ? { vehicle: trip.vehicle } : {}),
    ...(isVisible(undefined, home.notice) ? { globalNotice: trip.globalNotice } : {}),
    ...(isVisible(undefined, home.credit) ? { credit: trip.credit } : {}),
    ...(isVisible(undefined, home.updatedAt) ? { updatedAt: trip.updatedAt } : {}),
    displaySettings: mergeDisplaySettings(trip.displaySettings),
    days: trip.days.map((day) => ({
      id: day.id, order: day.order, date: day.date, title: day.title,
      ...(visible(day, 'card', 'route', trip) || visible(day, 'detail', 'route', trip) ? { origin: day.origin, destination: day.destination } : {}),
      ...(visible(day, 'card', 'stay', trip) ? { stayCity: day.stayCity } : {}),
      ...(visible(day, 'card', 'departureTime', trip) || visible(day, 'detail', 'schedule', trip) ? { departureTime: day.departureTime } : {}),
      ...(visible(day, 'detail', 'schedule', trip) ? { arrivalTime: day.arrivalTime } : {}),
      ...(visible(day, 'card', 'status', trip) ? { status: day.status } : {}),
      ...(visible(day, 'card', 'reminder', trip) ? { reminder: day.reminder } : {}),
      ...(visible(day, 'detail', 'hotel', trip) ? { hotel: { name: day.hotel.name, address: day.hotel.address, ...(visible(day, 'detail', 'hotelPhone', trip) ? { phone: day.hotel.phone } : {}) } } : {}),
      ...(visible(day, 'detail', 'meals', trip) ? { meals: day.meals } : {}),
      ...(visible(day, 'detail', 'reminders', trip) ? { reminders: day.reminders } : {}),
      ...(visible(day, 'detail', 'backup', trip) ? { backupPlan: day.backupPlan } : {}),
      summary: day.summary, intensity: day.intensity, options: day.options, choiceBasis: day.choiceBasis, verificationItems: day.verificationItems,
      plan: toPublicPlan(day),
      stops: getVisibleStops(day.stops, 'detail').map((stop) => toPublicStop(stop, day, trip)),
    })),
  })
}

export function toAdminTripDTO(trip: Trip): AdminTripDTO { return parseTripData(trip) }
