import type { PublicWeatherLocation, WeatherAlert, WeatherDaily, WeatherScene } from './weatherSchema'

const windLevel = (value?: string | null) => Number(value?.match(/\d+/)?.[0] ?? 0)
const alertRank = (level?: string | null) => ({ 红色: 4, 橙色: 3, 黄色: 2, 蓝色: 1 }[level ?? ''] ?? 0)

export function highestAlert(alerts: WeatherAlert[]): WeatherAlert | null {
  return [...alerts].sort((a, b) => alertRank(b.level) - alertRank(a.level))[0] ?? null
}

export function weatherAdvice(scene: WeatherScene, daily: WeatherDaily | undefined, location: PublicWeatherLocation, forecastAvailable = true): string[] {
  if (!forecastAvailable || !daily) return ['暂未进入可靠预报窗口']
  const text = `${daily.dayText ?? ''}${daily.nightText ?? ''}${location.current?.text ?? ''}`
  const wind = Math.max(windLevel(daily.dayWindScale), windLevel(daily.nightWindScale), windLevel(location.current?.windScale))
  const advice: string[] = []
  const alert = highestAlert(location.alerts)
  if (alert) advice.push(`${alert.level ?? ''}${alert.type ?? '气象'}预警：${alert.title}`)
  if (/雷暴|雷阵雨/.test(text)) advice.push('优先完成高处、索道或开阔区域项目，现场听从停运安排')
  if (wind >= 6 && ['mountain', 'grassland', 'volcano', 'desert'].includes(scene)) advice.push('重点关注大风')
  if ((daily.high ?? -Infinity) >= 35 && scene === 'desert') advice.push('高温，减少正午暴晒')
  if ((daily.low ?? Infinity) <= 12 && ['grassland', 'mountain'].includes(scene)) advice.push('携带防风保暖外套')
  if (text.includes('雨')) advice.push('携带雨衣，石阶和火山碎石路注意防滑')
  if (scene === 'return' && (/雨|雾/.test(text))) advice.push('返程雨雾需重点关注')
  return [...new Set(advice)].slice(0, 4)
}

export const RETURN_ROUTE_NOTICE = '返程沿途天气与高速状况仍需结合实时导航和天气应用复核。'
