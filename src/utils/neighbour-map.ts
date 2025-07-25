import { getNodeEdgeIDs } from '@/api'
import type { GetNodeEdgeIDsResponse } from '@/api/responses'

export type NeighbourEntry = {
  ins: { edgeID: number; srcID: number }[]
  outs: { edgeID: number; tgtID: number }[]
  outEdgeCounts: { [edgeTypeID: number]: number }
  inEdgeCounts: { [edgeTypeID: number]: number }
}

export class NeighbourMap extends Map<number, NeighbourEntry> {
  graph = ''
  countPerPage = 10

  reset(graph: string) {
    this.graph = graph
    this.clear()
  }

  async add(nodeIDs: number[]) {
    const data = (await getNodeEdgeIDs({
      graph: this.graph,
      nodeIDs: nodeIDs,
      defaultLimit: this.countPerPage,
    })) as GetNodeEdgeIDsResponse

    for (const [id, entry] of Object.entries(data)) {
      this.set(Number.parseInt(id), entry)
    }
  }

  async newNeighbours(nodeIDs: number[]) {
    const args = nodeIDs
      .map((id) => {
        const n = this.get(id)
        if (!n) return { id, lim: 0 }

        const retrievedCount = n.ins.length + n.outs.length
        const nodeEdgeCount =
          Object.values(n.outEdgeCounts).reduce((a, b) => a + b, 0) +
          Object.values(n.inEdgeCounts).reduce((a, b) => a + b, 0)

        if (retrievedCount === nodeEdgeCount) {
          return { id, lim: 0 }
        }

        return { id, lim: (Math.ceil(retrievedCount / this.countPerPage) + 1) * this.countPerPage }
      })
      .filter((d) => d.lim !== 0)

    for (const { id, lim } of args) {
      const data = (await getNodeEdgeIDs({
        graph: this.graph,
        nodeIDs: [id],
        defaultLimit: lim,
      })) as GetNodeEdgeIDsResponse

      for (const [id, entry] of Object.entries(data)) {
        this.set(Number.parseInt(id), entry)
      }
    }
  }

  del(nodeIDs: number[]) {
    for (const id of nodeIDs) {
      this.delete(id)
    }
  }

  delNeighbour(nodeIDs: number[]) {
    for (const neighbour of this.values()) {
      neighbour.ins = neighbour.ins.filter((e) => !nodeIDs.includes(e.srcID))
      neighbour.outs = neighbour.outs.filter((e) => !nodeIDs.includes(e.tgtID))
    }
  }
}

export class NeighbourMapProxy {
  get: () => NeighbourMap

  constructor(get: () => NeighbourMap) {
    this.get = get
  }
}
