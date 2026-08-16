import { spawnSync } from 'node:child_process'
import { copyFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const envId = process.env.CLOUDBASE_ENV_ID?.trim()
if (!envId) throw new Error('Cloud build blocked: set CLOUDBASE_ENV_ID explicitly. No default environment is provided.')
const env = { ...process.env, VITE_FEATURE_CLOUD: 'true', VITE_CLOUDBASE_ENV_ID: envId, VITE_CLOUDBASE_REGION: process.env.CLOUDBASE_REGION?.trim() || 'ap-shanghai', VITE_APP_BASE_PATH: process.env.VITE_APP_BASE_PATH?.trim() || '/' }
for (const [entry, ...args] of [[resolve('node_modules/typescript/bin/tsc'), '-b'], [resolve('node_modules/vite/bin/vite.js'), 'build']]) {
  const result = spawnSync(process.execPath, [entry, ...args], { stdio: 'inherit', env })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
await copyFile('dist/index.html', 'dist/404.html')
await writeFile('dist/build-mode.json', `${JSON.stringify({ mode: 'cloud', envId }, null, 2)}\n`, 'utf8')
console.log('Prepared an explicitly targeted cloud-mode dist with SPA fallback.')
