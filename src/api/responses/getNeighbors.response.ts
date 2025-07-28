import type { NeighborEdge } from '../models/neighborEdge.model'

export type GetNeighborsResponse = {
  [nodeID: string]: {
    outs: {
      edges: {
        [edgeID: string]: NeighborEdge
      }
      reachedEnd: boolean
    }

    ins: {
      edges: {
        [edgeID: string]: NeighborEdge
      }
      reachedEnd: boolean
    }
  }
}
