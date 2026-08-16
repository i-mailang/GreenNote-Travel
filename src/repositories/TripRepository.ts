import type { Trip } from '../types/trip'
import type { AdminTripRecord, PublicTripRecord, TripBackupRecord } from '../types/dto'

export interface TripRepository {
  loadTrip(): Promise<Trip>
  saveTrip(trip: Trip): Promise<Trip>
  resetTrip(): Promise<Trip>
}

export interface PublicTripRepository {
  loadPublicTrip(): Promise<PublicTripRecord>
}

export interface AdminTripRepository {
  initializeAdminTrip(trip: Trip): Promise<AdminTripRecord>
  loadAdminTrip(): Promise<AdminTripRecord>
  saveAdminTrip(trip: Trip, expectedRevision: number): Promise<AdminTripRecord>
  publishTrip(expectedRevision: number): Promise<{ admin: AdminTripRecord; publicTrip: PublicTripRecord }>
  listBackups(): Promise<TripBackupRecord[]>
  restoreBackup(backupId: string, expectedRevision: number): Promise<AdminTripRecord>
}
