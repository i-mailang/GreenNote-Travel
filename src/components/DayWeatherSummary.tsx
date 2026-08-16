import { CloudSun, Wind } from 'lucide-react'
import { useWeather } from '../app/weather-context'
import type { TripDay } from '../types/trip'
import { weatherAdvice } from '../weather/weatherRules'
import { formatBeijingTime, isWeatherSnapshotStale, primaryWeatherForDay, weatherDailyForDate, weatherStatusText } from '../weather/weatherDisplay'

export function DayWeatherSummary({ day }: { day: TripDay }) {
  const { snapshot, loading, cachedAt } = useWeather(); const location = primaryWeatherForDay(snapshot, day.id)
  if (loading && !snapshot) return <div className="day-weather-summary is-loading" aria-label="天气快照载入中"><CloudSun size={16} />天气载入中</div>
  if (!snapshot || !location) return <div className="day-weather-summary"><CloudSun size={16} /><span>尚无天气数据</span></div>
  const daily = weatherDailyForDate(location, day.date); const advice = weatherAdvice(location.scene, daily, location, Boolean(daily))[0]
  return <section className="day-weather-summary" aria-label={`Day ${day.order} 天气快照`}>
    <div><CloudSun size={17} /><strong>{location.name}</strong><span>{daily?.dayText ?? location.current?.text ?? '暂未进入预报窗口'}</span></div>
    <div>{daily ? <span>{daily.high ?? '—'} / {daily.low ?? '—'}℃</span> : <span>暂未进入可靠预报窗口</span>}{(daily?.dayWindScale || location.current?.windScale) && <span><Wind size={14} />{daily?.dayWindScale ?? location.current?.windScale}</span>}</div>
    {advice && <p>{advice}</p>}<small>{cachedAt ? '离线数据' : isWeatherSnapshotStale(snapshot) ? '数据超过12小时' : weatherStatusText(location.status)} · 北京时间 {formatBeijingTime(snapshot.lastCheckedAt)}</small>
  </section>
}
