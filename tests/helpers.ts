import type { Page, Route } from '@playwright/test'

// The whole app now talks to a single backend endpoint, `/api/query`: catalog
// and data access go through Cypher statements (`LIST AVAILABLE GRAPHS`,
// `LOAD GRAPH <g>`) and `CALL db.*` procedures, and arbitrary user queries go
// through the same endpoint. So the mock is one `/api/query` dispatcher that
// serves the app's own statements as columnar fixture data and hands genuine
// user queries to an optional `cypherHandler`.
//
// TuringDB's columnar response shape is `{ data: [chunk, ...] }` where each
// chunk is `[column, ...]` and each column is a flat array of that column's
// cell values — i.e. `{ data: [[col0, col1, ...]] }` for a single chunk. The
// api.ts reshapers read the columns positionally, matching each `YIELD` clause.

// Fixture: 3 nodes (Alice/Bob/Acme) and 2 edges (Alice-KNOWS->Bob,
// Bob-WORKS_AT->Acme), mirroring tests/integration/fixture.jsonl in spirit.
const NODE_IDS = [1, 2, 3]
const NODE_LABELS = [['Person'], ['Person'], ['Company']]
const NODE_PROPS = ['{"name":"Alice"}', '{"name":"Bob"}', '{"name":"Acme"}']
const NODE_IN_COUNTS = [0, 1, 1]
const NODE_OUT_COUNTS = [1, 1, 0]

const EDGE_TYPES = ['KNOWS', 'WORKS_AT'] // indexed by edge-type id (0, 1)
const LABELS = ['Person', 'Company']
const LABEL_COUNTS = [2, 1]
const PROPERTY_TYPES = ['name', 'age']

// db.getNodeEdges rows, one per node. Full form yields [edgeID, src, tgt,
// edgeTypeID] per edge; the ids-only form yields [edgeID, otherID].
const OUT_EDGES_FULL = [[[100, 1, 2, 0]], [[101, 2, 3, 1]], []]
const IN_EDGES_FULL = [[], [[100, 1, 2, 0]], [[101, 2, 3, 1]]]
const OUT_EDGES_IDS = [[[100, 2]], [[101, 3]], []]
const IN_EDGES_IDS = [[], [[100, 1]], [[101, 2]]]
const OUT_EDGE_COUNTS = ['{"0":1}', '{"1":1}', '{}']
const IN_EDGE_COUNTS = ['{}', '{"0":1}', '{"1":1}']

/** One-chunk response from its column arrays. */
function chunk(columns: unknown[][]) {
  return { data: [columns] }
}

/**
 * Map one of the app's own statements to its columnar response, or return null
 * if `body` isn't a statement the app itself issues (i.e. it's a user query).
 */
function internalQueryResponse(body: string, graphs: string[], loaded: boolean) {
  // Catalog statements. Check the more specific "AVAILABLE" form first.
  if (body.includes('LIST AVAILABLE GRAPHS')) {
    return chunk([graphs, graphs.map(() => loaded), graphs.map(() => false)])
  }
  if (body.includes('LIST GRAPH')) {
    return chunk([loaded ? graphs : []])
  }
  if (body.includes('LOAD GRAPH')) {
    // The caller swallows the result; echo the name so it looks like a success.
    return chunk([graphs])
  }

  // CALL procedures. Order matters only where one name is a prefix of another;
  // getNodeEdges/getNodes are disjoint substrings, but keep the longer first.
  if (body.includes('db.hierarchicalLabelCounts')) {
    return chunk([LABELS, LABEL_COUNTS])
  }
  if (body.includes('db.propertyTypes')) {
    return chunk([PROPERTY_TYPES])
  }
  if (body.includes('db.edgeTypes')) {
    return chunk([EDGE_TYPES.map((_, i) => i), EDGE_TYPES])
  }
  if (body.includes('db.listNodes')) {
    return chunk([NODE_IDS, NODE_LABELS, NODE_PROPS])
  }
  if (body.includes('db.getNodeEdges')) {
    // The 7th arg (returnOnlyIDs) selects the edge tuple shape.
    const idsOnly = /,\s*true\)\s*YIELD/.test(body)
    return chunk([
      NODE_IDS,
      idsOnly ? OUT_EDGES_IDS : OUT_EDGES_FULL,
      idsOnly ? IN_EDGES_IDS : IN_EDGES_FULL,
      OUT_EDGE_COUNTS,
      IN_EDGE_COUNTS,
    ])
  }
  if (body.includes('db.getNodes')) {
    return chunk([NODE_IDS, NODE_LABELS, NODE_IN_COUNTS, NODE_OUT_COUNTS, NODE_PROPS])
  }
  if (body.includes('db.getEdges')) {
    return chunk([
      [100, 101],
      [1, 2],
      [2, 3],
      [0, 1],
      ['{}', '{}'],
    ])
  }

  return null
}

/** Mock the single `/api/query` backend so tests run without a real DB. */
export async function mockApi(page: Page, opts: MockApiOpts = {}) {
  const graphs = opts.graphs ?? ['test-graph']
  const loaded = opts.loaded ?? false

  await page.route('**/api/query*', async (route) => {
    const body = route.request().postData() ?? ''

    const internal = internalQueryResponse(body, graphs, loaded)
    if (internal !== null) {
      await route.fulfill({ json: internal })
      return
    }

    // Not one of the app's own statements → a user-issued Cypher query.
    if (opts.cypherHandler) {
      await opts.cypherHandler(route)
      return
    }
    await route.fulfill({ json: { data: [] } })
  })
}

export type MockApiOpts = {
  graphs?: string[]
  loaded?: boolean
  cypherHandler?: (route: Route) => void | Promise<void>
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
