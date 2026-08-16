import { useTrip } from '../app/trip-context'
import { PublicTrip } from '../components/PublicTrip'
import { StatePanel } from '../components/StatePanel'

export function HomePage({ preview = false }: { preview?: boolean }) {
  const { trip, loading, error, retry, cachedAt } = useTrip()
  if (loading) return <main className="state-panel"><p>正在载入行程…</p></main>
  if (error && !cachedAt) return <StatePanel title="行程暂时无法读取" message={error} action={() => void retry()} />
  return <>{cachedAt && <aside className="offline-banner">{error} 缓存时间：{new Date(cachedAt).toLocaleString('zh-CN')}</aside>}<PublicTrip trip={trip} preview={preview} /></>
}
