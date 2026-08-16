import { ArrowLeft, MapPin } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useTrip } from '../app/trip-context'
import { TripImage } from '../components/TripImage'

export function PlacePage() {
  const { stopId } = useParams()
  const location = useLocation()
  const preview = location.pathname.startsWith('/preview/')
  const { trip } = useTrip()
  const match = trip.days.flatMap((day) => day.stops.map((stop) => ({ day, stop }))).find(({ stop }) => stop.id === stopId)
  if (!match?.stop.guide) return <main className="state-panel"><h1>没有找到这份攻略</h1><p>地点可能已被调整，或暂时只有行程摘要。</p><Link className="primary-button" to="/">返回全部行程</Link></main>
  const { day, stop } = match
  const guide = stop.guide!
  const visual = stop.image
  return <main className="place-page">
    <header className="place-hero">{visual && <TripImage image={visual} className="place-hero-image" />}<div className="place-hero-content"><Link className="back-link" to={`${preview ? '/preview' : ''}/day/${day.id}`}><ArrowLeft size={18} />返回 Day {day.order}</Link><p className="eyebrow"><MapPin size={16} />Day {day.order} · {stop.duration}</p><h1>{guide.title}</h1><p>{guide.subtitle}</p></div></header>
    <div className="page-shell guide-shell"><section className="guide-overview"><p className="eyebrow">景点概览</p><p>{guide.overview}</p></section>
      {guide.sections.map((section, index) => <section className="guide-section" key={`${section.title}-${index}`}><div className="section-heading"><div><p className="eyebrow">攻略 {String(index + 1).padStart(2, '0')}</p><h2>{section.title}</h2>{section.subtitle && <p>{section.subtitle}</p>}</div></div>{section.paragraphs?.map((paragraph, p) => <p key={p}>{paragraph}</p>)}{section.table && <div className="guide-table-wrap"><table><thead><tr>{section.table.columns.map((column, columnIndex) => <th key={`${column}-${columnIndex}`}>{column}</th>)}</tr></thead><tbody>{section.table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell.split('\n').map((line, lineIndex) => <span key={lineIndex}>{line}</span>)}</td>)}</tr>)}</tbody></table></div>}</section>)}
    </div>
  </main>
}
