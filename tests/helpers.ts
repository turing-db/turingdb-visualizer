import type { Page } from '@playwright/test'

/** Mock all TuringDB API endpoints so tests run without a real backend. */
export async function mockApi(page: Page, opts: MockApiOpts = {}) {
  const graphs = opts.graphs ?? ['test-graph']
  const loaded = opts.loaded ?? false

  // list_avail_graphs
  await page.route('**/api/list_avail_graphs', (route) =>
    route.fulfill({ json: { data: [graphs] } }),
  )

  // list_loaded_graphs
  await page.route('**/api/list_loaded_graphs', (route) =>
    route.fulfill({ json: { data: loaded ? [graphs] : [[]] } }),
  )

  // get_graph_status
  await page.route('**/api/get_graph_status*', (route) =>
    route.fulfill({
      json: {
        data: {
          isLoaded: loaded,
          isLoading: false,
          nodeCount: loaded ? 3 : 0,
          edgeCount: loaded ? 2 : 0,
        },
      },
    }),
  )

  // load_graph
  await page.route('**/api/load_graph*', (route) =>
    route.fulfill({ json: { data: {} } }),
  )

  // list_labels
  await page.route('**/api/list_labels*', (route) =>
    route.fulfill({ json: { data: { labels: ['Person', 'Company'], nodeCounts: [2, 1] } } }),
  )

  // list_property_types
  await page.route('**/api/list_property_types*', (route) =>
    route.fulfill({ json: { data: ['name', 'age'] } }),
  )

  // list_edge_types
  await page.route('**/api/list_edge_types*', (route) =>
    route.fulfill({ json: { data: ['KNOWS', 'WORKS_AT'] } }),
  )

  // list_nodes
  await page.route('**/api/list_nodes*', (route) =>
    route.fulfill({
      json: { data: {}, nodeCount: 0, reachedEnd: true },
    }),
  )

  // get_nodes
  await page.route('**/api/get_nodes*', (route) =>
    route.fulfill({
      json: {
        data: {
          1: { id: 1, labels: ['Person'], properties: { name: 'Alice' }, in_edge_count: 0, out_edge_count: 1 },
          2: { id: 2, labels: ['Person'], properties: { name: 'Bob' }, in_edge_count: 1, out_edge_count: 1 },
          3: { id: 3, labels: ['Company'], properties: { name: 'Acme' }, in_edge_count: 1, out_edge_count: 0 },
        },
      },
    }),
  )

  // get_edges
  await page.route('**/api/get_edges*', (route) =>
    route.fulfill({
      json: {
        data: {
          100: [100, 1, 2, 0, {}],
          101: [101, 2, 3, 1, {}],
        },
      },
    }),
  )

  // get_node_edges (full + IDs-only)
  await page.route('**/api/get_node_edges*', (route) =>
    route.fulfill({
      json: {
        data: {
          1: { ins: [], outs: [[100, 2]], inEdgeCounts: {}, outEdgeCounts: { 0: 1 } },
          2: { ins: [[100, 1]], outs: [[101, 3]], inEdgeCounts: { 0: 1 }, outEdgeCounts: { 1: 1 } },
          3: { ins: [[101, 2]], outs: [], inEdgeCounts: { 1: 1 }, outEdgeCounts: {} },
        },
      },
    }),
  )

  // query (cypher)
  await page.route('**/api/query*', (route) => {
    if (opts.cypherHandler) {
      opts.cypherHandler(route)
      return
    }
    route.fulfill({
      json: { data: [[[1, 2, 3]]] },
    })
  })

  // explore_node_edges
  await page.route('**/api/explore_node_edges*', (route) =>
    route.fulfill({ json: { data: [] } }),
  )
}

export type MockApiOpts = {
  graphs?: string[]
  loaded?: boolean
  cypherHandler?: (route: import('@playwright/test').Route) => void
}

/**
 * Mock the API with a loaded graph, navigate to the page, and select the graph
 * via the UI so the app transitions to the viewer.
 */
export async function setupLoadedGraph(page: Page, opts: Omit<MockApiOpts, 'loaded'> = {}) {
  const graphName = opts.graphs?.[0] ?? 'test-graph'
  await mockApi(page, { ...opts, loaded: true })
  await page.goto('/')

  // Wait for the app shell to render
  await page.locator('[aria-label="turing-logo"]').waitFor()

  // Select the graph via the dropdown — this sets graphName in the store
  await page.getByRole('button', { name: 'Graph' }).click()
  await page.getByText(graphName).click()

  // Wait for the viewer to load (canvas appears)
  await page.locator('#turing-canvas-1').waitFor({ timeout: 10_000 })
}
