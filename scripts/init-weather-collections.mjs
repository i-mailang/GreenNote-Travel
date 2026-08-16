import cloudbase from '@cloudbase/node-sdk'

const confirmed = process.argv.includes('--confirm-weather-collections')
const env = process.env.CLOUDBASE_ENV_ID?.trim()
if (!confirmed) {
  console.log('Dry run only: would create trip_weather and trip_weather_runtime. Pass --confirm-weather-collections only during the approved deployment stage.')
  process.exit(0)
}
if (!env) throw new Error('CLOUDBASE_ENV_ID is required; do not place credentials in this script.')
const app = cloudbase.init({ env }); const db = app.database()
for (const name of ['trip_weather', 'trip_weather_runtime']) {
  try { await db.createCollection(name); console.log(`Created ${name}`) }
  catch (error) { console.log(`${name}: ${error instanceof Error ? error.message : 'already exists or cannot be created'}`) }
}
