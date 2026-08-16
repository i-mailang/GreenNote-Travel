import { AppError } from '../services/appError'
import type cloudbase from '@cloudbase/js-sdk'
import { appConfig } from '../config/appConfig'

export const dataMode = appConfig.features.cloud ? 'cloud' : 'local'
if (typeof document !== 'undefined') document.documentElement.dataset.dataMode = dataMode
export const cloudbaseEnvId = import.meta.env.VITE_CLOUDBASE_ENV_ID?.trim() ?? ''
export const cloudbaseRegion = import.meta.env.VITE_CLOUDBASE_REGION?.trim() || 'ap-shanghai'

type CloudbaseApp = ReturnType<typeof cloudbase.init>
let appPromise: Promise<CloudbaseApp> | null = null
let anonymousSignInPromise: Promise<void> | null = null
export async function getCloudbaseApp(): Promise<CloudbaseApp> {
  if (!appConfig.features.cloud || !cloudbaseEnvId) throw new AppError('NOT_CONFIGURED')
  if (!appPromise) appPromise = import('@cloudbase/js-sdk').then(({ default: cloudbase }) => cloudbase.init({ env: cloudbaseEnvId, region: cloudbaseRegion, persistence: 'local' }))
  return appPromise
}

async function ensurePublicSession(app: CloudbaseApp): Promise<void> {
  const auth = app.auth()
  if (await auth.getLoginState()) return
  if (!anonymousSignInPromise) {
    anonymousSignInPromise = auth.signInAnonymously().then(({ error }) => {
      if (error) throw error
    }).finally(() => { anonymousSignInPromise = null })
  }
  await anonymousSignInPromise
}

export async function callCloudFunction<T>(name: string, data: Record<string, unknown> = {}): Promise<T> {
  const app = await getCloudbaseApp()
  if (name === 'getPublicTrip' || name === 'getPublicWeather') await ensurePublicSession(app)
  const response = await app.callFunction({ name, data })
  const result = response.result as { ok?: boolean; data?: T; error?: { code?: string; message?: string } } | T
  if (result && typeof result === 'object' && 'ok' in result) {
    if (!result.ok) throw new AppError((result.error?.code as never) || 'UNKNOWN', result.error?.message)
    return result.data as T
  }
  return result as T
}
