export const formatDate = (value: string) => value
  ? new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short', timeZone: 'Asia/Shanghai' }).format(new Date(`${value}T00:00:00+08:00`))
  : '待定'

export const formatDateRange = (start: string, end: string) => `${formatDate(start).replace(/周.$/, '')}—${formatDate(end).replace(/周.$/, '')}`
export const displayValue = (value: string) => value.trim() || '待定'
export const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export function tripProgress(start: string, end: string, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startTime = new Date(`${start}T00:00:00`).getTime()
  const endTime = new Date(`${end}T23:59:59`).getTime()
  if (today < startTime) return { label: `距出发 ${Math.ceil((startTime - today) / 86400000)} 天`, currentDay: 0 }
  if (today > endTime) return { label: '旅程已结束', currentDay: 99 }
  const currentDay = Math.floor((today - startTime) / 86400000) + 1
  return { label: `今天是 Day ${currentDay}`, currentDay }
}
