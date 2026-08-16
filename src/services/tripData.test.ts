import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_DISPLAY_SETTINGS } from '../data/defaults'
import { sampleTrip } from '../data/sampleTrip'
import { CURRENT_TRIP_SCHEMA_VERSION } from '../data/schemaVersion'
import { LocalTripRepository, STORAGE_KEY } from '../repositories/LocalTripRepository'
import { getVisibleStops, resolveVisibility } from '../utils/visibility'
import { toAdminTripDTO, toPublicTripDTO } from './tripDto'
import { parseTripData, parseTripJson, safeParseTripData, TripDataError } from './tripData'

const copy = <T,>(value: T): T => structuredClone(value)

function makeStorage(initial?: Record<string, string>): Storage {
  const values = new Map(Object.entries(initial ?? {}))
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key) },
    setItem: (key, value) => { values.set(key, value) },
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('旅行数据迁移与校验管线', () => {
  it('无版本旧数据按 v0 → v1 → v2 → v3 连续迁移', () => {
    const legacy = copy(sampleTrip) as unknown as Record<string, unknown>
    delete legacy.schemaVersion
    expect(parseTripData(legacy).schemaVersion).toBe(CURRENT_TRIP_SCHEMA_VERSION)
  })

  it('显式 v0 数据可迁移到当前版本', () => {
    const legacy = { ...copy(sampleTrip), schemaVersion: 0 }
    expect(parseTripData(legacy).schemaVersion).toBe(CURRENT_TRIP_SCHEMA_VERSION)
  })

  it('当前版本数据可正确解析并返回独立对象', () => {
    const parsed = parseTripData(sampleTrip)
    expect(parsed).toEqual(sampleTrip)
    expect(parsed).not.toBe(sampleTrip)
  })

  it('高于当前版本的数据会被明确拒绝', () => {
    const result = safeParseTripData({ ...copy(sampleTrip), schemaVersion: CURRENT_TRIP_SCHEMA_VERSION + 1 })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('VERSION_TOO_NEW')
  })

  it('缺少必要字段的数据无法通过校验', () => {
    const invalid = copy(sampleTrip) as unknown as Record<string, unknown>
    delete invalid.title
    const result = safeParseTripData(invalid)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('MISSING_STRUCTURE')
  })

  it('字段类型错误返回可区分的错误', () => {
    const result = safeParseTripData({ ...copy(sampleTrip), participantCount: '六' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('FIELD_TYPE')
  })

  it('展示配置存在但类型错误时不会被默认值静默覆盖', () => {
    const result = safeParseTripData({ ...copy(sampleTrip), displaySettings: 'public' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('FIELD_TYPE')
  })

  it('缺失可选展示配置时深合并系统默认值', () => {
    const legacy = copy(sampleTrip) as unknown as { displaySettings: { detail: Record<string, unknown> } }
    delete legacy.displaySettings.detail.hotelPhone
    const parsed = parseTripData(legacy)
    expect(parsed.displaySettings.detail.hotelPhone).toBe(DEFAULT_DISPLAY_SETTINGS.detail.hotelPhone)
    expect(parsed.displaySettings.detail.route).toBe('public')
  })

  it('hidden 始终不会被局部 public 错误公开', () => {
    expect(resolveVisibility('public', 'hidden')).toBe('hidden')
    const stops = copy(sampleTrip.days[0].stops)
    stops[0].visibility = 'hidden'
    expect(getVisibleStops(stops, 'detail').some((stop) => stop.id === stops[0].id)).toBe(false)
  })

  it('Public DTO 排除管理员备注和未公开地点', () => {
    const trip = copy(sampleTrip)
    trip.days[0].stops[0].internalNotes = '管理员秘密'
    trip.days[0].stops[0].visibility = 'admin'
    const dto = toPublicTripDTO(trip)
    expect(JSON.stringify(dto)).not.toContain('管理员秘密')
    expect(dto.days[0].stops.some((stop) => stop.id === trip.days[0].stops[0].id)).toBe(false)
  })

  it('Admin DTO 保留内部字段并经过统一校验', () => {
    const trip = copy(sampleTrip)
    trip.days[0].stops[0].internalNotes = '仅管理端'
    expect(toAdminTripDTO(trip).days[0].stops[0].internalNotes).toBe('仅管理端')
  })

  it('损坏 localStorage 返回已分类错误而不是原始语法异常', async () => {
    vi.stubGlobal('localStorage', makeStorage({ [STORAGE_KEY]: '{broken' }))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await expect(new LocalTripRepository().loadTrip()).rejects.toMatchObject({ code: 'JSON_SYNTAX' })
  })

  it('保存前强制规范为当前 Schema 版本', async () => {
    const storage = makeStorage()
    vi.stubGlobal('localStorage', storage)
    const saved = await new LocalTripRepository().saveTrip({ ...copy(sampleTrip), schemaVersion: 0 })
    expect(saved.schemaVersion).toBe(CURRENT_TRIP_SCHEMA_VERSION)
    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}').schemaVersion).toBe(CURRENT_TRIP_SCHEMA_VERSION)
  })

  it('合法 JSON 导入能够成功', () => {
    expect(parseTripJson(JSON.stringify(sampleTrip)).id).toBe(sampleTrip.id)
  })

  it('非法 JSON 导入返回可读语法错误', () => {
    expect(() => parseTripJson('{broken')).toThrowError(TripDataError)
    try { parseTripJson('{broken') } catch (error) {
      expect(error).toMatchObject({ code: 'JSON_SYNTAX', message: 'JSON 文件语法不正确，请检查文件是否完整。' })
    }
  })

  it('v1 迁移到当前版本并补入结构化住宿、用餐和风险计划', () => {
    const legacy = copy(sampleTrip) as unknown as Record<string, unknown>
    legacy.schemaVersion = 1
    const days = legacy.days as Array<Record<string, unknown>>
    for (const day of days) { delete day.plan; for (const stop of day.stops as Array<Record<string, unknown>>) { delete stop.phoneVisibility; delete stop.image } }
    const parsed = parseTripData(legacy)
    expect(parsed.schemaVersion).toBe(CURRENT_TRIP_SCHEMA_VERSION)
    expect(parsed.days[0].plan?.accommodation?.city).toBe(sampleTrip.days[0].stayCity)
    expect(parsed.days[0].plan?.meals?.primary).toBe(sampleTrip.days[0].meals)
  })

  it('运营字段通过运行时校验', () => {
    const trip = copy(sampleTrip)
    trip.days[0].plan!.driving = { distanceKm: 380, pureHours: 4.8, plannedHours: 6, toll: 160, latestDeparture: '07:30', breakStops: [{ name: '服务区', durationMinutes: 20 }] }
    trip.days[0].stops[1].openingHours = '全天开放'
    expect(parseTripData(trip).days[0].plan?.driving?.distanceKm).toBe(380)
  })

  it('拒绝 javascript 与 data:text/html 危险 URL', () => {
    for (const navigationUrl of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>']) {
      const trip = copy(sampleTrip); trip.days[0].stops[0].navigationUrl = navigationUrl
      expect(safeParseTripData(trip).success).toBe(false)
    }
  })

  it('新增可选结构全部缺失时仍可规范化', () => {
    const trip = copy(sampleTrip); delete trip.days[0].plan
    expect(parseTripData(trip).days[0].plan).toBeUndefined()
  })

  it('Public DTO 排除候选住宿、价格、内部风险与默认隐藏电话', () => {
    const trip = copy(sampleTrip)
    trip.days[0].plan!.accommodation = { summary: '古城附近', totalPrice: 1888, phone: 'admin-phone', phoneVisibility: 'admin', notes: '议价底线', candidates: [{ id: 'a', name: '候选酒店', type: '酒店', totalPrice: 1999, notes: '管理员候选' }] }
    trip.days[0].plan!.risks = { weather: '可能降雨', internalNotes: '仅管理员风险备注' }
    trip.days[0].stops[0].phone = 'stop-secret'; trip.days[0].stops[0].phoneVisibility = 'admin'
    const text = JSON.stringify(toPublicTripDTO(trip))
    for (const secret of ['1888', '1999', '议价底线', '候选酒店', '仅管理员风险备注', 'admin-phone', 'stop-secret']) expect(text).not.toContain(secret)
    expect(text).toContain('可能降雨')
  })

  it('Public DTO 不包含 CloudBase 无法写入的 undefined 字段', () => {
    const containsUndefined = (value: unknown): boolean => {
      if (Array.isArray(value)) return value.some(containsUndefined)
      if (value && typeof value === 'object') return Object.values(value).some((item) => item === undefined || containsUndefined(item))
      return false
    }
    expect(containsUndefined(toPublicTripDTO(copy(sampleTrip)))).toBe(false)
  })

  it('电话只有显式设为 public 才进入 Public DTO', () => {
    const trip = copy(sampleTrip); trip.days[0].stops[0].phone = '12345'; trip.days[0].stops[0].phoneVisibility = 'public'
    expect(toPublicTripDTO(trip).days[0].stops[0].phone).toBe('12345')
  })

  it('Admin DTO 保留候选住宿、价格与内部风险', () => {
    const trip = copy(sampleTrip); trip.days[0].plan!.accommodation!.candidates = [{ id: 'suite', name: '家庭套房', type: '家庭套房', totalPrice: 1200 }]; trip.days[0].plan!.risks!.internalNotes = '内部'
    const admin = toAdminTripDTO(trip)
    expect(admin.days[0].plan?.accommodation?.candidates?.[0].totalPrice).toBe(1200)
    expect(admin.days[0].plan?.risks?.internalNotes).toBe('内部')
  })

  it('住宿模型不固定三间房，可表达两种房型组合', () => {
    const trip = copy(sampleTrip)
    trip.days[0].plan!.accommodation!.candidates = [{ id: 'family', name: '整套家庭公寓', type: '整套公寓', roomCombinations: [{ roomType: '大床房', count: 1, guests: 2 }, { roomType: '双床房', count: 1, guests: 4 }] }]
    const parsed = parseTripData(trip)
    expect(parsed.days[0].plan?.accommodation?.candidates?.[0].roomCombinations).toHaveLength(2)
  })
})
