export type Visibility = 'public' | 'admin' | 'hidden' | 'inherit'
export type StopVisibility = 'route' | 'detail' | 'admin' | 'hidden'
export type TripStatus = '筹备中' | '即将出发' | '旅途中' | '已结束'
export type DayStatus = '待确认' | '已确认' | '进行中' | '已完成'
export type StopType = '集合' | '行车' | '景点' | '酒店' | '用餐' | '休息'
export type StopStatus = '待确认' | '计划中' | '已预约' | '已完成'
export type PhoneVisibility = 'public' | 'admin' | 'hidden'
export type WalkingIntensity = '轻松' | '适中' | '较高'
export type WeatherSensitivity = '低' | '中' | '高'
export type AccommodationType = '酒店' | '公寓' | '民宿' | '整套公寓' | '家庭套房' | '其他'

export type HomeField = 'subtitle' | 'participants' | 'vehicle' | 'dateRange' | 'countdown' | 'status' | 'notice' | 'updatedAt' | 'route' | 'dayCards' | 'credit'
export type CardField = 'date' | 'title' | 'route' | 'stay' | 'departureTime' | 'stops' | 'status' | 'reminder'
export type DetailField = 'route' | 'schedule' | 'stopStatus' | 'duration' | 'tickets' | 'address' | 'navigation' | 'hotel' | 'hotelPhone' | 'meals' | 'reminders' | 'backup' | 'internalNotes'

export interface HotelInfo { name: string; phone: string; address: string }
export interface TripImage { src: string; alt: string; fallbackSrc?: string; credit?: string }
export interface GuideTable { columns: string[]; rows: string[][] }
export interface GuideSection { title: string; subtitle?: string; paragraphs?: string[]; table?: GuideTable }
export interface PlaceGuide { title: string; subtitle: string; overview: string; sections: GuideSection[] }
export interface DayOption { title: string; description: string }
export interface BreakStop { name: string; plannedAt?: string; durationMinutes?: number; notes?: string }
export interface DrivingPlan {
  distanceKm?: number
  pureHours?: number
  plannedHours?: number
  toll?: number
  latestDeparture?: string
  breakStops?: BreakStop[]
  notes?: string
}
export interface RoomCombination { roomType: string; count: number; guests?: number; notes?: string }
export interface AccommodationCandidate {
  id: string
  name: string
  type: AccommodationType
  roomCombinations?: RoomCombination[]
  address?: string
  parking?: string
  totalPrice?: number
  freeCancelUntil?: string
  breakfast?: string
  phone?: string
  phoneVisibility?: PhoneVisibility
  toNextStopMinutes?: number
  notes?: string
}
export interface AccommodationPlan {
  city?: string
  area?: string
  summary?: string
  candidates?: AccommodationCandidate[]
  parking?: string
  totalPrice?: number
  freeCancelUntil?: string
  breakfast?: string
  phone?: string
  phoneVisibility?: PhoneVisibility
  toNextStopMinutes?: number
  notes?: string
}
export interface MealPlan { primary?: string; backups?: string[]; budgetPerPerson?: number; parking?: string; reservation?: string; notes?: string }
export interface RiskPlan {
  weather?: string
  traffic?: string
  reservation?: string
  physical?: string
  mainDelayPoint?: string
  backupTriggers?: string[]
  internalNotes?: string
}
export interface WeatherPlan { summary?: string; finalCheckAt?: string; lastCheckedAt?: string; source?: string }
export interface DayPlan {
  driving?: DrivingPlan
  accommodation?: AccommodationPlan
  meals?: MealPlan
  risks?: RiskPlan
  weather?: WeatherPlan
}

export interface DisplaySettings {
  home: Record<HomeField, Visibility>
  card: Record<CardField, Visibility>
  detail: Record<DetailField, Visibility>
}
export interface DayDisplayOverrides {
  card?: Partial<Record<CardField, Visibility>>
  detail?: Partial<Record<DetailField, Visibility>>
}
export interface TripStop {
  id: string
  name: string
  type: StopType
  status: StopStatus
  arrivalTime: string
  duration: string
  address: string
  navigationUrl: string
  ticketNotes: string
  internalNotes: string
  visibility: StopVisibility
  entrance?: string
  openingHours?: string
  durationMinutes?: number
  ticket?: string
  reservation?: string
  parking?: string
  walkingIntensity?: WalkingIntensity
  weatherSensitivity?: WeatherSensitivity
  backup?: string
  phone?: string
  phoneVisibility?: PhoneVisibility
  image?: TripImage
  summary: string
  guide?: PlaceGuide
}
export interface TripDay {
  id: string
  order: number
  date: string
  title: string
  origin: string
  destination: string
  stayCity: string
  departureTime: string
  arrivalTime: string
  status: DayStatus
  reminder: string
  hotel: HotelInfo
  meals: string
  reminders: string
  backupPlan: string
  summary: string
  intensity: string
  options: DayOption[]
  choiceBasis: string
  verificationItems: string[]
  displayOverrides: DayDisplayOverrides
  stops: TripStop[]
  plan?: DayPlan
}
export interface Trip {
  schemaVersion: number
  id: string
  title: string
  subtitle: string
  startDate: string
  endDate: string
  participantCount: number
  vehicle: string
  status: TripStatus
  globalNotice: string
  credit: string
  updatedAt: string
  displaySettings: DisplaySettings
  days: TripDay[]
}
