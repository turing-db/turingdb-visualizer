import { ExploreEdgeDir } from './args'
import * as mockResponses from './mock-responses'

import type {
  ExploreNodeEdgesArgs,
  GetGraphStatusArgs,
  GetNeighborsArgs,
  GetNodeEdgesArgs,
  GetNodePropertiesArgs,
  GetNodesArgs,
  GetEdgesArgs,
  ListAvailableGraphsArgs,
  ListEdgeTypesArgs,
  ListLabelsArgs,
  ListNodesArgs,
  ListPropertyTypesArgs,
} from './args'

import type {
  ExploreNodeEdgesResponse,
  GetGraphStatusResponse,
  GetNeighborsResponse,
  GetNodeEdgesResponse,
  GetNodeEdgeIDsResponse,
  GetNodeEdgeIDsRawResponse,
  GetNodePropertiesResponse,
  GetNodesResponse,
  GetEdgesResponse,
  ListAvailableGraphsResponse,
  ListEdgeTypesResponse,
  ListLabelsResponse,
  ListNodesResponse,
  ListPropertyTypesResponse,
} from './responses'

const isDemoMode = window.location.hostname === 'localhost' || window.location.hostname.includes('lovable.app')

export async function getGraphStatus(args: GetGraphStatusArgs): Promise<GetGraphStatusResponse> {
  if (isDemoMode) {
    return mockResponses.mockGraphStatus
  }
  return await fetch(`/api/get_graph_status?graph=${args.graph}`, {
    method: 'POST',
    signal: args.controller?.signal,
  }).then((res) => res.json().then((json) => json.data))
}

export async function listAvailableGraphs(
  args: ListAvailableGraphsArgs
): Promise<ListAvailableGraphsResponse> {
  if (isDemoMode) {
    return mockResponses.mockAvailableGraphs
  }
  return await fetch('/api/list_avail_graphs', {
    method: 'POST',
    signal: args.controller?.signal,
  }).then((res) =>
    res.json().then((json) => {
      return json.data.flat()
    })
  )
}

export async function listLabels(args: ListLabelsArgs): Promise<ListLabelsResponse> {
  if (isDemoMode) {
    return mockResponses.mockLabels
  }
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
  if (isDemoMode) {
    return mockResponses.mockPropertyTypes
  }
  return await fetch(`/api/list_property_types?graph=${args.graph}`, {
    method: 'POST',
    signal: args.controller?.signal,
    body: JSON.stringify({
      nodeIDs: args.nodeIDs,
    }),
  }).then((res) =>
    res.json().then((json) => {
      return json.data
    })
  )
}

export async function listEdgeTypes(args: ListEdgeTypesArgs): Promise<ListEdgeTypesResponse> {
  if (isDemoMode) {
    return mockResponses.mockEdgeTypes
  }
  return await fetch(`/api/list_edge_types?graph=${args.graph}`, {
    method: 'POST',
    signal: args.controller?.signal,
    body: JSON.stringify({
      edgeIDs: args.edgeIDs,
    }),
  }).then((res) =>
    res.json().then((json) => {
      return json.data
    })
  )
}

export async function listNodes(args: ListNodesArgs): Promise<ListNodesResponse> {
  if (isDemoMode) {
    return mockResponses.mockNodes
  }
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

export async function getNeighbors(args: GetNeighborsArgs): Promise<GetNeighborsResponse> {
  return await fetch(`/api/get_neighbors?graph=${args.graph}`, {
    method: 'POST',
    signal: args.controller?.signal,
    body: JSON.stringify({
      nodeIDs: args.nodeIDs,
      limitPerNode: args.limitPerNode === undefined ? 100 : args.limitPerNode,
    }),
  }).then((res) =>
    res.text().then((text) => {
      return JSON.parse(text).data
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

export async function getNodeProperties(
  args: GetNodePropertiesArgs
): Promise<GetNodePropertiesResponse> {
  if (isDemoMode) {
    return mockResponses.mockNodeProperties
  }
  return await fetch(`/api/get_node_properties?graph=${args.graph}`, {
    method: 'POST',
    signal: args.controller?.signal,
    body: JSON.stringify({
      nodeIDs: args.nodeIDs,
      properties: args.properties,
    }),
  }).then((res) =>
    res.text().then((text) => {
      return JSON.parse(text).data
    })
  )
}

export async function getNodeEdges(args: GetNodeEdgesArgs): Promise<GetNodeEdgesResponse> {
  if (isDemoMode) {
    return mockResponses.mockNodeEdges
  }
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

export async function exploreNodeEdges(
  args: ExploreNodeEdgesArgs
): Promise<ExploreNodeEdgesResponse> {
  return await fetch(`/api/explore_node_edges?graph=${args.graph}`, {
    method: 'POST',
    signal: args.controller?.signal,
    body: JSON.stringify({
      nodeID: args.nodeID,
      ...(args.limit !== undefined && { limit: args.limit }),
      ...(args.skip !== undefined && { skip: args.skip }),
      ...(args.nodeProperties !== undefined && {
        nodeProperties: args.nodeProperties,
      }),
      ...(args.nodeLabels !== undefined && { nodeProperties: args.nodeLabels }),
      ...(args.edgeTypes !== undefined && { nodeProperties: args.edgeTypes }),
      ...(args.edgeDir === ExploreEdgeDir.Incoming && { excludeOutgoing: true }),
      ...(args.edgeDir === ExploreEdgeDir.Outgoing && { excludeIncoming: true }),
    }),
  }).then((res) =>
    res.text().then((text) => {
      return JSON.parse(text).data
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
