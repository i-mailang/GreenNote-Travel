import { ArrowRight, BedDouble, Clock3, Gauge, MapPin, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { TripDay, Visibility } from '../types/trip'
import { formatDate } from '../utils/format'
import { getVisibleStops, isVisible } from '../utils/visibility'
import { TripImage } from './TripImage'
import { DayWeatherSummary } from './DayWeatherSummary'
import { useAppConfig } from '../app/app-config-context'

export function DayCard({ day, global, isToday, linkPrefix = '' }: { day: TripDay; global: Record<string, Visibility>; isToday: boolean; linkPrefix?: string }) {
  const config = useAppConfig()
  const show = (field: string) => isVisible(day.displayOverrides.card?.[field as never], global[field])
  const firstVisibleStop = day.stops.find((stop) => !['admin', 'hidden'].includes(stop.visibility) && stop.image)
  const mainImage = firstVisibleStop?.image
  return <article className={`day-card ${isToday ? 'today' : ''}`}>
    {mainImage && <TripImage image={mainImage} className="day-card-image" />}
    <div className="day-card-top"><span className="day-number">Day {day.order}</span>{isToday && <span className="today-tag">今天</span>}{show('status') && <span className="status-tag">{day.status}</span>}</div>
    {show('date') && <p className="eyebrow">{formatDate(day.date)}</p>}
    {show('title') && <h3>{day.title}</h3>}
    {show('route') && <p className="route-summary"><MapPin size={17} />{day.origin}<ArrowRight size={15} />{day.destination}</p>}
    <dl className="compact-facts">
      {show('stay') && <div><dt><BedDouble size={16} />住宿</dt><dd>{day.stayCity}</dd></div>}
      {show('departureTime') && <div><dt><Clock3 size={16} />出发</dt><dd>{day.departureTime || '待定'}</dd></div>}
      {day.plan?.driving?.plannedHours !== undefined && <div><dt><Gauge size={16} />计划车程</dt><dd>{day.plan.driving.plannedHours} 小时</dd></div>}
      {day.stops.some((stop) => stop.walkingIntensity) && <div><dt><MapPin size={16} />步行强度</dt><dd>{day.stops.find((stop) => stop.walkingIntensity)?.walkingIntensity}</dd></div>}
    </dl>
    {show('stops') && <div className="chips" aria-label="主要地点">{getVisibleStops(day.stops, 'detail').slice(0, 4).map((stop) => <span key={stop.id}>{stop.name}</span>)}</div>}
    {show('reminder') && day.reminder && <p className="card-reminder">{day.reminder}</p>}
    {day.plan?.risks?.mainDelayPoint && <p className="card-reminder"><ShieldAlert size={15} /> 主要延误点：{day.plan.risks.mainDelayPoint}</p>}
    {config.features.weather && <DayWeatherSummary day={day} />}
    <Link className="card-link" to={`${linkPrefix}/day/${day.id}`}>查看当日安排<ArrowRight size={18} /></Link>
  </article>
}
