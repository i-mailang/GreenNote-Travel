import { BookOpen, Settings } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useAppConfig } from '../app/app-config-context'
import { APP_RELEASE_LABEL } from '../data/release'

export function AppHeader() {
  const config = useAppConfig()
  return <header className="app-header">
    <Link to="/" className="brand" aria-label={`${config.app.name} 首页`}><span className="brand-mark"><BookOpen size={20} /></span><span>{config.app.name}</span><small className="release-badge">{APP_RELEASE_LABEL} · Demo</small></Link>
    <nav aria-label="主导航">
      <NavLink to="/" end>行程</NavLink>
      {config.features.admin && <NavLink to="/admin"><Settings size={17} />管理</NavLink>}
    </nav>
  </header>
}
