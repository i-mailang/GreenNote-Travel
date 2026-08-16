import { describe, expect, it } from 'vitest'
import { createMockWeatherSnapshot } from './weatherFixtures'
import { weatherAdvice } from './weatherRules'

const at = (scenario: Parameters<typeof createMockWeatherSnapshot>[0], id: string) => createMockWeatherSnapshot(scenario).locations.find((x) => x.locationId === id)!
describe('deterministic weather advice', () => {
  it('雷暴预警可被屏幕阅读器理解且包含行为建议', () => { const location = at('thunder-alert', 'demo-ridge'); const advice = weatherAdvice(location.scene, location.daily[0], location); expect(advice.join(' ')).toMatch(/预警/); expect(advice.join(' ')).toMatch(/高处|开阔区域/) })
  it('六级风在山地提示重点关注', () => { const location = at('wind', 'demo-ridge'); expect(weatherAdvice(location.scene, location.daily[0], location)).toContain('重点关注大风') })
  it('沙漠35度以上提示减少正午暴晒', () => { const location = at('ok', 'demo-coast'); expect(weatherAdvice('desert', { ...location.daily[0], high: 37 }, location)).toContain('高温，减少正午暴晒') })
  it('山地低温提示携带外套', () => { const location = at('ok', 'demo-ridge'); expect(weatherAdvice(location.scene, { ...location.daily[0], low: 8 }, location)).toContain('携带防风保暖外套') })
  it('未进入窗口不显示伪造天气', () => { const location = at('ok', 'demo-coast'); expect(weatherAdvice(location.scene, undefined, location, false)).toEqual(['暂未进入可靠预报窗口']) })
})
