import * as d3 from 'd3'
import type { TuringEdge, TuringNode } from './types'

export type SimNode = d3.SimulationNodeDatum
export type SimEdge = d3.SimulationLinkDatum<SimNode>

export const getCounts = (edges: SimEdge[]) => {
  const counts = new Map<number, number>()

  for (const e of edges) {
    const src = e.source as SimNode
    const srcID = src.index
    if (srcID === undefined) continue

    if (!counts.has(srcID)) {
      counts.set(srcID, 1)
    } else {
      const count = counts.get(srcID)
      if (count === undefined) continue
      counts.set(srcID, count + 1)
    }

    const tgt = e.target as SimNode
    const tgtID = tgt.index
    if (tgtID === undefined) continue

    if (!counts.has(tgtID)) {
      counts.set(tgtID, 1)
    } else {
      const count = counts.get(tgtID)
      if (count === undefined) continue
      counts.set(tgtID, count + 1)
    }
  }

  return counts
}

const createForceLink = (edges: SimEdge[]) => {
  return d3.forceLink(edges).distance(2.5).iterations(1)
}

const createForceSimulation = (nodes: SimNode[], edges: SimEdge[], centerForce = true) => {
  const f = d3.forceSimulation(nodes)

  f.force('link', createForceLink(edges))
  f.force('repulsion', d3.forceManyBody().strength(-3).theta(0.99))

  if (centerForce) {
    f.force('x', d3.forceX().strength(0.1))
    f.force('y', d3.forceY().strength(0.1))
  }

  return f
}

type ForceSimulation = ReturnType<typeof createForceSimulation>

export class TuringForceEngine {
  sim: ForceSimulation
  nodes: SimNode[] = []
  edges: SimEdge[] = []
  onTick = () => {}
  centerForce = true

  constructor() {
    this.sim = createForceSimulation(this.nodes, this.edges, this.centerForce)
    this.alphaTarget(0.0)
  }

  reset() {
    this.nodes = []
    this.edges = []

    this.sim = createForceSimulation(this.nodes, this.edges, this.centerForce)
  }

  addNode(node: TuringNode) {
    this.nodes.push({
      index: node.index,
      x: node.x,
      y: node.y,
    })
    this.sim.nodes(this.nodes)

    this.alpha(0.2)
  }

  addNodes(nodes: TuringNode[]) {
    if (nodes.length === 0) return

    this.nodes = this.nodes.concat(nodes.map((n) => ({ index: n.index, x: n.x, y: n.y })))
    this.sim.nodes(this.nodes)
    this.alpha(0.2)
  }

  delNode(index: number) {
    this.nodes.splice(index, 1)

    this.nodes.forEach((n, i) => {
      n.index = i
    })

    this.sim.nodes(this.nodes)
    this.alpha(0.2)
  }

  addEdge(edge: TuringEdge) {
    this.edges.push({
      index: edge.index,
      source: this.nodes[edge.source.index],
      target: this.nodes[edge.target.index],
    })
    this.sim.force('link', createForceLink(this.edges))
    this.alpha(0.2)
  }

  delEdge(index: number) {
    this.edges.splice(index, 1)

    this.edges.forEach((e, i) => {
      e.index = i
    })

    this.sim.force('link', createForceLink(this.edges))
    this.alpha(0.2)
  }

  addEdges(edges: TuringEdge[]) {
    if (edges.length === 0) return

    this.edges = this.edges.concat(
      edges.map((e) => ({
        index: e.index,
        source: this.nodes[e.source.index],
        target: this.nodes[e.target.index],
      }))
    )
    this.sim.force('link', createForceLink(this.edges))
    this.alpha(0.2)
  }

  setEdges(edges: SimEdge[]) {
    this.edges = edges
    this.sim.force('link', createForceLink(this.edges))
    this.alpha(0.2)
  }

  setOnTick(func: () => void) {
    this.onTick = func
    this.sim.on('tick', func)
  }

  activateCenterForce(v: boolean) {
    this.centerForce = v
    this.sim.stop()
    this.sim = createForceSimulation(this.nodes, this.edges, this.centerForce)
  }

  getNodes() {
    return this.sim.nodes()
  }

  getEdges() {
    return this.edges
  }

  tick() {
    this.sim.tick(1)
  }

  alpha(v: number) {
    this.sim.alpha(v)
  }

  alphaTarget(v: number) {
    this.sim.alphaTarget(v).restart()
  }
}
