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

  /**
   * Replace the whole map with exactly this subgraph: these nodes, and only the
   * given edges between them. `add` would instead pull in up to `countPerPage`
   * neighbours of every node, which for a 171-vertex geodesic is ~1,000 nodes of
   * context burying the path. Edge counts are left empty, so double-clicking a
   * node still expands its real neighbourhood through `newNeighbours`.
   */
  setSubgraph(graph: string, nodeIDs: number[], edges: Array<[edgeID: number, src: number, tgt: number]>) {
    this.graph = graph
    this.clear()
    const entry = (): NeighbourEntry => ({ ins: [], outs: [], outEdgeCounts: {}, inEdgeCounts: {} })
    for (const id of nodeIDs) this.set(id, entry())
    for (const [edgeID, src, tgt] of edges) {
      if (!this.has(src) || !this.has(tgt)) continue
      this.get(src)!.outs.push({ edgeID, tgtID: tgt })
      this.get(tgt)!.ins.push({ edgeID, srcID: src })
    }
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
