import type { EdgeEntry } from '../models/edgeEntry.model'

export type GetNodeEdgesResponse = {
  [nodeID: number]: {
    outs: EdgeEntry[]
    ins: EdgeEntry[]
    outEdgeCounts: { [edgeTypeID: number]: number }
    inEdgeCounts: { [edgeTypeID: number]: number }
  }
}

export type GetNodeEdgeIDsRawResponse = {
  [nodeID: number]: {
    outs: [number, number][]
    ins: [number, number][]
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
