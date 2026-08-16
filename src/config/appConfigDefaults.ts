export const APP_CONFIG_DEFAULTS = {
  app: { name: 'GreenNote Travel', shortName: 'GreenNote', description: '可复用的自托管旅行计划与行程导览工具', locale: 'zh-CN', timeZone: 'Asia/Shanghai' },
  theme: { themeColor: '#173f3a', backgroundColor: '#f3eee3' },
  features: { admin: true, cloud: false, weather: true, pwa: true },
  storage: { namespace: 'greennote.travel.demo' },
  weather: { enabled: true, provider: 'mock', leadDays: 5, refreshTimes: { preTrip: ['06:00', '11:00', '17:00', '22:00'], inTrip: ['05:30', '09:00', '12:00', '15:00', '19:00', '22:30'] } },
  deployment: { supportsStaticHosting: true, supportsCloudFunctions: true, supportsCloudDatabase: true },
} as const
