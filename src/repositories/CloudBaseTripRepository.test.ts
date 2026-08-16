import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sampleTrip } from '../data/sampleTrip'
import { toPublicTripDTO } from '../services/tripDto'
import { PUBLIC_CACHE_KEY } from '../services/tripCache'

const { callCloudFunction } = vi.hoisted(() => ({ callCloudFunction: vi.fn() }))
vi.mock('../infra/cloudbase', () => ({ callCloudFunction }))

import { CloudBaseAdminTripRepository, CloudBasePublicTripRepository } from './CloudBaseTripRepository'

const adminRecord = () => ({ trip: structuredClone(sampleTrip), revision: 3, updatedAt: sampleTrip.updatedAt, updatedBy: 'uid', publishedRevision: 2, publishedAt: sampleTrip.updatedAt })
const publicRecord = () => ({ trip: toPublicTripDTO(structuredClone(sampleTrip)), sourceRevision: 3, publishedAt: sampleTrip.updatedAt, publishedBy: 'uid' })
const memoryStorage = (): Storage => { const map = new Map<string, string>(); return { get length() { return map.size }, clear: () => map.clear(), getItem: (key) => map.get(key) ?? null, key: (i) => [...map.keys()][i] ?? null, removeItem: (key) => { map.delete(key) }, setItem: (key, value) => { map.set(key, value) } } }

describe('CloudBase 仓储客户端', () => {
  beforeEach(() => { callCloudFunction.mockReset(); vi.stubGlobal('localStorage', memoryStorage()); vi.stubGlobal('navigator', { onLine: true }) })

  it('公开加载成功并刷新最后已知公开缓存', async () => {
    callCloudFunction.mockResolvedValue(publicRecord())
    const record = await new CloudBasePublicTripRepository().loadPublicTrip()
    expect(record.sourceRevision).toBe(3)
    expect(JSON.parse(localStorage.getItem(PUBLIC_CACHE_KEY) ?? '{}').revision).toBe(3)
  })

  it('尚未发布映射为可识别错误', async () => {
    callCloudFunction.mockRejectedValue(new Error('NO_PUBLIC_TRIP'))
    await expect(new CloudBasePublicTripRepository().loadPublicTrip()).rejects.toMatchObject({ code: 'NO_PUBLIC_TRIP' })
  })

  it('管理员加载与保存成功并传递 expectedRevision', async () => {
    callCloudFunction.mockResolvedValueOnce(adminRecord()).mockResolvedValueOnce({ ...adminRecord(), revision: 4 })
    const repo = new CloudBaseAdminTripRepository(); expect((await repo.loadAdminTrip()).revision).toBe(3)
    expect((await repo.saveAdminTrip(structuredClone(sampleTrip), 3)).revision).toBe(4)
    expect(callCloudFunction).toHaveBeenLastCalledWith('saveAdminTrip', expect.objectContaining({ expectedRevision: 3 }))
  })

  it.each([['CONFLICT', 'CONFLICT'], ['PERMISSION_DENIED', 'UNAUTHORIZED'], ['network timeout', 'NETWORK'], ['FIELD_TYPE schema', 'SCHEMA']])('将 %s 映射为 %s', async (message, code) => {
    callCloudFunction.mockRejectedValue(new Error(message))
    await expect(new CloudBaseAdminTripRepository().loadAdminTrip()).rejects.toMatchObject({ code })
  })

  it('拒绝过新或损坏的公开响应', async () => {
    callCloudFunction.mockResolvedValue({ ...publicRecord(), trip: { ...publicRecord().trip, schemaVersion: 99 } })
    await expect(new CloudBasePublicTripRepository().loadPublicTrip()).rejects.toMatchObject({ code: 'SCHEMA' })
  })

  it('云端恢复后用新响应覆盖旧缓存，云端始终优先', async () => {
    localStorage.setItem(PUBLIC_CACHE_KEY, JSON.stringify({ trip: publicRecord().trip, revision: 1, schemaVersion: 2, cachedAt: '2020-01-01T00:00:00.000Z' }))
    callCloudFunction.mockResolvedValue(publicRecord())
    await new CloudBasePublicTripRepository().loadPublicTrip()
    expect(JSON.parse(localStorage.getItem(PUBLIC_CACHE_KEY) ?? '{}').revision).toBe(3)
  })
})
