import { beforeEach, describe, expect, it, vi } from 'vitest'

const sdk = vi.hoisted(() => {
  const getLoginState = vi.fn()
  const signInAnonymously = vi.fn()
  const callFunction = vi.fn()
  const app = { auth: () => ({ getLoginState, signInAnonymously }), callFunction }
  return { getLoginState, signInAnonymously, callFunction, app, init: vi.fn(() => app) }
})

vi.mock('@cloudbase/js-sdk', () => ({ default: { init: sdk.init } }))
vi.mock('../config/appConfig', () => ({ appConfig: { features: { cloud: true } } }))

async function loadCallCloudFunction() {
  vi.resetModules()
  vi.stubEnv('VITE_CLOUDBASE_ENV_ID', 'env-test')
  return (await import('./cloudbase')).callCloudFunction
}

describe('callCloudFunction public authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sdk.getLoginState.mockResolvedValue(null)
    sdk.signInAnonymously.mockResolvedValue({ data: {}, error: null })
    sdk.callFunction.mockResolvedValue({ result: { ok: true, data: { sourceRevision: 1 } } })
  })

  it('creates an anonymous session before reading the public trip', async () => {
    const callCloudFunction = await loadCallCloudFunction()
    await expect(callCloudFunction('getPublicTrip')).resolves.toEqual({ sourceRevision: 1 })
    expect(sdk.signInAnonymously).toHaveBeenCalledOnce()
    expect(sdk.callFunction).toHaveBeenCalledWith({ name: 'getPublicTrip', data: {} })
  })

  it('creates an anonymous session before reading public weather', async () => {
    const callCloudFunction = await loadCallCloudFunction()
    await callCloudFunction('getPublicWeather')
    expect(sdk.signInAnonymously).toHaveBeenCalledOnce()
    expect(sdk.callFunction).toHaveBeenCalledWith({ name: 'getPublicWeather', data: {} })
  })

  it('reuses an existing login state', async () => {
    sdk.getLoginState.mockResolvedValue({ user: { uid: 'existing' } })
    const callCloudFunction = await loadCallCloudFunction()
    await callCloudFunction('getPublicTrip')
    expect(sdk.signInAnonymously).not.toHaveBeenCalled()
  })

  it('never creates an anonymous session for an admin function', async () => {
    const callCloudFunction = await loadCallCloudFunction()
    await callCloudFunction('getAdminTrip')
    expect(sdk.getLoginState).not.toHaveBeenCalled()
    expect(sdk.signInAnonymously).not.toHaveBeenCalled()
  })

  it('does not call the function when anonymous sign-in fails', async () => {
    const failure = { error: 'provider_disabled', error_description: 'anonymous sign-in is disabled' }
    sdk.signInAnonymously.mockResolvedValue({ data: null, error: failure })
    const callCloudFunction = await loadCallCloudFunction()
    await expect(callCloudFunction('getPublicTrip')).rejects.toBe(failure)
    expect(sdk.callFunction).not.toHaveBeenCalled()
  })
})
