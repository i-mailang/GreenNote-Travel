import { readFile } from 'node:fs/promises'

const expectedEnvId = process.env.CLOUDBASE_ENV_ID?.trim()
if (!expectedEnvId) throw new Error('Cloud verification blocked: set CLOUDBASE_ENV_ID explicitly.')
const read = (path) => readFile(path, 'utf8')
let marker
try { marker = JSON.parse(await read('dist/build-mode.json')) } catch { throw new Error('Cloud verification blocked: dist/build-mode.json is missing or invalid.') }
if (marker.mode !== 'cloud' || marker.envId !== expectedEnvId) throw new Error('Cloud verification blocked: the build target does not match CLOUDBASE_ENV_ID.')
const [indexHtml, fallbackHtml] = await Promise.all([read('dist/index.html'), read('dist/404.html')])
if (indexHtml !== fallbackHtml) throw new Error('Cloud verification blocked: SPA fallback does not match dist/index.html.')
console.log('Verified explicitly targeted cloud-mode dist.')
