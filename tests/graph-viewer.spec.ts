import { test, expect } from '@playwright/test'
import { mockApi, setupLoadedGraph } from './helpers'

test.describe('Graph viewer', () => {
  test('selecting a graph transitions to the viewer page', async ({ page }) => {
    await mockApi(page, { graphs: ['test-graph'], loaded: true })
    await page.goto('/')

    // Select the graph via the dropdown
    await page.getByRole('button', { name: 'Graph' }).click()
    await page.getByText('test-graph').click()

    // The top bar should show the graph name and the canvas should appear
    await expect(page.locator('#turing-canvas-1')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('test-graph').first()).toBeVisible()
  })

  test('canvas element is present when graph is loaded', async ({ page }) => {
    await setupLoadedGraph(page)

    await expect(page.locator('#turing-canvas-1')).toBeVisible()
  })

  test('toolbar shows cypher query input with default query', async ({ page }) => {
    await setupLoadedGraph(page)

    const input = page.getByPlaceholder('Cypher query (Ctrl+Enter to execute)')
    await expect(input).toBeVisible()
    await expect(input).toHaveValue('MATCH (n) RETURN n LIMIT 100')
  })

  test('toolbar action buttons are visible', async ({ page }) => {
    await setupLoadedGraph(page)

    // Play (execute) and trash (clear) buttons via icon
    await expect(page.locator('[data-icon="play"]')).toBeVisible()
    await expect(page.locator('[data-icon="trash"]')).toBeVisible()
    // Select dropdown and Add node button
    await expect(page.getByRole('button', { name: 'Select' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add node' })).toBeVisible()
  })
})
