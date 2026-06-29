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
} from './args'

import {
  CypherQueryError,
  type CypherQueryResponse,
  type GetGraphStatusResponse,
  type GetNodeEdgesResponse,
  type GetNodeEdgeIDsResponse,
  type GetNodeEdgeIDsRawResponse,
  type GetNodesResponse,
  type GetEdgesResponse,
  type ListAvailableGraphsResponse,
  type ListEdgeTypesResponse,
  type ListLabelsResponse,
  type ListNodesResponse,
  type ListPropertyTypesResponse,
} from './responses'

// Build an `OR` chain in place of the `IN` operator (which the Cypher dialect
// does not yet support).
function inClause(field: string, values: number[]): string {
  return values.map((v) => `${field} = ${v}`).join(' OR ')
}

export async function getGraphStatus(args: GetGraphStatusArgs): Promise<GetGraphStatusResponse> {
  return await fetch(`/api/get_graph_status?graph=${args.graph}`, {
    method: 'POST',
    body: JSON.stringify({}),
    signal: args.controller?.signal,
  }).then((res) => res.json().then((json) => json.data))
}

export async function listAvailableGraphs(
  args: ListAvailableGraphsArgs
): Promise<ListAvailableGraphsResponse> {
  const avail_graphs = await fetch('/api/list_avail_graphs', {
    method: 'POST',
    body: JSON.stringify({}),
    signal: args.controller?.signal,
  }).then((res) =>
    res.json().then((json) => {
      return json.data.flat()
    })
  )

  const loaded_graphs = await fetch('/api/list_loaded_graphs', {
    method: 'POST',
    body: JSON.stringify({}),
    signal: args.controller?.signal,
  }).then((res) =>
    res.json().then((json) => {
      return json.data.flat().flat()
    })
  )

  return [...new Set([...avail_graphs, ...loaded_graphs])]
}

export async function listLabels(args: ListLabelsArgs): Promise<ListLabelsResponse> {
  return await fetch(`/api/list_labels?graph=${args.graph}`, {
    method: 'POST',
    signal: args.controller?.signal,
    body: JSON.stringify({
      currentLabels: args.currentLabels || [],
    }),
  }).then((res) =>
    res.json().then((json) => {
      return json.data
    })
  )
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
  // Without an edgeIDs filter, just ask the procedure.
  // With one, MATCH the edges and collect their types — DISTINCT isn't
  // supported in the Cypher dialect, so we dedupe client-side.
  const query =
    args.edgeIDs && args.edgeIDs.length > 0
      ? `MATCH ()-[r]->() WHERE ${inClause('r', args.edgeIDs)} RETURN type(r)`
      : 'CALL db.edgeTypes() YIELD edgeType RETURN edgeType'

  const data = await executeCypherQuery({
    graph: args.graph,
    query,
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

export async function listNodes(args: ListNodesArgs): Promise<ListNodesResponse> {
  return await fetch(`/api/list_nodes?graph=${args.graph}`, {
    method: 'POST',
    signal: args.signal,
    body: JSON.stringify({
      labels: args.labels || [],
      properties: args.properties ? Object.fromEntries(args.properties) : {},
      ...(args.skip !== undefined && { skip: args.skip }),
      ...(args.limit !== undefined && { limit: args.limit }),
    }),
  }).then((res) =>
    res.text().then((text) => {
      return JSON.parse(text)
    })
  )
}

export async function getNodes(args: GetNodesArgs): Promise<GetNodesResponse> {
  return await fetch(`/api/get_nodes?graph=${args.graph}`, {
    method: 'POST',
    signal: args.controller?.signal,
    body: JSON.stringify({
      nodeIDs: args.nodeIDs,
    }),
  }).then((res) =>
    res.text().then((text) => {
      return JSON.parse(text).data
    })
  )
}

export async function getNodeEdges(args: GetNodeEdgesArgs): Promise<GetNodeEdgesResponse> {
  return await fetch(`/api/get_node_edges?graph=${args.graph}`, {
    method: 'POST',
    signal: args.controller?.signal,
    body: JSON.stringify({
      nodeIDs: args.nodeIDs,
      ...(args.defaultLimit !== undefined && {
        defaultLimit: args.defaultLimit,
      }),
      ...(args.limitByOutEdgeType !== undefined && {
        limitByOutEdgeType: [...args.limitByOutEdgeType.entries()],
      }),
      ...(args.limitByInEdgeType !== undefined && {
        limitByInEdgeType: [...args.limitByInEdgeType.entries()],
      }),
    }),
  }).then((res) => res.text().then((text) => JSON.parse(text).data))
}

export async function getNodeEdgeIDs(args: GetNodeEdgesArgs): Promise<GetNodeEdgeIDsResponse> {
  return await fetch(`/api/get_node_edges?graph=${args.graph}`, {
    method: 'POST',
    signal: args.controller?.signal,
    body: JSON.stringify({
      nodeIDs: args.nodeIDs,
      ...(args.defaultLimit !== undefined && {
        defaultLimit: args.defaultLimit,
      }),
      ...(args.limitByOutEdgeType !== undefined && {
        limitByOutEdgeType: [...args.limitByOutEdgeType.entries()],
      }),
      ...(args.limitByInEdgeType !== undefined && {
        limitByInEdgeType: [...args.limitByInEdgeType.entries()],
      }),
      returnOnlyIDs: true,
    }),
  }).then((res) =>
    res.text().then((text) => {
      const rawData = JSON.parse(text).data as GetNodeEdgeIDsRawResponse
      const data: GetNodeEdgeIDsResponse = Object.fromEntries(
        Object.entries(rawData).map(([key, entry]) => [
          Number.parseInt(key),
          {
            ...entry,
            outs: entry.outs.map((e) => ({ edgeID: e[0], tgtID: e[1] })),
            ins: entry.ins.map((e) => ({ edgeID: e[0], srcID: e[1] })),
          },
        ])
      )
      return data
    })
  )
}

export async function getEdges(args: GetEdgesArgs): Promise<GetEdgesResponse> {
  return await fetch(`/api/get_edges?graph=${args.graph}`, {
    method: 'POST',
    signal: args.controller?.signal,
    body: JSON.stringify({
      edgeIDs: args.edgeIDs,
    }),
  }).then((res) =>
    res.text().then((text) => {
      return JSON.parse(text).data
    })
  )
}

export async function executeCypherQuery(args: CypherQueryArgs): Promise<CypherQueryResponse> {
  return await fetch(`/api/query?graph=${args.graph}`, {
    method: 'POST',
    signal: args.controller?.signal,
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
