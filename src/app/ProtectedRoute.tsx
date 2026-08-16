import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { CloudBaseAuthService } from '../infra/auth'
import type { AdminSession } from '../types/dto'

const auth = new CloudBaseAuthService()
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null | undefined>(undefined)
  const location = useLocation()
  useEffect(() => { let active = true; auth.restore().then((value) => { if (active) setSession(value) }).catch(() => { if (active) setSession(null) }); return () => { active = false } }, [])
  if (session === undefined) return <main className="state-panel"><p>正在核验管理员身份…</p></main>
  if (!session?.isAdmin) return <Navigate replace to="/login" state={{ from: location.pathname }} />
  return children
}
