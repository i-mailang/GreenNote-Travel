import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppConfigContext } from '../app/app-config-context'
import { DEFAULT_APP_CONFIG } from '../config/appConfig'
import { demoTrip } from '../data/demoTrip'
import { DayCard } from './DayCard'

describe('weather feature flag', () => {
  it('renders a Day card without constructing a Weather context when disabled', () => {
    const config = { ...DEFAULT_APP_CONFIG, features: { ...DEFAULT_APP_CONFIG.features, weather: false }, weather: { ...DEFAULT_APP_CONFIG.weather, enabled: false } }
    const html = renderToStaticMarkup(<AppConfigContext.Provider value={config}><MemoryRouter><DayCard day={demoTrip.days[0]} global={demoTrip.displaySettings.card} isToday={false} /></MemoryRouter></AppConfigContext.Provider>)
    expect(html).not.toContain('day-weather-summary')
    expect(html).toContain('海湾步道')
  })
})
