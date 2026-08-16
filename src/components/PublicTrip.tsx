import { CalendarDays, CarFront, ChevronRight, Clock3, Compass, Megaphone, Route, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Trip } from '../types/trip'
import { formatDate, formatDateRange, tripProgress } from '../utils/format'
import { isVisible } from '../utils/visibility'
import { DayCard } from './DayCard'
import { RouteOverview } from './RouteOverview'
import { useAppConfig } from '../app/app-config-context'

export function PublicTrip({ trip, preview = false }: { trip: Trip; preview?: boolean }) {
  const config = useAppConfig()
  const progress = tripProgress(trip.startDate, trip.endDate)
  const show = (field: keyof Trip['displaySettings']['home']) => isVisible(undefined, trip.displaySettings.home[field])
  const today = trip.days.find((day) => day.order === progress.currentDay) ?? trip.days[0]
  return <>
    {preview && <div className="preview-bar"><span>未发布草稿预览</span><Link to="/admin">返回管理页</Link></div>}
    <main>
      <section className="hero">
        <div className="hero-art" aria-hidden="true"><span className="sun" /><span className="ridge ridge-back" /><span className="ridge ridge-front" /><span className="road" /></div>
        <div className="hero-content"><p className="eyebrow"><Compass size={17} />{config.app.name} · Local Demo</p><h1>{trip.title}</h1>{show('subtitle') && <p className="hero-subtitle">{trip.subtitle}</p>}
          <div className="hero-facts">
            {show('dateRange') && <span><CalendarDays size={18} />{formatDateRange(trip.startDate, trip.endDate)}</span>}
            {show('participants') && <span><UsersRound size={18} />{trip.participantCount} 人</span>}
            {show('vehicle') && <span><CarFront size={18} />{trip.vehicle}</span>}
          </div>
          <div className="hero-status">{show('countdown') && <strong>{progress.label}</strong>}{show('status') && <span>{trip.status}</span>}</div>
        </div>
      </section>

      <div className="page-shell">
        {show('notice') && trip.globalNotice && <aside className="notice"><Megaphone size={21} /><div><strong>行前公告</strong><p>{trip.globalNotice}</p></div></aside>}
        {today && <section className="today-entry"><div><p className="eyebrow">今日行程入口</p><h2>Day {today.order} · {today.title}</h2><p>{formatDate(today.date)} · {today.origin} → {today.destination}</p></div><Link to={`${preview ? '/preview' : ''}/day/${today.id}`} aria-label="查看今日行程"><ChevronRight size={22} /></Link></section>}
        {show('route') && <section className="section-block"><div className="section-heading"><div><p className="eyebrow"><Route size={17} />数据驱动路线</p><h2>总路线概览</h2></div><p>节点由当前 Trip 数据动态生成</p></div><RouteOverview trip={trip} currentDay={progress.currentDay} /></section>}
        {show('dayCards') && <section className="section-block"><div className="section-heading"><div><p className="eyebrow"><CalendarDays size={17} />{trip.days.length} Days</p><h2>全部行程</h2></div></div><div className="day-grid">{[...trip.days].sort((a, b) => a.order - b.order).map((day) => <DayCard key={day.id} day={day} global={trip.displaySettings.card} isToday={day.order === progress.currentDay} linkPrefix={preview ? '/preview' : ''} />)}</div></section>}
        <footer className="site-footer">{show('updatedAt') && <p><Clock3 size={15} />最近更新：{new Date(trip.updatedAt).toLocaleString('zh-CN')}</p>}{show('credit') && <p>{trip.credit}</p>}</footer>
      </div>
    </main>
  </>
}
