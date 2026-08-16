import { describe, expect, it } from 'vitest'
import { DEFAULT_APP_CONFIG, resolveAppConfig } from './appConfig'

describe('AppConfig', () => {
  it('defaults to a self-contained Local Demo', () => {
    expect(DEFAULT_APP_CONFIG.app).toMatchObject({ name: 'GreenNote Travel', shortName: 'GreenNote', description: '可复用的自托管旅行计划与行程导览工具' })
    expect(DEFAULT_APP_CONFIG.features).toEqual({ admin: true, cloud: false, weather: true, pwa: true })
    expect(DEFAULT_APP_CONFIG.storage.namespace).toBe('greennote.travel.demo')
    expect(DEFAULT_APP_CONFIG.weather.provider).toBe('mock')
  })
  it('accepts explicit feature overrides through the config service', () => {
    const config = resolveAppConfig({ VITE_FEATURE_CLOUD: 'true', VITE_FEATURE_WEATHER: 'false' })
    expect(config.features.cloud).toBe(true)
    expect(config.weather.enabled).toBe(false)
  })
})
