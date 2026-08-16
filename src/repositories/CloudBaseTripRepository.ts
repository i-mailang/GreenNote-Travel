import type { AdminTripRecord, PublicTripRecord, TripBackupRecord } from '../types/dto'
import type { Trip } from '../types/trip'
import type { AdminTripRepository, PublicTripRepository } from './TripRepository'
import { callCloudFunction } from '../infra/cloudbase'
import { ADMIN_CACHE_KEY, PUBLIC_CACHE_KEY, writeTripCache } from '../services/tripCache'
import { toAppError } from '../services/appError'
import { parseTripData } from '../services/tripData'
import { CURRENT_TRIP_SCHEMA_VERSION } from '../data/schemaVersion'
import { AppError } from '../services/appError'

function validatePublic(record: PublicTripRecord): PublicTripRecord {
  const trip = record?.trip
  if (!trip || trip.schemaVersion > CURRENT_TRIP_SCHEMA_VERSION || typeof trip.title !== 'string' || !Array.isArray(trip.days) || typeof record.sourceRevision !== 'number') throw new AppError('SCHEMA')
  return JSON.parse(JSON.stringify(record)) as PublicTripRecord
}

export class CloudBasePublicTripRepository implements PublicTripRepository {
  async loadPublicTrip(): Promise<PublicTripRecord> {
    try {
      const record = validatePublic(await callCloudFunction<PublicTripRecord>('getPublicTrip'))
      writeTripCache(PUBLIC_CACHE_KEY, record.trip, record.sourceRevision)
      return record
    } catch (reason) { throw toAppError(reason) }
  }
}

export class CloudBaseAdminTripRepository implements AdminTripRepository {
  async initializeAdminTrip(trip: Trip): Promise<AdminTripRecord> {
    try { const record = await callCloudFunction<AdminTripRecord>('initializeTrip', { trip }); record.trip = parseTripData(record.trip); return record }
    catch (reason) { throw toAppError(reason) }
  }
  async loadAdminTrip(): Promise<AdminTripRecord> {
    try {
      const record = await callCloudFunction<AdminTripRecord>('getAdminTrip'); record.trip = parseTripData(record.trip)
      writeTripCache(ADMIN_CACHE_KEY, record.trip, record.revision)
      return record
    } catch (reason) { throw toAppError(reason) }
  }
  async saveAdminTrip(trip: Trip, expectedRevision: number): Promise<AdminTripRecord> {
    try {
      const record = await callCloudFunction<AdminTripRecord>('saveAdminTrip', { trip, expectedRevision }); record.trip = parseTripData(record.trip)
      writeTripCache(ADMIN_CACHE_KEY, record.trip, record.revision)
      return record
    } catch (reason) { throw toAppError(reason) }
  }
  async publishTrip(expectedRevision: number) {
    try {
      const result = await callCloudFunction<{ admin: AdminTripRecord; publicTrip: PublicTripRecord }>('publishTrip', { expectedRevision })
      writeTripCache(PUBLIC_CACHE_KEY, result.publicTrip.trip, result.publicTrip.sourceRevision)
      return result
    } catch (reason) { throw toAppError(reason) }
  }
  async listBackups(): Promise<TripBackupRecord[]> { try { return await callCloudFunction('listTripBackups') } catch (reason) { throw toAppError(reason) } }
  async restoreBackup(backupId: string, expectedRevision: number): Promise<AdminTripRecord> {
    try {
      const record = await callCloudFunction<AdminTripRecord>('restoreTripBackup', { backupId, expectedRevision }); record.trip = parseTripData(record.trip)
      writeTripCache(ADMIN_CACHE_KEY, record.trip, record.revision)
      return record
    } catch (reason) { throw toAppError(reason) }
  }
}
