/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_FEATURE_CLOUD?: 'true' | 'false'
  readonly VITE_FEATURE_WEATHER?: 'true' | 'false'
  readonly VITE_WEATHER_PROVIDER?: 'mock' | 'baidu'
  readonly VITE_CLOUDBASE_ENV_ID?: string
  readonly VITE_CLOUDBASE_REGION?: string
  readonly VITE_APP_BASE_PATH?: string
}
