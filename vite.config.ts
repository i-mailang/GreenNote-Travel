import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { APP_CONFIG_DEFAULTS } from './src/config/appConfigDefaults.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const base = env.VITE_APP_BASE_PATH || '/'
  return {
    base,
    build: {
      target: 'es2020',
      cssTarget: 'chrome61',
    },
    plugins: [react(), VitePWA({
      registerType: 'prompt',
      includeAssets: ['app-icon.svg'],
      manifest: {
        name: APP_CONFIG_DEFAULTS.app.name, short_name: APP_CONFIG_DEFAULTS.app.shortName, description: APP_CONFIG_DEFAULTS.app.description,
        theme_color: APP_CONFIG_DEFAULTS.theme.themeColor, background_color: APP_CONFIG_DEFAULTS.theme.backgroundColor, display: 'standalone', start_url: base, scope: base,
        icons: [{ src: `${base}app-icon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp}'],
        globIgnores: ['**/index.esm-*.js'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [{
          urlPattern: /\/demo\/.*\.svg(?:\?.*)?$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'greennote-travel-demo-assets-v1',
            cacheableResponse: { statuses: [0, 200] },
            expiration: { maxEntries: 40, maxAgeSeconds: 30 * 24 * 60 * 60 },
          },
        }],
      },
      devOptions: { enabled: true },
    })],
  }
})
