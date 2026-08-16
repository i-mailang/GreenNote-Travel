import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { AppConfigProvider } from './app/AppConfigContext'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(<StrictMode><AppConfigProvider><App /></AppConfigProvider></StrictMode>)
