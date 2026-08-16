import { sampleTrip } from '../data/sampleTrip'
import { CURRENT_TRIP_SCHEMA_VERSION } from '../data/schemaVersion'
import { parseTripData, parseTripJson, TripDataError } from '../services/tripData'
import { toPublicTripDTO } from '../services/tripDto'
import { ADMIN_CACHE_KEY, PUBLIC_CACHE_KEY, writeTripCache } from '../services/tripCache'
import type { AdminTripRecord, PublicTripRecord, TripBackupRecord } from '../types/dto'
import type { Trip } from '../types/trip'
import type { AdminTripRepository, PublicTripRepository, TripRepository } from './TripRepository'
import { storageKey } from '../config/appConfig'

export const STORAGE_KEY = storageKey('trip.v1')
export const LOCAL_DRAFT_KEY = storageKey('admin-draft.v2')
export const LOCAL_PUBLIC_KEY = storageKey('public-trip.v2')
export const LOCAL_BACKUPS_KEY = storageKey('backups.v2')
const clone = <T,>(value: T): T => structuredClone(value)
const now = () => new Date().toISOString()

function draftRecord(trip: Trip, revision: number, publishedRevision: number | null = null, publishedAt: string | null = null): AdminTripRecord {
  return { trip, revision, updatedAt: trip.updatedAt, updatedBy: 'local-developer', publishedRevision, publishedAt }
}

export class LocalTripRepository implements TripRepository, PublicTripRepository, AdminTripRepository {
  async initializeAdminTrip(trip: Trip): Promise<AdminTripRecord> {
    const parsed = parseTripData(trip); const record = draftRecord(parsed, 1); localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(record)); writeTripCache(ADMIN_CACHE_KEY, record.trip, 1); return record
  }
  async loadTrip(): Promise<Trip> { return (await this.loadAdminTrip()).trip }

  async loadAdminTrip(): Promise<AdminTripRecord> {
    const raw = localStorage.getItem(LOCAL_DRAFT_KEY) ?? localStorage.getItem(STORAGE_KEY)
    if (!raw) return draftRecord(parseTripData(sampleTrip), 1)
    try {
      const value = JSON.parse(raw) as Partial<AdminTripRecord>
      if (value.trip && typeof value.revision === 'number') return { ...draftRecord(parseTripData(value.trip), value.revision), ...value, trip: parseTripData(value.trip) }
      return draftRecord(parseTripData(value), 1)
    } catch (error) {
      console.error('读取本地旅行数据失败：', error)
      if (error instanceof SyntaxError) throw new TripDataError('JSON_SYNTAX', { cause: error })
      if (error instanceof TripDataError) throw error
      throw new TripDataError('MIGRATION_FAILED', { cause: error })
    }
  }

  async loadPublicTrip(): Promise<PublicTripRecord> {
    const raw = localStorage.getItem(LOCAL_PUBLIC_KEY)
    if (raw) { const record = JSON.parse(raw) as PublicTripRecord; writeTripCache(PUBLIC_CACHE_KEY, record.trip, record.sourceRevision); return record }
    const admin = await this.loadAdminTrip()
    const record = { trip: toPublicTripDTO(admin.trip), sourceRevision: admin.revision, publishedAt: admin.updatedAt, publishedBy: 'local-developer' }; writeTripCache(PUBLIC_CACHE_KEY, record.trip, record.sourceRevision); return record
  }

  private addBackup(record: AdminTripRecord, reason: TripBackupRecord['reason']) {
    const backups = this.readBackups()
    backups.unshift({ id: crypto.randomUUID(), trip: clone(record.trip), revision: record.revision, reason, createdAt: now(), createdBy: 'local-developer' })
    localStorage.setItem(LOCAL_BACKUPS_KEY, JSON.stringify(backups.slice(0, 20)))
  }
  private readBackups(): TripBackupRecord[] { try { return JSON.parse(localStorage.getItem(LOCAL_BACKUPS_KEY) ?? '[]') } catch { return [] } }

  async saveAdminTrip(trip: Trip, expectedRevision: number): Promise<AdminTripRecord> {
    const current = await this.loadAdminTrip()
    if (current.revision !== expectedRevision) throw Object.assign(new Error('本地草稿版本冲突'), { code: 'CONFLICT' })
    this.addBackup(current, 'save')
    const saved = parseTripData({ ...clone(trip), schemaVersion: CURRENT_TRIP_SCHEMA_VERSION, updatedAt: now() })
    const record = draftRecord(saved, current.revision + 1, current.publishedRevision, current.publishedAt)
    localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(record))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    writeTripCache(ADMIN_CACHE_KEY, record.trip, record.revision)
    return record
  }

  async saveTrip(trip: Trip): Promise<Trip> {
    const current = await this.loadAdminTrip()
    return (await this.saveAdminTrip(trip, current.revision)).trip
  }

  async publishTrip(expectedRevision: number) {
    const current = await this.loadAdminTrip()
    if (current.revision !== expectedRevision) throw Object.assign(new Error('本地草稿版本冲突'), { code: 'CONFLICT' })
    this.addBackup(current, 'publish')
    const publishedAt = now()
    const publicTrip: PublicTripRecord = { trip: toPublicTripDTO(current.trip), sourceRevision: current.revision, publishedAt, publishedBy: 'local-developer' }
    localStorage.setItem(LOCAL_PUBLIC_KEY, JSON.stringify(publicTrip))
    writeTripCache(PUBLIC_CACHE_KEY, publicTrip.trip, publicTrip.sourceRevision)
    const admin = { ...current, publishedRevision: current.revision, publishedAt }
    localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(admin))
    return { admin, publicTrip }
  }

  async listBackups(): Promise<TripBackupRecord[]> { return clone(this.readBackups()) }
  async restoreBackup(backupId: string, expectedRevision: number): Promise<AdminTripRecord> {
    const current = await this.loadAdminTrip()
    if (current.revision !== expectedRevision) throw Object.assign(new Error('本地草稿版本冲突'), { code: 'CONFLICT' })
    const backup = this.readBackups().find((item) => item.id === backupId)
    if (!backup) throw new Error('找不到所选备份。')
    this.addBackup(current, 'restore')
    const record = draftRecord(parseTripData({ ...backup.trip, updatedAt: now() }), current.revision + 1, current.publishedRevision, current.publishedAt)
    localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(record))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record.trip))
    writeTripCache(ADMIN_CACHE_KEY, record.trip, record.revision)
    return record
  }

  async resetTrip(): Promise<Trip> {
    const fresh = parseTripData(sampleTrip)
    const record = draftRecord(fresh, 1)
    localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(record))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
    writeTripCache(ADMIN_CACHE_KEY, fresh, 1)
    localStorage.removeItem(LOCAL_PUBLIC_KEY)
    localStorage.removeItem(PUBLIC_CACHE_KEY)
    localStorage.removeItem(LOCAL_BACKUPS_KEY)
    return fresh
  }
}

export function importLocalTripJson(text: string): Trip { return parseTripJson(text) }
