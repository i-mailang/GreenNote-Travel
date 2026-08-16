import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('weather CloudBase security configuration', () => {
  it('allows public weather only through its anonymous-capable function', () => {
    const rules = JSON.parse(read('cloudbase/function.rules.json'))
    expect(rules.getPublicWeather.invoke).toBe(true)
    expect(rules.refreshTripWeather.invoke).toContain("auth.loginType != 'ANONYMOUS'")
  })

  it('denies direct client access to both fixed weather documents', () => {
    const rules = JSON.parse(read('cloudbase/database.rules.json'))
    expect(rules.trip_weather).toEqual({ read: false, write: false })
    expect(rules.trip_weather_runtime).toEqual({ read: false, write: false })
  })

  it('delegates every non-timer refresh to the existing admin whitelist guard', () => {
    const source = read('cloudbase/functions-src/weatherCore.ts')
    expect(source).toContain("if (invocation === 'admin') await requireAdmin()")
    expect(source).toContain("if (invocation === 'reject')")
    expect(source).toContain("event.manual !== true")
    expect(source).not.toContain('{ ...runtime,')
    expect(source).toContain('lastRunSummary: db.command.set(runSummary)')
    expect(source).not.toMatch(/trip_admin|trip_public/)
  })
})
