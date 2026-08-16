import { AlertTriangle, CloudSun, Droplets, Wind } from 'lucide-react'
import { useWeather } from '../app/weather-context'
import type { TripDay } from '../types/trip'
import { weatherAdvice } from '../weather/weatherRules'
import { formatBeijingTime, isWeatherSnapshotStale, weatherDailyForDate, weatherLocationsForDaySnapshot, weatherStatusText } from '../weather/weatherDisplay'

export function DayWeatherPanel({ day }: { day: TripDay }) {
  const { snapshot, error, cachedAt } = useWeather(); const locations = weatherLocationsForDaySnapshot(snapshot, day.id)
  return <section className="section-block weather-detail" aria-labelledby="weather-heading"><div className="section-heading"><div><p className="eyebrow"><CloudSun size={17} />定时天气快照</p><h2 id="weather-heading">当日天气</h2></div>{snapshot && <p>{isWeatherSnapshotStale(snapshot) ? '数据超过12小时' : weatherStatusText(snapshot.status)}</p>}</div>
    {cachedAt && <p className="weather-offline-note">离线数据 · 更新于北京时间 {formatBeijingTime(snapshot?.lastSuccessAt)}</p>}
    {error && <p className="weather-inline-error">{error} 行程正文不受影响。</p>}
    {!locations.length ? <p className="empty-state">尚无天气数据。</p> : <div className="weather-location-grid">{locations.map((location) => { const daily = weatherDailyForDate(location, day.date); const advice = weatherAdvice(location.scene, daily, location, Boolean(daily)); return <article className="weather-location-card" key={location.locationId}>
      <div className="weather-card-heading"><div><span className="status-tag">{weatherStatusText(location.status)}</span><h3>{location.name}</h3></div><CloudSun aria-label="天气" /></div>
      {daily ? <><p className="weather-temperature"><strong>{daily.dayText ?? '天气待定'}</strong><span>{daily.high ?? '—'} / {daily.low ?? '—'}℃</span></p><p><Wind size={16} />{daily.dayWindDirection ?? '风向待定'} {daily.dayWindScale ?? '风力待定'}</p></> : <p>暂未进入可靠预报窗口</p>}
      {location.current && <p><Droplets size={16} />当前 {location.current.temperature ?? '—'}℃ · 湿度 {location.current.humidity ?? '—'}% · 降水 {location.current.precipitation ?? '—'} mm</p>}
      {location.hourly.length > 0 && <div className="weather-hours" aria-label="关键时段预报">{location.hourly.slice(0, 4).map((hour) => <span key={hour.time}><time>{formatBeijingTime(hour.time)}</time>{hour.text ?? '待定'} {hour.temperature ?? '—'}℃</span>)}</div>}
      {location.alerts.map((alert) => <p className="weather-alert" role="status" key={`${alert.title}-${alert.publishedAt}`}><AlertTriangle size={17} /><strong>{alert.level ?? '气象'}预警：</strong>{alert.title}</p>)}
      {advice.length > 0 && <ul className="weather-advice">{advice.map((item) => <li key={item}>{item}</li>)}</ul>}
      <small>来源：{snapshot?.provider === 'mock' ? 'Mock Fixture（本地开发）' : '百度地图天气查询'} · 上游更新 {formatBeijingTime(location.sourceUpdatedAt)}</small>
    </article> })}</div>}
    {snapshot && <p className="weather-meta">最近检查：北京时间 {formatBeijingTime(snapshot.lastCheckedAt)} · 最近成功：北京时间 {formatBeijingTime(snapshot.lastSuccessAt)}</p>}
  </section>
}
