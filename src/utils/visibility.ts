import type { TripDay, TripStop, Visibility } from '../types/trip'

/** 解析局部设置；缺失或 inherit 时回退到全局设置，最终安全默认隐藏。 */
export function resolveVisibility(local: Visibility | undefined, global: Visibility | undefined, fallback: Visibility = 'hidden'): Visibility {
  if (local === 'hidden' || global === 'hidden') return 'hidden'
  if (local && local !== 'inherit') return local
  if (global && global !== 'inherit') return global
  return fallback === 'public' || fallback === 'admin' ? fallback : 'hidden'
}

/** 管理端永远可见；普通端只有解析结果为 public 时可见。 */
export function isVisible(local: Visibility | undefined, global: Visibility | undefined, isAdmin = false): boolean {
  return isAdmin || resolveVisibility(local, global) === 'public'
}

/** 返回给指定视图的地点，保证 admin/hidden 不会泄漏至普通查看端。 */
export function getVisibleStops(stops: TripStop[], scope: 'route' | 'detail' | 'admin'): TripStop[] {
  if (scope === 'admin') return stops
  if (scope === 'route') return stops.filter((stop) => stop.visibility === 'route')
  return stops.filter((stop) => stop.visibility === 'route' || stop.visibility === 'detail')
}

export function dayFieldVisible(day: TripDay, section: 'card' | 'detail', field: string, global: Record<string, Visibility>): boolean {
  const local = day.displayOverrides[section]?.[field as never]
  return isVisible(local, global[field])
}
