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
  loadGraph,
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
  test('returns all 5 fixture nodes', async () => {
    const data = await executeCypherQuery({ graph: TEST_GRAPH, query: 'MATCH (n) RETURN n' })
    expect(cypherValues(data).length).toBe(5)
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
  test('no selection returns every label with total node counts', async () => {
    const { labels, nodeCounts } = await listLabels({ graph: TEST_GRAPH })
    expect(labels).toEqual(expect.arrayContaining(['Person', 'Company', 'Employee']))
    const counts = Object.fromEntries(labels.map((l, i) => [l, nodeCounts[i]]))
    expect(counts.Person).toBe(4) // Alice, Bob, Carol, Dave
    expect(counts.Company).toBe(1) // Acme
    expect(counts.Employee).toBe(1) // Dave
  })

  test('currentLabels selection returns co-occurrence counts, excluding selected and zero-count labels', async () => {
    const { labels, nodeCounts } = await listLabels({
      graph: TEST_GRAPH,
      currentLabels: ['Person'],
    })
    const counts = Object.fromEntries(labels.map((l, i) => [l, nodeCounts[i]]))
    // Dave is the only node with both Person and Employee.
    expect(counts.Employee).toBe(1)
    // The selected label is excluded from the results.
    expect(labels).not.toContain('Person')
    // Company shares no node with Person → count 0 → dropped, not returned as 0.
    expect(labels).not.toContain('Company')
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
    expect(res.reachedEnd).toBe(true)
    expect(Object.keys(res.data).length).toBe(5)
  })

  test('filters by label', async () => {
    const res = await listNodes({ graph: TEST_GRAPH, labels: ['Person'] })
    expect(Object.keys(res.data).length).toBe(4)
    for (const entry of Object.values(res.data)) {
      expect(entry.labels).toContain('Person')
    }
  })

  test('honors limit', async () => {
    const res = await listNodes({ graph: TEST_GRAPH, limit: 2 })
    expect(Object.keys(res.data).length).toBe(2)
    expect(res.reachedEnd).toBe(false)
  })

  test('multi-label filter is an intersection', async () => {
    // Only Dave carries both Person and Employee.
    const res = await listNodes({ graph: TEST_GRAPH, labels: ['Person', 'Employee'] })
    expect(Object.keys(res.data).length).toBe(1)
    const dave = Object.values(res.data)[0]
    expect(dave.properties.name).toBe('Dave')
    expect(dave.labels).toEqual(expect.arrayContaining(['Person', 'Employee']))
  })

  test('filters by property substring', async () => {
    const res = await listNodes({
      graph: TEST_GRAPH,
      properties: new Map([['name', 'ali']]),
    })
    expect(Object.keys(res.data).length).toBe(1)
    expect(Object.values(res.data)[0].properties.name).toBe('Alice')
  })

  test('property filter is case-insensitive', async () => {
    const res = await listNodes({
      graph: TEST_GRAPH,
      properties: new Map([['name', 'ALICE']]),
    })
    expect(Object.keys(res.data).length).toBe(1)
    expect(Object.values(res.data)[0].properties.name).toBe('Alice')
  })

  test('property filter with no match returns nothing', async () => {
    const res = await listNodes({
      graph: TEST_GRAPH,
      properties: new Map([['name', 'zzznope']]),
    })
    expect(Object.keys(res.data).length).toBe(0)
    expect(res.reachedEnd).toBe(true)
  })

  test('non-string property filters are ignored', async () => {
    // `age` is an integer property, so the filter is dropped and every node
    // is returned (mirrors the legacy endpoint's string-only filtering).
    const res = await listNodes({
      graph: TEST_GRAPH,
      properties: new Map([['age', '30']]),
    })
    expect(Object.keys(res.data).length).toBe(5)
  })

  test('combines label and property filters', async () => {
    // Person nodes whose name contains 'a': Alice, Carol, Dave. Bob has no 'a';
    // Acme matches the substring but is a Company, so the label filter drops it.
    const res = await listNodes({
      graph: TEST_GRAPH,
      labels: ['Person'],
      properties: new Map([['name', 'a']]),
    })
    const names = Object.values(res.data)
      .map((n) => n.properties.name)
      .sort()
    expect(names).toEqual(['Alice', 'Carol', 'Dave'])
    for (const entry of Object.values(res.data)) {
      expect(entry.labels).toContain('Person')
    }
  })

  test('paginates with skip and limit', async () => {
    const page = await listNodes({ graph: TEST_GRAPH, skip: 2, limit: 2 })
    expect(Object.keys(page.data).length).toBe(2)
    expect(page.reachedEnd).toBe(false)

    const pastEnd = await listNodes({ graph: TEST_GRAPH, skip: 5, limit: 2 })
    expect(Object.keys(pastEnd.data).length).toBe(0)
    expect(pastEnd.reachedEnd).toBe(true)
  })

  test('returns labels as an array and properties as an object', async () => {
    const res = await listNodes({
      graph: TEST_GRAPH,
      properties: new Map([['name', 'Alice']]),
    })
    const alice = Object.values(res.data)[0]
    expect(Array.isArray(alice.labels)).toBe(true)
    expect(alice.labels).toContain('Person')
    expect(alice.properties.name).toBe('Alice')
    expect(Number(alice.properties.age)).toBe(30)
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

  test('resolves edge type and properties', async () => {
    const ne = await getNodeEdges({ graph: TEST_GRAPH, nodeIDs: [aliceId] })
    const edgeIDs = ne[aliceId].outs.map((e) => e[0])
    const edges = await getEdges({ graph: TEST_GRAPH, edgeIDs })
    for (const id of edgeIDs) {
      // EdgeEntry tuple: [id, src, tgt, edgeTypeID, properties].
      expect(typeof edges[id][3]).toBe('number') // edgeTypeID
      expect(typeof edges[id][4]).toBe('object') // properties map (fixture edges have none)
    }
  })

  test('throws on unknown edge IDs', async () => {
    // The procedure aborts the query with "Invalid edge ID: N" rather than
    // silently dropping the id, so the caller never renders partial data.
    await expect(getEdges({ graph: TEST_GRAPH, edgeIDs: [999999] })).rejects.toThrow()
  })
})

describe('loadGraph', () => {
  // The success path (unloaded on-disk graph -> loaded) can't run here: the
  // fixture graph is auto-loaded by LOAD JSONL and there's no in-harness way to
  // unload it, so it was verified manually against the local build. These pin
  // the error semantics, which the app relies on being non-fatal.
  test('rejects for a graph that does not exist on disk', async () => {
    await expect(loadGraph({ graph: 'no_such_graph_xyz' })).rejects.toThrow()
  })

  test('rejects when the graph is already loaded', async () => {
    // `LOAD GRAPH` can only register an unloaded graph; the fixture is already
    // loaded, so this errors ("Failed to load graph"). Matches the old
    // /load_graph endpoint, which also errored on an already-loaded graph.
    await expect(loadGraph({ graph: TEST_GRAPH })).rejects.toThrow()
  })
})
