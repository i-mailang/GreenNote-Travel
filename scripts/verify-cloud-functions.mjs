import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const names = ['getPublicTrip', 'getAdminTrip', 'initializeTrip', 'saveAdminTrip', 'publishTrip', 'listTripBackups', 'restoreTripBackup', 'getPublicWeather', 'refreshTripWeather']
for (const name of names) {
  const entry = require(resolve(`.cloudbase/functions/${name}/index.js`))
  if (typeof entry.main !== 'function') throw new Error(`${name} bundle does not export main`)
}
console.log(`Verified ${names.length} CloudBase function entry points.`)
