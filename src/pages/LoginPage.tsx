import { useState, type FormEvent } from 'react'
import { LogIn } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CloudBaseAuthService } from '../infra/auth'
import { dataMode } from '../infra/cloudbase'

const auth = new CloudBaseAuthService()
export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate(); const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/admin'
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage('')
    try { await auth.signIn(email, password); navigate(from, { replace: true }) }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : '登录失败，请稍后重试。') }
    finally { setBusy(false); setPassword('') }
  }
  return <main className="login-page"><section className="login-card"><p className="eyebrow">受保护的内容工作台</p><h1>管理员登录</h1>
    {dataMode === 'local' ? <p className="security-note">当前为本地开发模式，可直接进入管理页；此行为不会代表线上权限。</p> : <p>使用已在 CloudBase 认证 v2 中创建、并加入管理员白名单的邮箱账号。</p>}
    <form onSubmit={(event) => void submit(event)}><label className="field"><span>邮箱</span><input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="field"><span>密码</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="primary-button" disabled={busy} type="submit"><LogIn size={17} />{busy ? '登录中…' : dataMode === 'local' ? '进入本地工作台' : '登录'}</button></form>
    <p className="live-message" aria-live="polite">{message}</p><Link to="/">返回公开行程</Link>
  </section></main>
}
