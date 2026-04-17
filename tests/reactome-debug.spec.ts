import { test, expect } from '@playwright/test'

test('query field acts as search when input is not Cypher', async ({ page }) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Graph' }).click()
  await page.getByText('reactome', { exact: true }).click()
  await page.locator('#turing-canvas-1').waitFor({ timeout: 15_000 })

  const input = page.getByPlaceholder(/Cypher query|Search nodes/)

  // Cypher mode: default query has play icon
  await expect(page.locator('[data-icon="play"]')).toBeVisible()

  // Switch to search term
  await input.click()
  await input.fill('ADME')

  // Placeholder and icon should flip to search
  await expect(input).toHaveAttribute('placeholder', /Search nodes/)
  await expect(page.locator('[data-icon="search"]').first()).toBeVisible()

  // Fire the search via Ctrl+Enter
  await input.press('Control+Enter')
  await page.waitForTimeout(5_000)

  const stats = await page.evaluate(() => {
    const t = (
      window as unknown as { __turing?: { instance: { nodes: { id: number }[] } } }
    ).__turing
    return { nodes: t?.instance.nodes.length ?? 0 }
  })

  console.log('search result nodes:', stats.nodes)
  await page.screenshot({ path: '/tmp/search-adme.png' })
  expect(stats.nodes).toBeGreaterThan(0)
})
