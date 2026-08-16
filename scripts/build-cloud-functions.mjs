import { build } from 'esbuild'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const names = ['getPublicTrip', 'getAdminTrip', 'initializeTrip', 'saveAdminTrip', 'publishTrip', 'listTripBackups', 'restoreTripBackup', 'getPublicWeather', 'refreshTripWeather']
const root = resolve('.cloudbase/functions')
await rm(root, { recursive: true, force: true })
for (const name of names) {
  const out = resolve(root, name)
  await mkdir(out, { recursive: true })
  await build({ entryPoints: [`cloudbase/functions-src/${name}.ts`], outfile: resolve(out, 'index.js'), bundle: true, platform: 'node', target: 'node18', format: 'cjs', external: ['@cloudbase/node-sdk'] })
  await writeFile(resolve(out, 'package.json'), `${JSON.stringify({ name, version: '1.0.0', main: 'index.js', dependencies: { '@cloudbase/node-sdk': '3.18.3' } }, null, 2)}\n`)
}
console.log(`Prepared ${names.length} CloudBase functions in ${root}`)
