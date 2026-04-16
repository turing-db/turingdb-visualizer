import { test, expect } from '@playwright/test'
import { setupLoadedGraph } from './helpers'

/**
 * Regression test for the bug where grabbing an unselected node would drag the
 * entire existing selection along with it. Grabbing an unselected node should
 * only drag that node; grabbing a selected node should drag the whole selection.
 */
test.describe('Node drag behavior', () => {
  test('grabbing an unselected node does not drag existing selection', async ({ page }) => {
    await setupLoadedGraph(page)
    await page.locator('#turing-canvas-1').waitFor()

    const result = await page.evaluate(() => {
      // biome-ignore lint: test-only window property
      const turing = (window as any).__turing
      const instance = turing.instance

      // Add three nodes with known positions directly to the instance, bypassing
      // the force simulation.
      instance.addNodes([
        { id: 1, primary: true },
        { id: 2, primary: true },
        { id: 3, primary: true },
      ])

      const [n1, n2, n3] = instance.nodes

      // Select n1 and n2; leave n3 unselected.
      instance.selectNode(n1)
      instance.selectNode(n2)

      // Simulate the user hovering n3 and mousing down on it.
      instance.events.hoveredNode = n3
      instance.canvas.dispatchEvent(
        new CustomEvent('canvasmousedown', {
          detail: { event: { button: 0, ctrlKey: false, metaKey: false, shiftKey: false } },
        }),
      )

      const draggedIds = instance.events.draggedNodes.map((n: { id: number }) => n.id)
      return { draggedIds, selectedCount: instance.selectedNodes.size }
    })

    expect(result.draggedIds).toEqual([3])
    expect(result.selectedCount).toBe(2)
  })

  test('grabbing a selected node drags the whole selection', async ({ page }) => {
    await setupLoadedGraph(page)
    await page.locator('#turing-canvas-1').waitFor()

    const result = await page.evaluate(() => {
      // biome-ignore lint: test-only window property
      const turing = (window as any).__turing
      const instance = turing.instance

      instance.addNodes([
        { id: 1, primary: true },
        { id: 2, primary: true },
        { id: 3, primary: true },
      ])

      const [n1, n2] = instance.nodes

      instance.selectNode(n1)
      instance.selectNode(n2)

      // Hover one of the selected nodes and mouse down.
      instance.events.hoveredNode = n1
      instance.canvas.dispatchEvent(
        new CustomEvent('canvasmousedown', {
          detail: { event: { button: 0, ctrlKey: false, metaKey: false, shiftKey: false } },
        }),
      )

      const draggedIds = instance.events.draggedNodes
        .map((n: { id: number }) => n.id)
        .sort((a: number, b: number) => a - b)
      return { draggedIds }
    })

    expect(result.draggedIds).toEqual([1, 2])
  })
})
