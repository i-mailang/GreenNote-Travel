import { AlertTriangle, RotateCcw } from 'lucide-react'

export function StatePanel({ title, message, action }: { title: string; message: string; action?: () => void }) {
  return <main className="state-panel"><AlertTriangle size={28} /><h1>{title}</h1><p>{message}</p>{action && <button className="primary-button" onClick={action}><RotateCcw size={18} />重新尝试</button>}</main>
}
