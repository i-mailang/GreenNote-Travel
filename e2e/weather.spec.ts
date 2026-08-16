import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => { await page.goto('/'); await page.evaluate(() => localStorage.clear()); await page.reload() })

test('三日 Demo 从 TripWeatherConfig 动态显示 Mock Weather', async ({ page }) => {
  await expect(page.locator('.day-weather-summary')).toHaveCount(3)
  await expect(page.getByLabel('Day 1 天气快照')).toContainText('Demo · 青屿海湾')
  await page.goto('/day/demo-day-2')
  await expect(page.locator('.weather-location-card')).toHaveCount(1)
  await expect(page.getByText('Demo · 松风岭')).toBeVisible()
  await expect(page.getByText(/Mock Fixture/)).toBeVisible()
})

test('Mock 刷新不改变行程 revision', async ({ page }) => {
  await page.goto('/admin')
  const before = await page.locator('.revision-line').textContent()
  await page.getByRole('button', { name: '天气', exact: true }).click()
  await page.getByLabel('本地模拟状态').selectOption('partial')
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: '运行 Mock 刷新' }).click()
  await expect(page.getByText(/成功 2 · 过期 1/)).toBeVisible()
  await expect(page.locator('.revision-line')).toHaveText(before ?? '')
})

test('天气缓存使用模板命名空间并与行程缓存分离', async ({ page }) => {
  await page.waitForFunction(() => Boolean(localStorage.getItem('greennote.travel.demo.last-known-public-weather-v1')))
  const keys = await page.evaluate(() => [localStorage.getItem('greennote.travel.demo.last-known-public-weather-v1'), localStorage.getItem('greennote.travel.demo.last-known-public-trip')])
  expect(keys.every(Boolean)).toBe(true)
  expect(keys[0]).not.toBe(keys[1])
})
