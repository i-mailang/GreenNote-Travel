import { useRegisterSW } from 'virtual:pwa-register/react'

export function ReloadPrompt() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW()
  if (!needRefresh) return null
  return <aside className="update-prompt" role="status"><span>旅行导览已有新版本。</span><button className="primary-button" onClick={() => void updateServiceWorker(true)}>立即更新</button><button className="secondary-button" onClick={() => setNeedRefresh(false)}>稍后</button></aside>
}
