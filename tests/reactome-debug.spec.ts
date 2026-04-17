import { test, expect } from '@playwright/test'

test('spinner stays visible continuously during 10k query', async ({ page }) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Graph' }).click()
  await page.getByText('reactome', { exact: true }).click()
  await page.locator('#turing-canvas-1').waitFor({ timeout: 15_000 })

  const input = page.getByPlaceholder('Cypher query (Ctrl+Enter to execute)')
  await input.click()
  await input.fill('MATCH (n) RETURN n LIMIT 10000')
  await input.press('Control+Enter')

  // Poll rapidly for spinner presence
  const samples: { t: number; spinner: boolean; nodes: number }[] = []
  const t0 = Date.now()
  let sawSpinner = false
  let seenNodes = 0

  // Sample for 15s — the reset→add flicker (if any) happens in the first
  // couple of seconds, long before the full 10k load finishes.
  for (let i = 0; i < 150; i++) {
    await page.waitForTimeout(100)
    const snap = await page.evaluate(() => {
      const spinner = !!document.querySelector('.bp5-spinner')
      const t = (
        window as unknown as {
          __turing?: { instance: { nodes: unknown[] } }
        }
      ).__turing
      return { spinner, nodes: t?.instance.nodes.length ?? 0 }
    })
    samples.push({ t: Date.now() - t0, spinner: snap.spinner, nodes: snap.nodes })
    if (snap.spinner) sawSpinner = true
    seenNodes = Math.max(seenNodes, snap.nodes)

    // Stop once spinner has turned off after showing — means one full cycle done
    if (sawSpinner && !snap.spinner && snap.nodes > 0) break
  }

  // Discard trailing idle samples after spinner turned off
  while (samples.length > 1 && !samples[samples.length - 1].spinner && !samples[samples.length - 2].spinner) {
    samples.pop()
  }

  // Find any "flicker": a sequence where spinner goes true → false → true while
  // still mid-loading (nodes still increasing).
  let flickers = 0
  for (let i = 1; i < samples.length - 1; i++) {
    if (samples[i - 1].spinner && !samples[i].spinner && samples[i + 1].spinner) {
      flickers++
      console.log(`FLICKER at t=${samples[i].t}ms`)
    }
  }

  console.log(`Samples: ${samples.length}, sawSpinner: ${sawSpinner}, finalNodes: ${seenNodes}, flickers: ${flickers}`)
  for (const s of samples.slice(0, 15))
    console.log(`  t=${s.t}ms spinner=${s.spinner} nodes=${s.nodes}`)

  expect(flickers).toBe(0)
  expect(sawSpinner).toBe(true)
  expect(seenNodes).toBeGreaterThan(0)
})
