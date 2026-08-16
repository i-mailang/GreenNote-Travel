import type { PublicTripDTO } from '../types/dto'
import type { Trip } from '../types/trip'

/** UI 适配器只补空展示值，不会恢复任何未包含在 PublicTripDTO 中的管理字段。 */
export function publicDtoToTrip(dto: PublicTripDTO): Trip {
  return {
    schemaVersion: dto.schemaVersion, id: dto.id, title: dto.title, subtitle: dto.subtitle ?? '', startDate: dto.startDate, endDate: dto.endDate,
    participantCount: dto.participantCount ?? 0, vehicle: dto.vehicle ?? '', status: dto.status ?? '筹备中', globalNotice: dto.globalNotice ?? '',
    credit: dto.credit ?? '', updatedAt: dto.updatedAt ?? new Date(0).toISOString(), displaySettings: dto.displaySettings,
    days: dto.days.map((day) => ({
      id: day.id, order: day.order, date: day.date, title: day.title, origin: day.origin ?? '', destination: day.destination ?? '',
      stayCity: day.stayCity ?? '', departureTime: day.departureTime ?? '', arrivalTime: day.arrivalTime ?? '', status: day.status ?? '待确认',
      reminder: day.reminder ?? '', hotel: { name: day.hotel?.name ?? '', address: day.hotel?.address ?? '', phone: day.hotel?.phone ?? '' },
      meals: day.meals ?? '', reminders: day.reminders ?? '', backupPlan: day.backupPlan ?? '', summary: day.summary ?? '', intensity: day.intensity ?? '',
      options: day.options ?? [], choiceBasis: day.choiceBasis ?? '', verificationItems: day.verificationItems ?? [], displayOverrides: {}, plan: day.plan,
      stops: day.stops.map((stop) => ({
        id: stop.id, name: stop.name, type: stop.type, status: stop.status ?? '待确认', arrivalTime: stop.arrivalTime ?? '', duration: stop.duration ?? '',
        address: stop.address ?? '', navigationUrl: stop.navigationUrl ?? '', ticketNotes: stop.ticketNotes ?? '', internalNotes: '', visibility: stop.visibility,
        entrance: stop.entrance, openingHours: stop.openingHours, durationMinutes: stop.durationMinutes, ticket: stop.ticket,
        reservation: stop.reservation, parking: stop.parking, walkingIntensity: stop.walkingIntensity, weatherSensitivity: stop.weatherSensitivity,
        backup: stop.backup, phone: stop.phone, phoneVisibility: stop.phone ? 'public' : 'hidden', image: stop.image, summary: stop.summary ?? '', guide: stop.guide,
      })),
    })),
  }
}
