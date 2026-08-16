import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { ReloadPrompt } from '../components/ReloadPrompt'
import { AdminPage } from '../pages/AdminPage'
import { DayPage } from '../pages/DayPage'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PlacePage } from '../pages/PlacePage'
import { ProtectedRoute } from './ProtectedRoute'
import { TripProvider } from './TripContext'
import { WeatherProvider } from './WeatherContext'
import { useAppConfig } from './app-config-context'
import type { ReactNode } from 'react'

const WeatherBoundary = ({ scope, children }: { scope: 'public' | 'admin'; children: ReactNode }) => {
  const config = useAppConfig()
  return config.features.weather ? <WeatherProvider scope={scope}>{children}</WeatherProvider> : children
}
const PublicHome = () => <TripProvider scope="public"><WeatherBoundary scope="public"><HomePage /></WeatherBoundary></TripProvider>
const PublicDay = () => <TripProvider scope="public"><WeatherBoundary scope="public"><DayPage /></WeatherBoundary></TripProvider>
const PublicPlace = () => <TripProvider scope="public"><WeatherBoundary scope="public"><PlacePage /></WeatherBoundary></TripProvider>
const Admin = () => <ProtectedRoute><TripProvider scope="admin"><WeatherBoundary scope="admin"><AdminPage /></WeatherBoundary></TripProvider></ProtectedRoute>
const Preview = () => <ProtectedRoute><TripProvider scope="admin"><WeatherBoundary scope="admin"><HomePage preview /></WeatherBoundary></TripProvider></ProtectedRoute>
const PreviewDay = () => <ProtectedRoute><TripProvider scope="admin"><WeatherBoundary scope="admin"><DayPage /></WeatherBoundary></TripProvider></ProtectedRoute>
const PreviewPlace = () => <ProtectedRoute><TripProvider scope="admin"><WeatherBoundary scope="admin"><PlacePage /></WeatherBoundary></TripProvider></ProtectedRoute>

function AppRoutes() {
  const config = useAppConfig()
  const location = useLocation()
  const showHeader = !['/admin', '/login'].includes(location.pathname) && !location.pathname.startsWith('/preview')
  return <>{showHeader && <AppHeader />}<Routes><Route path="/" element={<PublicHome />} /><Route path="/day/:dayId" element={<PublicDay />} /><Route path="/place/:stopId" element={<PublicPlace />} />{config.features.admin && <><Route path="/admin" element={<Admin />} /><Route path="/preview" element={<Preview />} /><Route path="/preview/day/:dayId" element={<PreviewDay />} /><Route path="/preview/place/:stopId" element={<PreviewPlace />} /><Route path="/login" element={<LoginPage />} /></>}<Route path="*" element={<NotFoundPage />} /></Routes>{config.features.pwa && <ReloadPrompt />}</>
}
export function App() { return <BrowserRouter><AppRoutes /></BrowserRouter> }
