import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { sampleTrip } from '../data/sampleTrip'
import { dataMode } from '../infra/cloudbase'
import { CloudBaseAdminTripRepository, CloudBasePublicTripRepository } from '../repositories/CloudBaseTripRepository'
import { LocalTripRepository } from '../repositories/LocalTripRepository'
import { AppError } from '../services/appError'
import { parseTripData } from '../services/tripData'
import { ADMIN_CACHE_KEY, PUBLIC_CACHE_KEY, readTripCache } from '../services/tripCache'
import { publicDtoToTrip } from '../services/publicView'
import type { PublicTripDTO, TripBackupRecord } from '../types/dto'
import type { Trip } from '../types/trip'
import { TripContext } from './trip-context'

const local = new LocalTripRepository()
const publicRepository = dataMode === 'cloud' ? new CloudBasePublicTripRepository() : local
const adminRepository = dataMode === 'cloud' ? new CloudBaseAdminTripRepository() : local

export function TripProvider({ children, scope }: { children: ReactNode; scope: 'public' | 'admin' }) {
  const [trip, setTrip] = useState<Trip>(() => parseTripData(sampleTrip))
  const [revision, setRevision] = useState(0)
  const [publishedRevision, setPublishedRevision] = useState<number | null>(null)
  const [cachedAt, setCachedAt] = useState<string | null>(null)
  const [backups, setBackups] = useState<TripBackupRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const retry = useCallback(async () => {
    setLoading(true); setError(''); setCachedAt(null)
    try {
      if (scope === 'admin') {
        const record = await adminRepository.loadAdminTrip(); setTrip(record.trip); setRevision(record.revision); setPublishedRevision(record.publishedRevision)
      } else {
        const record = await publicRepository.loadPublicTrip(); setTrip(publicDtoToTrip(record.trip)); setRevision(record.sourceRevision)
      }
    } catch (reason) {
      const cache = readTripCache<Trip | PublicTripDTO>(scope === 'admin' ? ADMIN_CACHE_KEY : PUBLIC_CACHE_KEY)
      if (cache) {
        setTrip(scope === 'admin' ? parseTripData(cache.trip) : publicDtoToTrip(cache.trip as PublicTripDTO)); setRevision(cache.revision); setCachedAt(cache.cachedAt)
        setError(scope === 'admin' ? '云端草稿无法读取。此处仅显示紧急本地副本，不能静默保存或发布。' : '当前显示离线缓存的已发布行程。')
      } else setError(reason instanceof Error ? reason.message : '加载失败')
    } finally { setLoading(false) }
  }, [scope])

  useEffect(() => { const timer = window.setTimeout(() => void retry(), 0); return () => window.clearTimeout(timer) }, [retry])
  const save = useCallback(async (next: Trip) => {
    if (cachedAt && dataMode === 'cloud') throw new AppError('OFFLINE', '当前只读紧急副本不能保存；请导出 JSON，联网后再处理。')
    const record = await adminRepository.saveAdminTrip(next, revision); setTrip(record.trip); setRevision(record.revision); setPublishedRevision(record.publishedRevision); setError(''); return record.trip
  }, [cachedAt, revision])
  const initialize = useCallback(async (next: Trip) => {
    const record = await adminRepository.initializeAdminTrip(next); setTrip(record.trip); setRevision(record.revision); setPublishedRevision(record.publishedRevision); setError(''); return record.trip
  }, [])
  const publish = useCallback(async () => {
    if (cachedAt && dataMode === 'cloud') throw new AppError('OFFLINE', '离线时不能发布。')
    const result = await adminRepository.publishTrip(revision); setRevision(result.admin.revision); setPublishedRevision(result.admin.publishedRevision); setError('')
  }, [cachedAt, revision])
  const reset = useCallback(async () => {
    if (dataMode === 'cloud') { await retry(); return trip }
    const fresh = await local.resetTrip(); setTrip(fresh); setRevision(1); setPublishedRevision(null); return fresh
  }, [retry, trip])
  const loadBackups = useCallback(async () => setBackups(await adminRepository.listBackups()), [])
  const restoreBackup = useCallback(async (backupId: string) => {
    const record = await adminRepository.restoreBackup(backupId, revision); setTrip(record.trip); setRevision(record.revision); setPublishedRevision(record.publishedRevision); return record.trip
  }, [revision])
  const loadPublicSnapshot = useCallback(async () => (await publicRepository.loadPublicTrip()).trip, [])
  const value = useMemo(() => ({ trip, loading, error, scope, revision, publishedRevision, cachedAt, save, initialize, publish, reset, retry, backups, loadBackups, restoreBackup, loadPublicSnapshot }), [trip, loading, error, scope, revision, publishedRevision, cachedAt, save, initialize, publish, reset, retry, backups, loadBackups, restoreBackup, loadPublicSnapshot])
  return <TripContext.Provider value={value}>{children}</TripContext.Provider>
}
