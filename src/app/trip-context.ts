import { createContext, useContext } from 'react'
import type { PublicTripDTO, TripBackupRecord } from '../types/dto'
import type { Trip } from '../types/trip'

export interface TripContextValue {
  trip: Trip
  loading: boolean
  error: string
  scope: 'public' | 'admin'
  revision: number
  publishedRevision: number | null
  cachedAt: string | null
  save: (trip: Trip) => Promise<Trip>
  initialize: (trip: Trip) => Promise<Trip>
  publish: () => Promise<void>
  reset: () => Promise<Trip>
  retry: () => Promise<void>
  backups: TripBackupRecord[]
  loadBackups: () => Promise<void>
  restoreBackup: (backupId: string) => Promise<Trip>
  loadPublicSnapshot: () => Promise<PublicTripDTO>
}
export const TripContext = createContext<TripContextValue | null>(null)
export function useTrip() {
  const value = useContext(TripContext)
  if (!value) throw new Error('useTrip 必须在 TripProvider 中使用')
  return value
}
