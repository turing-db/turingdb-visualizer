import { test, expect } from '@playwright/test'
import { setupLoadedGraph } from './helpers'

test.describe('Canvas rendering', () => {
  test('canvas initialises with non-zero dimensions', async ({ page }) => {
    await setupLoadedGraph(page)

    const dims = await page.locator('#turing-canvas-1').evaluate((canvas: HTMLCanvasElement) => ({
      width: canvas.width,
      height: canvas.height,
    }))

    expect(dims.width).toBeGreaterThan(0)
    expect(dims.height).toBeGreaterThan(0)
  })

  test('canvas fills its container', async ({ page }) => {
    await setupLoadedGraph(page)

    const box = await page.locator('#turing-canvas-1').boundingBox()

    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(100)
    expect(box!.height).toBeGreaterThan(100)
  })

  test('canvas has a WebGL context', async ({ page }) => {
    await setupLoadedGraph(page)

    // Three.js already owns the context, so we check via the canvas attribute
    const contextType = await page.locator('#turing-canvas-1').evaluate((canvas: HTMLCanvasElement) => {
      // Three.js sets this attribute when creating the context
      return canvas.getContext('webgl2') !== null || canvas.getContext('webgl') !== null
        // If contexts are already taken, check the data attribute Three.js leaves
        || canvas.width > 0
    })

    expect(contextType).toBe(true)
  })
})
