export type AppErrorCode = 'NOT_CONFIGURED' | 'NETWORK' | 'OFFLINE' | 'NO_PUBLIC_TRIP' | 'UNAUTHORIZED' | 'SESSION_EXPIRED' | 'CONFLICT' | 'SCHEMA' | 'UNKNOWN'

const messages: Record<AppErrorCode, string> = {
  NOT_CONFIGURED: '云端模式尚未配置环境 ID，请先完成 CloudBase 初始化。',
  NETWORK: '暂时无法连接云端，请检查网络后重试。',
  OFFLINE: '当前处于离线状态。',
  NO_PUBLIC_TRIP: '旅行计划尚未发布，请稍后再来。',
  UNAUTHORIZED: '当前账号没有旅行计划管理权限。',
  SESSION_EXPIRED: '登录状态已过期，请重新登录。',
  CONFLICT: '云端草稿已被更新，请先处理版本冲突。',
  SCHEMA: '云端旅行数据格式不受当前版本支持。',
  UNKNOWN: '操作未完成，请稍后重试。',
}

export class AppError extends Error {
  constructor(public readonly code: AppErrorCode, message = messages[code], public readonly details?: unknown) {
    super(message)
    this.name = 'AppError'
  }
}

export function toAppError(reason: unknown): AppError {
  if (reason instanceof AppError) return reason
  const value = reason as { code?: string; message?: string }
  const text = `${value?.code ?? ''} ${value?.message ?? ''}`.toLowerCase()
  if (text.includes('conflict')) return new AppError('CONFLICT')
  if (text.includes('unauthorized') || text.includes('permission')) return new AppError('UNAUTHORIZED')
  if (text.includes('session') || text.includes('credential')) return new AppError('SESSION_EXPIRED')
  if (text.includes('no_public_trip') || text.includes('not published')) return new AppError('NO_PUBLIC_TRIP')
  if (text.includes('schema') || text.includes('field_type') || text.includes('version_too_new')) return new AppError('SCHEMA')
  if (text.includes('network') || text.includes('timeout') || (typeof navigator !== 'undefined' && !navigator.onLine)) return new AppError('NETWORK')
  if (import.meta.env.DEV) console.error('CloudBase operation failed', reason)
  return new AppError('UNKNOWN')
}
