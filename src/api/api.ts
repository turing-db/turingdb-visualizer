import type {
  CypherQueryArgs,
  GetGraphStatusArgs,
  GetNodeEdgesArgs,
  GetNodesArgs,
  GetEdgesArgs,
  ListAvailableGraphsArgs,
  ListEdgeTypesArgs,
  ListLabelsArgs,
  ListNodesArgs,
  ListPropertyTypesArgs,
  LoadGraphArgs,
} from './args'

import {
  CypherQueryError,
  type CypherQueryResponse,
  type GetGraphStatusResponse,
  type GetNodeEdgesResponse,
  type NodeEdge,
  type GetNodeEdgeIDsResponse,
  type GetNodesResponse,
  type GetEdgesResponse,
  type ListAvailableGraphsResponse,
  type ListEdgeTypesResponse,
  type ListLabelsResponse,
  type ListNodesResponse,
  type ListPropertyTypesResponse,
} from './responses'

import type { NodeEntries } from './models/nodeEntries.model'
import type { NodeEntry } from './models/nodeEntry.model'
import type { EdgeEntry } from './models/edgeEntry.model'

// Build an `OR` chain in place of the `IN` operator (which the Cypher dialect
// does not yet support).
function inClause(field: string, values: number[]): string {
  return values.map((v) => `${field} = ${v}`).join(' OR ')
}

// Encode a string as a single-quoted Cypher string literal.
function cypherStringLiteral(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

export async function getGraphStatus(args: GetGraphStatusArgs): Promise<GetGraphStatusResponse> {
  // Derived from the graphless `LIST AVAILABLE GRAPHS` statement, which now
  // carries isLoaded/isLoading columns — replaces the /get_graph_status
  // endpoint. nodeCount/edgeCount are omitted: no consumer reads them.
  const data = await executeCypherQuery({
    graph: '',
    query: 'LIST AVAILABLE GRAPHS',
    controller: args.controller,
  })

  for (const chunk of data) {
    if (!Array.isArray(chunk) || chunk.length < 3) continue
    const [names, loaded, loading] = chunk as unknown[][]
    if (!Array.isArray(names)) continue
    for (let i = 0; i < names.length; i++) {
      if (names[i] === args.graph) {
        return { isLoaded: Boolean(loaded?.[i]), isLoading: Boolean(loading?.[i]) }
      }
    }
  }

  // Graph not present on disk → treat as not loaded / not loading.
  return { isLoaded: false, isLoading: false }
}

export async function listAvailableGraphs(
  args: ListAvailableGraphsArgs
): Promise<ListAvailableGraphsResponse> {
  // Both are graphless catalog statements, so run them with an empty graph
  // param — a non-empty unknown graph would fail with GRAPH_NOT_FOUND.
  // `LIST AVAILABLE GRAPHS` = on-disk graphs; `LIST GRAPH` = loaded graphs
  // (which may include in-memory graphs not yet on disk). Union matches the
  // previous avail+loaded endpoint behaviour.
  const firstColumnStrings = (data: CypherQueryResponse): string[] => {
    const names: string[] = []
    for (const chunk of data) {
      if (!Array.isArray(chunk) || chunk.length === 0) continue
      const col = chunk[0]
      if (!Array.isArray(col)) continue
      for (const v of col) {
        if (typeof v === 'string') names.push(v)
      }
    }
    return names
  }

  const [avail, loaded] = await Promise.all([
    executeCypherQuery({ graph: '', query: 'LIST AVAILABLE GRAPHS', controller: args.controller }),
    executeCypherQuery({ graph: '', query: 'LIST GRAPH', controller: args.controller }),
  ])

  return [...new Set([...firstColumnStrings(avail), ...firstColumnStrings(loaded)])]
}

export async function loadGraph(args: LoadGraphArgs): Promise<void> {
  // Migrated from the /load_graph endpoint to the graphless `LOAD GRAPH <name>`
  // statement. Run with an empty graph param: the target isn't loaded yet, so
  // `?graph=<name>` would fail with GRAPH_NOT_FOUND. The name is interpolated as
  // a bare identifier because the grammar rejects quoted names (`LOAD GRAPH ID`
  // only) — safe, since graph names are constrained to identifiers at creation.
  // Rejects (EXEC_ERROR "Failed to load graph") when the graph is missing or
  // already loaded, mirroring the old endpoint's GRAPH_LOAD_ERROR.
  await executeCypherQuery({
    graph: '',
    query: `LOAD GRAPH ${args.graph}`,
    controller: args.controller,
  })
}

export async function listLabels(args: ListLabelsArgs): Promise<ListLabelsResponse> {
  // Migrated from the /list_labels endpoint to the db.hierarchicalLabelCounts
  // procedure. Given the currently-selected labels, it yields each remaining
  // label with the count of nodes carrying all selected labels plus that label
  // (empty selection → every label with its total node count).
  const currentLabels = (args.currentLabels ?? []).map(cypherStringLiteral).join(', ')
  const query =
    `CALL db.hierarchicalLabelCounts([${currentLabels}]) YIELD label, nodeCount ` +
    'RETURN label, nodeCount'

  const data = await executeCypherQuery({
    graph: args.graph,
    query,
    controller: args.controller,
  })

  // Reshape the columnar result (col 0 = label, col 1 = nodeCount) into the
  // parallel-array shape the callers expect.
  const labels: string[] = []
  const nodeCounts: number[] = []
  for (const chunk of data) {
    if (!Array.isArray(chunk) || chunk.length < 2) continue
    const labelCol = chunk[0]
    const countCol = chunk[1]
    if (!Array.isArray(labelCol) || !Array.isArray(countCol)) continue
    for (let i = 0; i < labelCol.length; i++) {
      if (typeof labelCol[i] !== 'string') continue
      labels.push(labelCol[i] as string)
      nodeCounts.push(Number(countCol[i]))
    }
  }

  return { labels, nodeCounts }
}

export async function listPropertyTypes(
  args: ListPropertyTypesArgs
): Promise<ListPropertyTypesResponse> {
  // The `nodeIDs` filter on the original endpoint is not supported here:
  // Cypher's `keys(n)` is not yet implemented, so we cannot ask for the
  // distinct property types of a node set. No call site currently passes it.
  const data = await executeCypherQuery({
    graph: args.graph,
    query: 'CALL db.propertyTypes() YIELD propertyType RETURN propertyType',
    controller: args.controller,
  })

  const result: string[] = []
  for (const chunk of data) {
    if (!Array.isArray(chunk) || chunk.length === 0) continue
    const col = chunk[0]
    if (!Array.isArray(col)) continue
    for (const v of col) {
      if (typeof v === 'string') result.push(v)
    }
  }
  return result as ListPropertyTypesResponse
}

export async function listEdgeTypes(args: ListEdgeTypesArgs): Promise<ListEdgeTypesResponse> {
  // With an edgeIDs filter, MATCH those edges and collect their type *names*
  // (DISTINCT isn't supported in the Cypher dialect, so we dedupe client-side).
  if (args.edgeIDs && args.edgeIDs.length > 0) {
    const data = await executeCypherQuery({
      graph: args.graph,
      query: `MATCH ()-[r]->() WHERE ${inClause('r', args.edgeIDs)} RETURN type(r)`,
      controller: args.controller,
    })

    const seen = new Set<string>()
    for (const chunk of data) {
      if (!Array.isArray(chunk) || chunk.length === 0) continue
      const col = chunk[0]
      if (!Array.isArray(col)) continue
      for (const v of col) {
        if (typeof v === 'string') seen.add(v)
      }
    }
    return [...seen] as ListEdgeTypesResponse
  }

  // Otherwise ask the procedure for the full (id, name) table and index the
  // result array by the edge type ID. We yield `id` explicitly rather than
  // trusting the rows to arrive in ID order, so a non-dense or reordered id
  // space still resolves edgeTypes[edgeTypeID] correctly.
  const data = await executeCypherQuery({
    graph: args.graph,
    query: 'CALL db.edgeTypes() YIELD id, edgeType RETURN id, edgeType',
    controller: args.controller,
  })

  const edgeTypes: string[] = []
  for (const chunk of data) {
    if (!Array.isArray(chunk) || chunk.length < 2) continue
    const [ids, names] = chunk as unknown[][]
    if (!Array.isArray(ids) || !Array.isArray(names)) continue
    for (let i = 0; i < ids.length; i++) {
      const id = Number(ids[i])
      const name = names[i]
      if (Number.isInteger(id) && id >= 0 && typeof name === 'string') {
        edgeTypes[id] = name
      }
    }
  }
  return edgeTypes as ListEdgeTypesResponse
}

export async function listNodes(args: ListNodesArgs): Promise<ListNodesResponse> {
  // Migrated from /list_nodes to the db.listNodes CALL procedure. Label and
  // property-substring filters plus skip/limit paging are procedure arguments;
  // it yields one row per matching node: id, labels (a list of strings) and
  // properties (a JSON-encoded {name: value} map).
  const DEFAULT_LIMIT = 1000
  const labels = (args.labels ?? []).map(cypherStringLiteral).join(', ')
  const propEntries = args.properties ? [...args.properties.entries()] : []
  const keys = propEntries.map(([k]) => cypherStringLiteral(k)).join(', ')
  const values = propEntries.map(([, v]) => cypherStringLiteral(v)).join(', ')
  const skip = args.skip ?? 0
  const limit = args.limit ?? DEFAULT_LIMIT

  const query =
    `CALL db.listNodes([${labels}], [${keys}], [${values}], ${skip}, ${limit}) ` +
    'YIELD id, labels, properties RETURN id, labels, properties'

  const chunks = await executeCypherQuery({
    graph: args.graph,
    query,
    signal: args.signal,
    controller: args.controller,
  })

  // Reshape the columnar result (col 0 = id, col 1 = labels list, col 2 =
  // properties JSON string) into the id-keyed NodeEntries map. Edge counts are
  // omitted (0) — no list_nodes consumer reads them, and real counts arrive via
  // getNodes when a node is added to the canvas.
  const data: NodeEntries = {}
  let count = 0
  for (const chunk of chunks) {
    if (!Array.isArray(chunk) || chunk.length < 3) continue
    const [ids, labelsCol, propsCol] = chunk as [unknown[], unknown[], unknown[]]
    if (!Array.isArray(ids) || !Array.isArray(labelsCol) || !Array.isArray(propsCol)) continue
    for (let i = 0; i < ids.length; i++) {
      const id = Number(ids[i])
      const labels = Array.isArray(labelsCol[i]) ? (labelsCol[i] as string[]) : []
      let properties: NodeEntry['properties'] = {}
      try {
        properties = JSON.parse(propsCol[i] as string)
      } catch {
        properties = {}
      }
      data[id] = { id, in_edge_count: 0, out_edge_count: 0, labels, properties }
      count++
    }
  }

  // A page that filled to `limit` may have more behind it; a short page means
  // the scan ran out.
  return { data, reachedEnd: count < limit }
}

export async function getNodes(args: GetNodesArgs): Promise<GetNodesResponse> {
  // Migrated from /get_nodes to the db.getNodes CALL procedure. It yields one row
  // per existing node: id, labels (a list of strings), in/out edge counts, and a
  // JSON-encoded {name: value} properties map. Unknown/deleted ids are skipped.
  const ids = args.nodeIDs.join(', ')
  const query =
    `CALL db.getNodes([${ids}]) YIELD id, labels, inEdgeCount, outEdgeCount, properties ` +
    'RETURN id, labels, inEdgeCount, outEdgeCount, properties'

  const chunks = await executeCypherQuery({
    graph: args.graph,
    query,
    signal: args.signal,
    controller: args.controller,
  })

  // Reshape the columnar result (id, labels, inEdgeCount, outEdgeCount,
  // properties-JSON) into the id-keyed NodeEntries map.
  const data: GetNodesResponse = {}
  for (const chunk of chunks) {
    if (!Array.isArray(chunk) || chunk.length < 5) continue
    const [ids2, labelsCol, inCol, outCol, propsCol] = chunk as unknown[][]
    if (![ids2, labelsCol, inCol, outCol, propsCol].every(Array.isArray)) continue
    for (let i = 0; i < ids2.length; i++) {
      const id = Number(ids2[i])
      const labels = Array.isArray(labelsCol[i]) ? (labelsCol[i] as string[]) : []
      let properties: NodeEntry['properties'] = {}
      try {
        properties = JSON.parse(propsCol[i] as string)
      } catch {
        properties = {}
      }
      data[id] = {
        id,
        labels,
        in_edge_count: Number(inCol[i]),
        out_edge_count: Number(outCol[i]),
        properties,
      }
    }
  }
  return data
}

// Build the db.getNodeEdges CALL shared by getNodeEdges and getNodeEdgeIDs. The
// per-edge-type limit maps are passed as parallel (types, values) list args.
function nodeEdgesQuery(args: GetNodeEdgesArgs, returnOnlyIDs: boolean): string {
  const nodeIDs = args.nodeIDs.join(', ')
  const defaultLimit = args.defaultLimit ?? 10
  const outEntries = args.limitByOutEdgeType ? [...args.limitByOutEdgeType.entries()] : []
  const inEntries = args.limitByInEdgeType ? [...args.limitByInEdgeType.entries()] : []
  const outTypes = outEntries.map(([t]) => t).join(', ')
  const outVals = outEntries.map(([, v]) => v).join(', ')
  const inTypes = inEntries.map(([t]) => t).join(', ')
  const inVals = inEntries.map(([, v]) => v).join(', ')
  return (
    `CALL db.getNodeEdges([${nodeIDs}], ${defaultLimit}, [${outTypes}], [${outVals}], ` +
    `[${inTypes}], [${inVals}], ${returnOnlyIDs ? 'true' : 'false'}) ` +
    'YIELD id, outgoingEdges, incomingEdges, outEdgeCounts, inEdgeCounts ' +
    'RETURN id, outgoingEdges, incomingEdges, outEdgeCounts, inEdgeCounts'
  )
}

function parseEdgeCounts(cell: unknown): { [edgeTypeID: number]: number } {
  try {
    return JSON.parse(cell as string)
  } catch {
    return {}
  }
}

export async function getNodeEdges(args: GetNodeEdgesArgs): Promise<GetNodeEdgesResponse> {
  // Migrated from /get_node_edges to db.getNodeEdges. outgoingEdges/incomingEdges
  // come back as native nested lists [id, src, tgt, edgeTypeID] (edge properties
  // are dropped — no consumer reads them); counts arrive as JSON maps.
  const chunks = await executeCypherQuery({
    graph: args.graph,
    query: nodeEdgesQuery(args, false),
    signal: args.signal,
    controller: args.controller,
  })

  const data: GetNodeEdgesResponse = {}
  for (const chunk of chunks) {
    if (!Array.isArray(chunk) || chunk.length < 5) continue
    const [ids, outs, ins, outCounts, inCounts] = chunk as unknown[][]
    if (![ids, outs, ins, outCounts, inCounts].every(Array.isArray)) continue
    for (let i = 0; i < ids.length; i++) {
      const toEntries = (raw: unknown): NodeEdge[] =>
        (Array.isArray(raw) ? (raw as number[][]) : []).map(
          (e) => [e[0], e[1], e[2], e[3]] as NodeEdge
        )
      data[Number(ids[i])] = {
        outs: toEntries(outs[i]),
        ins: toEntries(ins[i]),
        outEdgeCounts: parseEdgeCounts(outCounts[i]),
        inEdgeCounts: parseEdgeCounts(inCounts[i]),
      }
    }
  }
  return data
}

export async function getNodeEdgeIDs(args: GetNodeEdgesArgs): Promise<GetNodeEdgeIDsResponse> {
  // ids-only variant: edges come back as [edgeID, otherID] pairs.
  const chunks = await executeCypherQuery({
    graph: args.graph,
    query: nodeEdgesQuery(args, true),
    signal: args.signal,
    controller: args.controller,
  })

  const data: GetNodeEdgeIDsResponse = {}
  for (const chunk of chunks) {
    if (!Array.isArray(chunk) || chunk.length < 5) continue
    const [ids, outs, ins, outCounts, inCounts] = chunk as unknown[][]
    if (![ids, outs, ins, outCounts, inCounts].every(Array.isArray)) continue
    for (let i = 0; i < ids.length; i++) {
      const pairs = (raw: unknown): [number, number][] =>
        Array.isArray(raw) ? (raw as [number, number][]) : []
      data[Number(ids[i])] = {
        outs: pairs(outs[i]).map((e) => ({ edgeID: e[0], tgtID: e[1] })),
        ins: pairs(ins[i]).map((e) => ({ edgeID: e[0], srcID: e[1] })),
        outEdgeCounts: parseEdgeCounts(outCounts[i]),
        inEdgeCounts: parseEdgeCounts(inCounts[i]),
      }
    }
  }
  return data
}

export async function getEdges(args: GetEdgesArgs): Promise<GetEdgesResponse> {
  // Migrated from /get_edges to the db.getEdges CALL procedure. It yields one row
  // per existing edge: id, src, tgt, edgeTypeID and a JSON-encoded properties map
  // (keyed by numeric property-type id). Unknown/deleted ids are skipped.
  const ids = args.edgeIDs.join(', ')
  const query =
    `CALL db.getEdges([${ids}]) YIELD id, src, tgt, edgeTypeID, properties ` +
    'RETURN id, src, tgt, edgeTypeID, properties'

  const chunks = await executeCypherQuery({
    graph: args.graph,
    query,
    signal: args.signal,
    controller: args.controller,
  })

  // Reshape the columnar result (id, src, tgt, edgeTypeID, properties-JSON) into
  // the id-keyed EdgeEntry tuples [id, src, tgt, edgeTypeID, properties].
  const data: GetEdgesResponse = {}
  for (const chunk of chunks) {
    if (!Array.isArray(chunk) || chunk.length < 5) continue
    const [ids2, srcs, tgts, types, props] = chunk as unknown[][]
    if (![ids2, srcs, tgts, types, props].every(Array.isArray)) continue
    for (let i = 0; i < ids2.length; i++) {
      const id = Number(ids2[i])
      let properties: EdgeEntry[4] = {}
      try {
        properties = JSON.parse(props[i] as string)
      } catch {
        properties = {}
      }
      data[id] = [id, Number(srcs[i]), Number(tgts[i]), Number(types[i]), properties]
    }
  }
  return data
}

export async function executeCypherQuery(args: CypherQueryArgs): Promise<CypherQueryResponse> {
  return await fetch(`/api/query?graph=${args.graph}`, {
    method: 'POST',
    signal: args.signal ?? args.controller?.signal,
    headers: {
      'Content-Type': 'text/plain',
    },
    body: args.query,
  }).then((res) =>
    res.text().then((text) => {
      const json = JSON.parse(text)
      if (json.error) {
        throw new CypherQueryError(json.error, json.error_details || '')
      }
      return json.data
    })
  )
}
