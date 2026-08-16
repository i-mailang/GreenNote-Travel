import { CloudSun, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useWeather } from '../app/weather-context'
import { dataMode } from '../infra/cloudbase'
import type { MockWeatherScenario } from '../weather/weatherFixtures'
import { formatBeijingTime, weatherStatusText } from '../weather/weatherDisplay'

const scenarios: Array<[MockWeatherScenario, string]> = [['ok', '正常晴天'], ['rain', '雨天'], ['thunder-alert', '雷暴预警'], ['heat', '高温'], ['wind', '大风'], ['missing-fields', '字段缺失'], ['partial', '部分失败'], ['stale', '全部失败沿用旧快照'], ['unavailable', '尚无数据']]
export function AdminWeatherPanel({ tripRevision }: { tripRevision: number }) {
  const { snapshot, adminSummary, refreshing, error, refresh } = useWeather(); const [scenario, setScenario] = useState<MockWeatherScenario>('ok'); const [beforeRevision, setBeforeRevision] = useState<number | null>(null)
  const run = async () => { if (!window.confirm('刷新天气不会修改行程草稿或发布修订版。是否继续？')) return; setBeforeRevision(tripRevision); await refresh(dataMode === 'local' ? scenario : undefined) }
  const counts = adminSummary?.counts ?? { ok: snapshot?.locations.filter((x) => x.status === 'ok').length ?? 0, stale: snapshot?.locations.filter((x) => x.status === 'stale').length ?? 0, unavailable: snapshot?.locations.filter((x) => x.status === 'unavailable').length ?? 0 }
  return <section className="admin-section weather-admin"><div className="section-heading"><div><p className="eyebrow"><CloudSun size={17} />独立天气服务</p><h2>定时天气快照</h2></div></div>
    <div className="weather-admin-grid"><p><strong>Provider</strong><span>{dataMode === 'local' ? 'MockWeatherProvider' : adminSummary?.provider ?? 'BaiduWeatherProvider'}</span></p><p><strong>百度 AK</strong><span>{adminSummary?.akConfigured ? '已配置' : '未配置'}</span></p><p><strong>快照状态</strong><span>{snapshot ? weatherStatusText(snapshot.status) : '尚无数据'}</span></p><p><strong>地点统计</strong><span>成功 {counts.ok} · 过期 {counts.stale} · 失败 {counts.unavailable}</span></p><p><strong>最近检查</strong><span>{formatBeijingTime(snapshot?.lastCheckedAt)}</span></p><p><strong>最近成功</strong><span>{formatBeijingTime(snapshot?.lastSuccessAt)}</span></p><p><strong>下次计划</strong><span>{formatBeijingTime(snapshot?.nextScheduledAt)}</span></p></div>
    {dataMode === 'local' && <label className="weather-scenario">本地模拟状态<select value={scenario} onChange={(event) => setScenario(event.target.value as MockWeatherScenario)}>{scenarios.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>}
    <button className="primary-button" onClick={() => void run()} disabled={refreshing}><RefreshCw size={17} />{refreshing ? '刷新中…' : dataMode === 'local' ? '运行 Mock 刷新' : '手动刷新天气'}</button>
    {error && <p className="live-message">{error}</p>}{beforeRevision !== null && !refreshing && <p className="weather-revision-proof">天气刷新前后行程修订版均为 {tripRevision}{beforeRevision === tripRevision ? '，未发生变化。' : '。'}</p>}
  </section>
}
