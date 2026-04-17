import { test } from '@playwright/test'

const RAILWAY_URL = 'https://turingdb-shipping-production.up.railway.app/'
const LOCAL_GRAPH = 'shipping'
const QUERY =
  "MATCH (n) WHERE n.name = 'Port Authority of Long Beach' OR n.name = 'Port Authority of Rotterdam' OR n.name = 'Port Authority of Istanbul' OR n.name = 'Port Authority of Colombo' RETURN n"

test.describe.configure({ mode: 'serial' })

test('capture railway reference screenshot', async ({ page }) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(RAILWAY_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  await page.screenshot({ path: '/tmp/railway-d3.png', fullPage: false })

  // Also take a zoomed-in screenshot for detail comparison.
  const box = await page.locator('svg, canvas').first().boundingBox()
  if (box) {
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2
    for (let i = 0; i < 12; i++) {
      await page.mouse.move(cx, cy)
      await page.mouse.wheel(0, -250)
      await page.waitForTimeout(80)
    }
    await page.waitForTimeout(500)
    await page.screenshot({ path: '/tmp/railway-d3-zoom.png', fullPage: false })
  }
})

test('capture local rounded-rect screenshot', async ({ page }) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 2000, height: 1200 })
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' })

  // Select the shipping graph
  await page.getByRole('button', { name: 'Graph' }).click()
  await page.getByText(LOCAL_GRAPH).click()

  // Wait for canvas
  await page.locator('#turing-canvas-1').waitFor({ timeout: 15_000 })
  await page.waitForTimeout(1000)

  // Execute a query
  const input = page.getByPlaceholder('Cypher query (Ctrl+Enter to execute)')
  await input.click()
  await input.fill(QUERY)
  await input.press('Control+Enter')

  // Give simulation time to settle
  await page.waitForTimeout(4000)

  await page.getByText('Shape', { exact: true }).click()

  // Let layout reflow + labels measure
  await page.waitForTimeout(3000)

  // Zoom in to see node details (scroll down to zoom in on orbit controls)
  const canvas = page.locator('#turing-canvas-1')
  const box = await canvas.boundingBox()
  if (box) {
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2
    // Zoom out slightly so wide pills are not clipped by the viewport edges.
    for (let i = 0; i < 2; i++) {
      await page.mouse.move(cx, cy)
      await page.mouse.wheel(0, 300)
      await page.waitForTimeout(80)
    }
  }
  await page.waitForTimeout(500)

  await page.screenshot({ path: '/tmp/local-rounded-rect.png', fullPage: false })
})
