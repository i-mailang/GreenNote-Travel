import type { AdminSession } from '../types/dto'
import { AppError, toAppError } from '../services/appError'
import { callCloudFunction, dataMode, getCloudbaseApp } from './cloudbase'

export interface AuthService {
  restore(): Promise<AdminSession | null>
  signIn(email: string, password: string): Promise<AdminSession>
  signOut(): Promise<void>
}

export class CloudBaseAuthService implements AuthService {
  async restore(): Promise<AdminSession | null> {
    if (dataMode === 'local') return { uid: 'local-developer', displayName: '本地开发者', loginType: 'LOCAL', isAdmin: true }
    try {
      const state = await (await getCloudbaseApp()).auth().getLoginState()
      if (!state || state.user?.loginType === 'ANONYMOUS') return null
      return await callCloudFunction<AdminSession>('getAdminTrip', { authOnly: true })
    } catch (reason) {
      const error = toAppError(reason)
      if (error.code === 'SESSION_EXPIRED' || error.code === 'UNAUTHORIZED') return null
      throw error
    }
  }

  async signIn(email: string, password: string): Promise<AdminSession> {
    if (dataMode === 'local') return { uid: 'local-developer', displayName: email || '本地开发者', loginType: 'LOCAL', isAdmin: true }
    if (!email || !password) throw new AppError('UNAUTHORIZED', '请输入邮箱和密码。')
    try {
      await (await getCloudbaseApp()).auth().signIn({ username: email, password })
      return await callCloudFunction<AdminSession>('getAdminTrip', { authOnly: true })
    } catch (reason) { throw toAppError(reason) }
  }

  async signOut(): Promise<void> {
    if (dataMode === 'cloud') await (await getCloudbaseApp()).auth().signOut()
  }
}
