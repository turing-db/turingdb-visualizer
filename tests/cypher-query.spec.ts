import { test, expect } from '@playwright/test'
import { setupLoadedGraph } from './helpers'

test.describe('Cypher query execution', () => {
  test('Ctrl+Enter executes the query', async ({ page }) => {
    let querySent = ''

    await setupLoadedGraph(page, {
      cypherHandler: async (route) => {
        querySent = await route.request().postData() ?? ''
        await route.fulfill({ json: { data: [[[1, 2]]] } })
      },
    })

    const input = page.getByPlaceholder('Cypher query (Ctrl+Enter to execute)')
    await input.fill('MATCH (n:Person) RETURN n')
    await input.press('Control+Enter')

    await expect.poll(() => querySent).toContain('MATCH (n:Person) RETURN n')
  })

  test('play button executes the query', async ({ page }) => {
    let queryCalled = false

    await setupLoadedGraph(page, {
      cypherHandler: async (route) => {
        queryCalled = true
        await route.fulfill({ json: { data: [[[1]]] } })
      },
    })

    const input = page.getByPlaceholder('Cypher query (Ctrl+Enter to execute)')
    await input.fill('MATCH (n) RETURN n LIMIT 5')

    await page.locator('[data-icon="play"]').click()

    await expect.poll(() => queryCalled).toBe(true)
  })

  test('query error is displayed and dismissible', async ({ page }) => {
    await setupLoadedGraph(page, {
      cypherHandler: async (route) => {
        await route.fulfill({
          json: {
            error: 'SyntaxError',
            error_details: 'Unexpected token at position 5',
          },
        })
      },
    })

    const input = page.getByPlaceholder('Cypher query (Ctrl+Enter to execute)')
    await input.fill('BAD QUERY')
    await input.press('Control+Enter')

    // Error card should appear
    await expect(page.getByText('SyntaxError')).toBeVisible()
    await expect(page.getByText('Unexpected token at position 5')).toBeVisible()

    // Dismiss the error
    await page.locator('[aria-label="Dismiss error"]').click()
    await expect(page.getByText('Unexpected token at position 5')).not.toBeVisible()
  })

  test('input is disabled while query is pending', async ({ page }) => {
    await setupLoadedGraph(page, {
      cypherHandler: async (route) => {
        // Delay response to keep pending state visible
        await new Promise((r) => setTimeout(r, 3000))
        await route.fulfill({ json: { data: [[[1]]] } })
      },
    })

    const input = page.getByPlaceholder('Cypher query (Ctrl+Enter to execute)')
    await input.fill('MATCH (n) RETURN n')
    await input.press('Control+Enter')

    await expect(input).toBeDisabled()
  })
})
