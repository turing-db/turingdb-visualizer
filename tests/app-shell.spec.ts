import { test, expect } from '@playwright/test'
import { mockApi, setupLoadedGraph } from './helpers'

test.describe('App shell', () => {
  test('renders sidebar with logo', async ({ page }) => {
    await mockApi(page)
    await page.goto('/')

    await expect(page.locator('[aria-label="turing-logo"]')).toBeVisible()
    // Sidebar has a graph icon button
    await expect(page.locator('[data-icon="graph"]')).toBeVisible()
  })

  test('shows top bar with graph selector', async ({ page }) => {
    await mockApi(page)
    await page.goto('/')

    await expect(page.getByText('Viewing:')).toBeVisible()
    await expect(page.getByText('No graph selected')).toBeVisible()
  })

  test('shows "Select a database" when no graph is chosen', async ({ page }) => {
    await mockApi(page)
    await page.goto('/')

    await expect(page.getByText('Select a database to start')).toBeVisible()
  })

  test('graph selector populates from API', async ({ page }) => {
    await mockApi(page, { graphs: ['alpha', 'beta', 'gamma'] })
    await page.goto('/')

    // Open the graph selector — use role to avoid ambiguity with "No graph selected"
    await page.getByRole('button', { name: 'Graph' }).click()

    await expect(page.getByText('alpha')).toBeVisible()
    await expect(page.getByText('beta')).toBeVisible()
    await expect(page.getByText('gamma')).toBeVisible()
  })
})
