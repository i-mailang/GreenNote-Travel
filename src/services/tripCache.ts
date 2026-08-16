import type { CachedTrip, PublicTripDTO } from '../types/dto'
import type { Trip } from '../types/trip'
import { storageKey } from '../config/appConfig'

export const PUBLIC_CACHE_KEY = storageKey('last-known-public-trip')
export const ADMIN_CACHE_KEY = storageKey('last-known-admin-draft')

export function writeTripCache<T extends Trip | PublicTripDTO>(key: string, trip: T, revision: number): void {
  const value: CachedTrip<T> = { trip: structuredClone(trip), revision, schemaVersion: trip.schemaVersion, cachedAt: new Date().toISOString() }
  localStorage.setItem(key, JSON.stringify(value))
}

export function readTripCache<T>(key: string): CachedTrip<T> | null {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null') as CachedTrip<T> | null
    return value && typeof value.revision === 'number' && typeof value.cachedAt === 'string' ? value : null
  } catch { return null }
}
