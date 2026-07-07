// get_node_edges never carries edge properties (no consumer reads them), so its
// edges are a leaner tuple than EdgeEntry — no properties slot.
export type NodeEdge = [id: number, src: number, tgt: number, edgeTypeID: number]

export type GetNodeEdgesResponse = {
  [nodeID: number]: {
    outs: NodeEdge[]
    ins: NodeEdge[]
    outEdgeCounts: { [edgeTypeID: number]: number }
    inEdgeCounts: { [edgeTypeID: number]: number }
  }
}

export type GetNodeEdgeIDsResponse = {
  [nodeID: number]: {
    outs: { edgeID: number; tgtID: number }[]
    ins: { edgeID: number; srcID: number }[]
    outEdgeCounts: { [edgeTypeID: number]: number }
    inEdgeCounts: { [edgeTypeID: number]: number }
  }
}
