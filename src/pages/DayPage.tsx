import { ArrowLeft, BookOpen, CarFront, CheckCircle2, Clock3, CloudSun, ExternalLink, Hotel, MapPin, Navigation, ShieldAlert, Utensils } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useTrip } from '../app/trip-context'
import { displayValue, formatDate } from '../utils/format'
import { getVisibleStops, isVisible } from '../utils/visibility'
import { TripImage } from '../components/TripImage'
import { DayWeatherPanel } from '../components/DayWeatherPanel'
import { useAppConfig } from '../app/app-config-context'

export function DayPage() {
  const config = useAppConfig()
  const { dayId } = useParams(); const location = useLocation(); const preview = location.pathname.startsWith('/preview/'); const { trip } = useTrip(); const day = trip.days.find((item) => item.id === dayId)
  if (!day) return <main className="state-panel"><h1>没有找到这一天</h1><p>行程可能已被调整或删除。</p><Link className="primary-button" to="/">返回首页</Link></main>
  const show = (field: string) => isVisible(day.displayOverrides.detail?.[field as never], trip.displaySettings.detail[field as never])
  const stops = getVisibleStops(day.stops, 'detail')
  return <main className="detail-page"><div className="detail-hero"><div className="detail-hero-content"><Link to="/" className="back-link"><ArrowLeft size={18} />返回全部行程</Link><p className="eyebrow">Day {day.order} · {formatDate(day.date)}</p><h1>{day.title}</h1>{show('route') && <p className="detail-route">{day.origin} → {day.destination}</p>}<div className="chips"><span>{day.status}</span>{show('schedule') && <span>出发 {displayValue(day.departureTime)}</span>}{show('schedule') && <span>抵达 {displayValue(day.arrivalTime)}</span>}</div></div></div>
    <div className="page-shell detail-shell">
      <section className="day-brief section-block"><p className="eyebrow">当日概览 · 强度 {day.intensity}</p><h2>路线摘要</h2><p>{day.summary}</p></section>
      {config.features.weather && <DayWeatherPanel day={day} />}
      <section className="section-block"><div className="section-heading"><div><p className="eyebrow"><MapPin size={17} />依次抵达</p><h2>当日地点</h2></div></div>
        {stops.length ? <ol className="stop-list">{stops.map((stop, index) => <li key={stop.id}><span className="stop-index">{index + 1}</span><article>{stop.image && <TripImage image={stop.image} className="stop-image" />}<div className="stop-heading"><div><span className="stop-type">{stop.type}</span><h3>{stop.name}</h3></div>{show('stopStatus') && <span className="status-tag">{stop.status}</span>}</div>
          {show('schedule') && <p><Clock3 size={17} />预计到达：{displayValue(stop.arrivalTime)}{show('duration') && <> · 停留：{displayValue(stop.duration)}</>}</p>}
          {show('address') && (stop.address || stop.entrance) && <p><MapPin size={17} />{stop.address}{stop.entrance && ` · 入口：${stop.entrance}`}</p>}
          {stop.openingHours && <p><Clock3 size={17} />开放时间：{stop.openingHours}</p>}
          {show('tickets') && (stop.ticket || stop.reservation || stop.ticketNotes) && <p><ShieldAlert size={17} />{[stop.ticket, stop.reservation, stop.ticketNotes].filter(Boolean).join(' · ')}</p>}
          {(stop.parking || stop.walkingIntensity || stop.weatherSensitivity) && <p><CarFront size={17} />{[stop.parking && `停车：${stop.parking}`, stop.walkingIntensity && `步行：${stop.walkingIntensity}`, stop.weatherSensitivity && `天气敏感度：${stop.weatherSensitivity}`].filter(Boolean).join(' · ')}</p>}
          {stop.summary && <p className="stop-summary">{stop.summary}</p>}
          {stop.backup && <p><ShieldAlert size={17} />备用：{stop.backup}</p>}{stop.phone && <p>电话：{stop.phone}</p>}
          {stop.guide && <Link className="secondary-button" to={`${preview ? '/preview' : ''}/place/${stop.id}`}><BookOpen size={17} />查看完整攻略</Link>}
          {show('navigation') && (stop.navigationUrl ? <a className="secondary-button" href={stop.navigationUrl} target="_blank" rel="noopener noreferrer"><Navigation size={17} />打开导航<ExternalLink size={14} /><span className="sr-only">（将在新窗口离开当前网页）</span></a> : <button className="secondary-button" disabled title="暂未配置导航"><Navigation size={17} />暂未配置导航</button>)}
        </article></li>)}</ol> : <p className="empty-state">这一天暂无公开地点。</p>}
      </section>
      {day.options.length > 0 && <section className="section-block"><div className="section-heading"><div><p className="eyebrow">现场弹性</p><h2>方案选择</h2></div></div><div className="option-grid">{day.options.map((item) => <article className="info-card" key={item.title}><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>{day.choiceBasis && <p className="choice-basis"><strong>选择依据：</strong>{day.choiceBasis}</p>}</section>}
      {day.verificationItems.length > 0 && <section className="info-card wide verification-card"><CheckCircle2 /><h2>临行核验</h2><ul>{day.verificationItems.map((item) => <li key={item}>{item}</li>)}</ul></section>}
      <div className="detail-grid">
        {day.plan?.driving && Object.values(day.plan.driving).some((value) => value !== undefined && value !== '' && (!Array.isArray(value) || value.length)) && <section className="info-card wide"><CarFront /><h2>行车安排</h2><p>{[day.plan.driving.distanceKm !== undefined && `${day.plan.driving.distanceKm} 公里`, day.plan.driving.pureHours !== undefined && `纯驾驶 ${day.plan.driving.pureHours} 小时`, day.plan.driving.plannedHours !== undefined && `计划 ${day.plan.driving.plannedHours} 小时`, day.plan.driving.toll !== undefined && `过路费约 ${day.plan.driving.toll} 元`, day.plan.driving.latestDeparture && `最晚 ${day.plan.driving.latestDeparture} 出发`].filter(Boolean).join(' · ')}</p>{day.plan.driving.breakStops?.map((item, index) => <p key={`${item.name}-${index}`}>休息：{item.name}{item.durationMinutes ? `（${item.durationMinutes} 分钟）` : ''}</p>)}</section>}
        {day.plan?.accommodation && [day.plan.accommodation.summary, day.plan.accommodation.city, day.plan.accommodation.area, day.plan.accommodation.parking, day.plan.accommodation.breakfast, day.plan.accommodation.phone].some(Boolean) && <section className="info-card"><Hotel /><h2>住宿</h2>{day.plan.accommodation.summary && <p>{day.plan.accommodation.summary}</p>}<p>{[day.plan.accommodation.city, day.plan.accommodation.area, day.plan.accommodation.parking, day.plan.accommodation.breakfast].filter(Boolean).join(' · ')}</p>{day.plan.accommodation.phone && <p>电话：{day.plan.accommodation.phone}</p>}</section>}
        {show('hotel') && !day.plan?.accommodation?.summary && (day.hotel.name || day.hotel.address) && <section className="info-card"><Hotel /><h2>住宿</h2><p>{displayValue(day.hotel.name)}</p>{show('hotelPhone') && day.hotel.phone && <p>电话：{day.hotel.phone}</p>}<p>{day.hotel.address}</p></section>}
        {show('meals') && (day.plan?.meals?.primary || day.meals) && <section className="info-card"><Utensils /><h2>用餐安排</h2><p>{day.plan?.meals?.primary || day.meals}</p>{day.plan?.meals?.backups?.length ? <p>备选：{day.plan.meals.backups.join('、')}</p> : null}{day.plan?.meals?.budgetPerPerson !== undefined && <p>人均预算：{day.plan.meals.budgetPerPerson} 元</p>}</section>}
        {day.plan?.weather && Object.values(day.plan.weather).some(Boolean) && <section className="info-card"><CloudSun /><h2>天气复查</h2>{day.plan.weather.summary && <p>{day.plan.weather.summary}</p>}{day.plan.weather.finalCheckAt && <p>最终复查：{day.plan.weather.finalCheckAt}</p>}{day.plan.weather.source && <a href={day.plan.weather.source} target="_blank" rel="noopener noreferrer">查看天气来源</a>}</section>}
        {day.plan?.risks && Object.values(day.plan.risks).some((value) => value !== undefined && value !== '' && (!Array.isArray(value) || value.length)) && <section className="info-card wide"><ShieldAlert /><h2>风险提醒与备用触发</h2>{[day.plan.risks.weather, day.plan.risks.traffic, day.plan.risks.reservation, day.plan.risks.physical, day.plan.risks.mainDelayPoint].filter(Boolean).map((value) => <p key={value}>{value}</p>)}{day.plan.risks.backupTriggers?.length ? <ul>{day.plan.risks.backupTriggers.map((value) => <li key={value}>{value}</li>)}</ul> : null}</section>}
        {show('reminders') && <section className="info-card wide"><ShieldAlert /><h2>当日提醒</h2><p>{displayValue(day.reminders)}</p></section>}
        {show('backup') && <section className="info-card wide"><h2>备用方案</h2><p>{displayValue(day.backupPlan)}</p></section>}
      </div><p className="updated-line">最近更新：{new Date(trip.updatedAt).toLocaleString('zh-CN')}</p>
    </div>
  </main>
}
