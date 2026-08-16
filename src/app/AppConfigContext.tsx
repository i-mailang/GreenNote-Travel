import type { ReactNode } from 'react'
import { appConfig } from '../config/appConfig'
import { AppConfigContext } from './app-config-context'

export function AppConfigProvider({ children }: { children: ReactNode }) {
  return <AppConfigContext.Provider value={appConfig}>{children}</AppConfigContext.Provider>
}
