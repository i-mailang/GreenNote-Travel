import type {
  DayStatus, DisplaySettings, DrivingPlan, MealPlan, PhoneVisibility, StopStatus, StopType,
  DayOption, PlaceGuide, Trip, TripImage, TripStatus, WalkingIntensity, WeatherPlan, WeatherSensitivity,
  StopVisibility,
} from './trip'

export interface PublicTripStopDTO {
  id: string
  name: string
  type: StopType
  visibility: Extract<StopVisibility, 'route' | 'detail'>
  status?: StopStatus
  arrivalTime?: string
  duration?: string
  durationMinutes?: number
  address?: string
  navigationUrl?: string
  ticketNotes?: string
  entrance?: string
  openingHours?: string
  ticket?: string
  reservation?: string
  parking?: string
  walkingIntensity?: WalkingIntensity
  weatherSensitivity?: WeatherSensitivity
  backup?: string
  phone?: string
  image?: TripImage
  summary?: string
  guide?: PlaceGuide
}
export interface PublicAccommodationDTO {
  city?: string
  area?: string
  summary?: string
  parking?: string
  breakfast?: string
  phone?: string
  toNextStopMinutes?: number
}
export interface PublicRiskDTO {
  weather?: string
  traffic?: string
  reservation?: string
  physical?: string
  mainDelayPoint?: string
  backupTriggers?: string[]
}
export interface PublicDayPlanDTO {
  driving?: Omit<DrivingPlan, 'notes'>
  accommodation?: PublicAccommodationDTO
  meals?: Omit<MealPlan, 'notes'>
  risks?: PublicRiskDTO
  weather?: WeatherPlan
}
export interface PublicTripDayDTO {
  id: string
  order: number
  date: string
  title: string
  origin?: string
  destination?: string
  stayCity?: string
  departureTime?: string
  arrivalTime?: string
  status?: DayStatus
  reminder?: string
  hotel?: { name: string; address: string; phone?: string }
  meals?: string
  reminders?: string
  backupPlan?: string
  summary?: string
  intensity?: string
  options?: DayOption[]
  choiceBasis?: string
  verificationItems?: string[]
  plan?: PublicDayPlanDTO
  stops: PublicTripStopDTO[]
}
export interface PublicTripDTO {
  schemaVersion: number
  id: string
  title: string
  startDate: string
  endDate: string
  status?: TripStatus
  subtitle?: string
  participantCount?: number
  vehicle?: string
  globalNotice?: string
  credit?: string
  updatedAt?: string
  displaySettings: DisplaySettings
  days: PublicTripDayDTO[]
}

export type AdminTripDTO = Trip
export interface AdminTripRecord { trip: AdminTripDTO; revision: number; updatedAt: string; updatedBy: string; publishedRevision: number | null; publishedAt: string | null }
export interface PublicTripRecord { trip: PublicTripDTO; sourceRevision: number; publishedAt: string; publishedBy?: string }
export interface TripBackupRecord { id: string; trip: AdminTripDTO; revision: number; reason: 'save' | 'publish' | 'restore'; createdAt: string; createdBy: string }
export interface AdminSession { uid: string; displayName?: string; loginType?: string; isAdmin: boolean }
export interface CachedTrip<T> { trip: T; revision: number; schemaVersion: number; cachedAt: string }
export type { PhoneVisibility }
