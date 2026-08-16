import { createContext, useContext } from 'react'
import type { AppConfig } from '../config/appConfig'

export const AppConfigContext = createContext<AppConfig | null>(null)
export function useAppConfig() {
  const value = useContext(AppConfigContext)
  if (!value) throw new Error('useAppConfig 必须在 AppConfigProvider 中使用')
  return value
}
