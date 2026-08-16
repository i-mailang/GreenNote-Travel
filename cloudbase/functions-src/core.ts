import cloudbase from '@cloudbase/node-sdk'
import { randomUUID } from 'node:crypto'
import { parseTripData } from '../../src/services/tripData'
import { toPublicTripDTO } from '../../src/services/tripDto'
import type { Trip } from '../../src/types/trip'

export const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV })
export const db = app.database()
type Transaction = { collection: (name: string) => ReturnType<typeof db.collection> }
const ADMIN = 'trip_admin'
const PUBLIC = 'trip_public'
const BACKUPS = 'trip_backups'
const USERS = 'admin_users'

type Event = { trip?: unknown; expectedRevision?: unknown; backupId?: string; authOnly?: boolean }
type AdminDoc = { trip: Trip; revision: number; updatedAt: unknown; updatedBy: string; publishedRevision: number | null; publishedAt: unknown | null }

export class FunctionError extends Error { constructor(public code: string, message: string) { super(message) } }
export const success = (data: unknown) => ({ ok: true, data })
export const failure = (error: unknown) => {
  const known = error instanceof FunctionError
  if (!known) console.error('trip function failed', error instanceof Error ? error.message : 'unknown')
  return { ok: false, error: { code: known ? error.code : 'INTERNAL', message: known ? error.message : '服务暂时不可用，请稍后重试。' } }
}
export const first = <T,>(result: { data?: T[] | T | null }): T | null => Array.isArray(result.data) ? result.data[0] ?? null : result.data ?? null
export const iso = () => new Date().toISOString()
const revisionNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value >= 0 ? value : null
  if (typeof value === 'string' && /^(0|[1-9]\d*)$/.test(value)) {
    const parsed = Number(value)
    return Number.isSafeInteger(parsed) ? parsed : null
  }
  if (value && typeof value === 'object' && 'toNumber' in value && typeof value.toNumber === 'function') {
    const parsed = value.toNumber()
    return typeof parsed === 'number' && Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null
  }
  return null
}
const cleanAdmin = (doc: AdminDoc): AdminDoc => {
  const { _id: ignoredDocumentId, ...record } = doc as AdminDoc & { _id?: unknown }
  void ignoredDocumentId
  return record
}

export async function requireAdmin() {
  const user = app.auth().getUserInfo()
  if (!user.uid || user.isAnonymous) throw new FunctionError('SESSION_EXPIRED', '请使用管理员账号重新登录。')
  const admin = first<{ enabled?: boolean; displayName?: string }>(await db.collection(USERS).doc(user.uid).get())
  if (!admin?.enabled) throw new FunctionError('UNAUTHORIZED', '当前账号没有管理员权限。')
  return { uid: user.uid, displayName: admin.displayName, loginType: 'AUTH_V2', isAdmin: true }
}
async function readAdmin(): Promise<AdminDoc> {
  const doc = first<AdminDoc>(await db.collection(ADMIN).doc('main').get())
  if (!doc) throw new FunctionError('NO_ADMIN_TRIP', '云端草稿尚未初始化。')
  return { ...cleanAdmin(doc), trip: parseTripData(doc.trip) }
}
async function cleanupBackups() {
  const stale = await db.collection(BACKUPS).orderBy('createdAt', 'desc').skip(20).limit(100).get()
  await Promise.all((stale.data ?? []).map((item: { _id?: string }) => item._id ? db.collection(BACKUPS).doc(item._id).remove() : Promise.resolve()))
}
const clientAdmin = (doc: AdminDoc) => ({ ...cleanAdmin(doc), updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : iso(), publishedAt: doc.publishedAt ? (typeof doc.publishedAt === 'string' ? doc.publishedAt : iso()) : null })

export async function getPublicTrip() {
  try {
    const doc = first<Record<string, unknown>>(await db.collection(PUBLIC).doc('main').get())
    if (!doc) throw new FunctionError('NO_PUBLIC_TRIP', '旅行计划尚未发布。')
    return success({ trip: doc.trip, sourceRevision: doc.sourceRevision, publishedAt: typeof doc.publishedAt === 'string' ? doc.publishedAt : iso() })
  } catch (error) { return failure(error) }
}
export async function getAdminTrip(event: Event) {
  try {
    const session = await requireAdmin()
    if (event.authOnly) return success(session)
    return success(clientAdmin(await readAdmin()))
  } catch (error) { return failure(error) }
}
export async function initializeTrip(event: Event) {
  try {
    const admin = await requireAdmin()
    const trip = parseTripData(event.trip)
    let record!: AdminDoc
    await db.runTransaction(async (tx: Transaction) => {
      const existing = first(await tx.collection(ADMIN).doc('main').get())
      if (existing) throw new FunctionError('ALREADY_INITIALIZED', '云端草稿已经存在，初始化已取消。')
      record = { trip, revision: 1, updatedAt: db.serverDate({ offset: 0 }), updatedBy: admin.uid, publishedRevision: null, publishedAt: null }
      await tx.collection(ADMIN).doc('main').set(record)
    })
    return success(clientAdmin(record))
  } catch (error) { return failure(error) }
}
export async function saveAdminTrip(event: Event) {
  try {
    const admin = await requireAdmin()
    const expectedRevision = revisionNumber(event.expectedRevision)
    if (expectedRevision === null) throw new FunctionError('INVALID_INPUT', '缺少有效的预期修订号。')
    const trip = parseTripData(event.trip)
    let next!: AdminDoc
    await db.runTransaction(async (tx: Transaction) => {
      const current = first<AdminDoc>(await tx.collection(ADMIN).doc('main').get())
      if (!current) throw new FunctionError('NO_ADMIN_TRIP', '云端草稿尚未初始化。')
      const currentRevision = revisionNumber(current.revision)
      if (currentRevision === null || currentRevision !== expectedRevision) throw new FunctionError('CONFLICT', '云端草稿已被其他操作更新。')
      await tx.collection(BACKUPS).doc(randomUUID()).set({ trip: current.trip, revision: current.revision, reason: 'save', createdAt: db.serverDate({ offset: 0 }), createdBy: admin.uid })
      next = { ...cleanAdmin(current), trip, revision: currentRevision + 1, updatedAt: db.serverDate({ offset: 0 }), updatedBy: admin.uid }
      await tx.collection(ADMIN).doc('main').set(next)
    })
    await cleanupBackups()
    return success(clientAdmin(next))
  } catch (error) { return failure(error) }
}
export async function publishTrip(event: Event) {
  try {
    const admin = await requireAdmin()
    const expectedRevision = revisionNumber(event.expectedRevision)
    let next!: AdminDoc
    let publicTrip!: { trip: ReturnType<typeof toPublicTripDTO>; sourceRevision: number; publishedAt: unknown; publishedBy: string }
    await db.runTransaction(async (tx: Transaction) => {
      const current = first<AdminDoc>(await tx.collection(ADMIN).doc('main').get())
      const currentRevision = current ? revisionNumber(current.revision) : null
      if (!current || expectedRevision === null || currentRevision === null || currentRevision !== expectedRevision) throw new FunctionError('CONFLICT', '发布前草稿版本已发生变化。')
      const publishedAt = db.serverDate({ offset: 0 })
      await tx.collection(BACKUPS).doc(randomUUID()).set({ trip: current.trip, revision: current.revision, reason: 'publish', createdAt: publishedAt, createdBy: admin.uid })
      publicTrip = { trip: toPublicTripDTO(parseTripData(current.trip)), sourceRevision: currentRevision, publishedAt, publishedBy: admin.uid }
      next = { ...cleanAdmin(current), revision: currentRevision, publishedRevision: currentRevision, publishedAt }
      await tx.collection(PUBLIC).doc('main').set(publicTrip)
      await tx.collection(ADMIN).doc('main').set(next)
    })
    await cleanupBackups()
    return success({ admin: clientAdmin(next), publicTrip: { ...publicTrip, publishedAt: iso() } })
  } catch (error) { return failure(error) }
}
export async function listTripBackups() {
  try {
    await requireAdmin()
    const result = await db.collection(BACKUPS).orderBy('createdAt', 'desc').limit(20).get()
    return success((result.data ?? []).map((item: Record<string, unknown>) => ({ ...item, id: item._id, createdAt: typeof item.createdAt === 'string' ? item.createdAt : iso() })))
  } catch (error) { return failure(error) }
}
export async function restoreTripBackup(event: Event) {
  try {
    const admin = await requireAdmin()
    const expectedRevision = revisionNumber(event.expectedRevision)
    if (!event.backupId || expectedRevision === null) throw new FunctionError('INVALID_INPUT', '缺少备份 ID 或预期修订号。')
    const selected = first<{ trip: Trip }>(await db.collection(BACKUPS).doc(event.backupId).get())
    if (!selected) throw new FunctionError('NOT_FOUND', '所选备份不存在。')
    const restoredTrip = parseTripData(selected.trip)
    let next!: AdminDoc
    await db.runTransaction(async (tx: Transaction) => {
      const current = first<AdminDoc>(await tx.collection(ADMIN).doc('main').get())
      const currentRevision = current ? revisionNumber(current.revision) : null
      if (!current || currentRevision === null || currentRevision !== expectedRevision) throw new FunctionError('CONFLICT', '恢复前草稿版本已发生变化。')
      await tx.collection(BACKUPS).doc(randomUUID()).set({ trip: current.trip, revision: current.revision, reason: 'restore', createdAt: db.serverDate({ offset: 0 }), createdBy: admin.uid })
      next = { ...cleanAdmin(current), trip: restoredTrip, revision: currentRevision + 1, updatedAt: db.serverDate({ offset: 0 }), updatedBy: admin.uid }
      await tx.collection(ADMIN).doc('main').set(next)
    })
    await cleanupBackups()
    return success(clientAdmin(next))
  } catch (error) { return failure(error) }
}
