import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sampleTrip } from '../data/sampleTrip'
import { LOCAL_BACKUPS_KEY, LocalTripRepository } from './LocalTripRepository'

function storage(): Storage {
  const values = new Map<string, string>()
  return { get length() { return values.size }, clear: () => values.clear(), getItem: (key) => values.get(key) ?? null, key: (index) => [...values.keys()][index] ?? null, removeItem: (key) => { values.delete(key) }, setItem: (key, value) => { values.set(key, value) } }
}

describe('本地仓储模拟云端修订与发布流程', () => {
  beforeEach(() => vi.stubGlobal('localStorage', storage()))

  it('保存前创建备份并递增修订号', async () => {
    const repo = new LocalTripRepository(); const initial = await repo.loadAdminTrip()
    const saved = await repo.saveAdminTrip({ ...structuredClone(sampleTrip), title: '新草稿' }, initial.revision)
    expect(saved.revision).toBe(2)
    expect(JSON.parse(localStorage.getItem(LOCAL_BACKUPS_KEY) ?? '[]')).toHaveLength(1)
  })

  it('错误 expectedRevision 返回冲突且不覆盖草稿', async () => {
    const repo = new LocalTripRepository()
    await expect(repo.saveAdminTrip(structuredClone(sampleTrip), 99)).rejects.toMatchObject({ code: 'CONFLICT' })
    expect((await repo.loadAdminTrip()).revision).toBe(1)
  })

  it('发布生成公开 DTO、记录源修订并先备份', async () => {
    const repo = new LocalTripRepository(); const initial = await repo.loadAdminTrip()
    initial.trip.days[0].stops[0].internalNotes = '禁止发布'
    const saved = await repo.saveAdminTrip(initial.trip, 1)
    const result = await repo.publishTrip(saved.revision)
    expect(result.publicTrip.sourceRevision).toBe(2)
    expect(JSON.stringify(result.publicTrip)).not.toContain('禁止发布')
    expect(result.admin.publishedRevision).toBe(2)
    expect((await repo.listBackups()).some((item) => item.reason === 'publish')).toBe(true)
  })

  it('恢复备份创建新修订而不是倒退修订号', async () => {
    const repo = new LocalTripRepository(); await repo.saveAdminTrip({ ...structuredClone(sampleTrip), title: '版本二' }, 1)
    const backup = (await repo.listBackups())[0]
    const restored = await repo.restoreBackup(backup.id, 2)
    expect(restored.revision).toBe(3)
    expect(restored.trip.title).toBe(sampleTrip.title)
  })
})
