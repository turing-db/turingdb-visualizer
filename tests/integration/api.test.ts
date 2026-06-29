// API-contract tests: exercise the real functions in src/api/api.ts against a
// live TuringDB seeded with the fixture in fixture.jsonl. These pin the
// observable behavior of the endpoint-backed functions so the upcoming
// endpoint->Cypher migration can be verified by re-running this suite and
// getting the same results.
//
// Coverage target: every api.ts function that has a real consumer in the app.
// The dead functions (getNeighbors, getNodeProperties, exploreNodeEdges have no
// call sites anywhere in src/) are intentionally not tested.
import { beforeAll, describe, expect, test } from 'vitest'
import {
  executeCypherQuery,
  getEdges,
  getGraphStatus,
  getNodeEdgeIDs,
  getNodeEdges,
  getNodes,
  listAvailableGraphs,
  listEdgeTypes,
  listLabels,
  listNodes,
  listPropertyTypes,
} from '@/api/api'
import { TEST_GRAPH } from './config'

/** Recursively collect every leaf value out of TuringDB's columnar chunks. */
function cypherValues(data: unknown): unknown[] {
  const out: unknown[] = []
  const walk = (x: unknown) => {
    if (Array.isArray(x)) x.forEach(walk)
    else out.push(x)
  }
  walk(data)
  return out
}

/** Resolve a fixture node's auto-assigned ID by its `name` property. */
async function nodeIdByName(name: string): Promise<number> {
  const data = await executeCypherQuery({
    graph: TEST_GRAPH,
    query: `MATCH (n {name: '${name}'}) RETURN n`,
  })
  const ids = cypherValues(data)
  expect(ids.length).toBe(1)
  return Number(ids[0])
}

let aliceId: number
let bobId: number
let acmeId: number

beforeAll(async () => {
  ;[aliceId, bobId, acmeId] = await Promise.all([
    nodeIdByName('Alice'),
    nodeIdByName('Bob'),
    nodeIdByName('Acme'),
  ])
})

describe('executeCypherQuery', () => {
  test('returns all 4 fixture nodes', async () => {
    const data = await executeCypherQuery({ graph: TEST_GRAPH, query: 'MATCH (n) RETURN n' })
    expect(cypherValues(data).length).toBe(4)
  })

  test('surfaces a CypherQueryError on a bad query', async () => {
    await expect(
      executeCypherQuery({ graph: TEST_GRAPH, query: 'THIS IS NOT CYPHER' }),
    ).rejects.toThrow()
  })
})

describe('listAvailableGraphs', () => {
  test('includes the fixture graph', async () => {
    const graphs = await listAvailableGraphs({})
    expect(graphs).toContain(TEST_GRAPH)
  })
})

describe('getGraphStatus', () => {
  test('reports the fixture graph as loaded', async () => {
    const status = await getGraphStatus({ graph: TEST_GRAPH })
    expect(status?.isLoaded).toBe(true)
    expect(status?.isLoading).toBe(false)
  })
})

describe('listLabels', () => {
  test('returns Person and Company with node counts', async () => {
    const { labels, nodeCounts } = await listLabels({ graph: TEST_GRAPH })
    expect(labels).toEqual(expect.arrayContaining(['Person', 'Company']))
    const counts = Object.fromEntries(labels.map((l, i) => [l, nodeCounts[i]]))
    expect(counts.Person).toBe(3)
    expect(counts.Company).toBe(1)
  })
})

describe('listPropertyTypes', () => {
  test('returns the fixture property keys', async () => {
    const props = await listPropertyTypes({ graph: TEST_GRAPH })
    expect(props).toEqual(expect.arrayContaining(['name', 'age']))
  })
})

describe('listEdgeTypes', () => {
  test('returns KNOWS and WORKS_AT', async () => {
    const types = await listEdgeTypes({ graph: TEST_GRAPH })
    expect(types).toEqual(expect.arrayContaining(['KNOWS', 'WORKS_AT']))
  })
})

describe('listNodes', () => {
  test('returns all nodes with no filter', async () => {
    const res = await listNodes({ graph: TEST_GRAPH })
    expect(res.nodeCount).toBe(4)
    expect(res.reachedEnd).toBe(true)
    expect(Object.keys(res.data).length).toBe(4)
  })

  test('filters by label', async () => {
    const res = await listNodes({ graph: TEST_GRAPH, labels: ['Person'] })
    expect(res.nodeCount).toBe(3)
    for (const entry of Object.values(res.data)) {
      expect(entry.labels).toContain('Person')
    }
  })

  test('honors limit', async () => {
    const res = await listNodes({ graph: TEST_GRAPH, limit: 2 })
    expect(Object.keys(res.data).length).toBe(2)
    expect(res.reachedEnd).toBe(false)
  })
})

describe('getNodes', () => {
  test('returns the node entry for a known ID', async () => {
    const nodes = await getNodes({ graph: TEST_GRAPH, nodeIDs: [aliceId] })
    const alice = nodes[aliceId]
    expect(alice).toBeDefined()
    expect(alice.labels).toContain('Person')
    expect(alice.properties.name).toBe('Alice')
    expect(alice.out_edge_count).toBe(2)
    expect(alice.in_edge_count).toBe(0)
  })
})

describe('getNodeEdges', () => {
  test('returns Alice\'s two outgoing edges (to Bob and Acme) and no incoming', async () => {
    const res = await getNodeEdges({ graph: TEST_GRAPH, nodeIDs: [aliceId] })
    const alice = res[aliceId]
    expect(alice.ins.length).toBe(0)
    expect(alice.outs.length).toBe(2)
    // EdgeEntry tuple: [id, src, tgt, edgeTypeID, properties]
    expect(alice.outs.every((e) => e[1] === aliceId)).toBe(true)
    expect(alice.outs.map((e) => e[2]).sort()).toEqual([bobId, acmeId].sort())
  })
})

describe('getNodeEdgeIDs', () => {
  test('returns edge/target ID pairs for Alice', async () => {
    const res = await getNodeEdgeIDs({ graph: TEST_GRAPH, nodeIDs: [aliceId] })
    const alice = res[aliceId]
    expect(alice.ins.length).toBe(0)
    expect(alice.outs.map((o) => o.tgtID).sort()).toEqual([bobId, acmeId].sort())
    expect(alice.outs.every((o) => typeof o.edgeID === 'number')).toBe(true)
  })
})

describe('getEdges', () => {
  test('returns edge entries for discovered edge IDs', async () => {
    // Discover Alice's outgoing edge IDs, then fetch those edges.
    const ne = await getNodeEdges({ graph: TEST_GRAPH, nodeIDs: [aliceId] })
    const edgeIDs = ne[aliceId].outs.map((e) => e[0])
    const edges = await getEdges({ graph: TEST_GRAPH, edgeIDs })
    expect(Object.keys(edges).length).toBe(2)
    for (const id of edgeIDs) {
      // EdgeEntry tuple: [id, src, tgt, ...] — src is Alice.
      expect(edges[id][0]).toBe(id)
      expect(edges[id][1]).toBe(aliceId)
    }
  })
})
