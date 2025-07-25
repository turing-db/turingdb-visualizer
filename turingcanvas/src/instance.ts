import * as THREE from 'three'

import type { Events } from './canvas'

import { BASE_NODE_COLOR } from './colors'
import { TuringEvents } from './events'
import { TuringRenderer } from './renderer'
import { TuringForceEngine } from './simulation'

import {
  type EdgeMap,
  type Edges,
  type NodeMap,
  type Nodes,
  type NodeData,
  type TuringEdge,
  TuringNode,
} from './types'

export class TuringInstance {
  initialized = false
  createTime = Date.now()
  initCount = 0
  nodes: Nodes = []
  selectedNodes = new Map<number, TuringNode>()
  edges: Edges = []
  nodeMap: NodeMap = new Map<number, TuringNode>()
  edgeMap: EdgeMap = new Map<number, TuringEdge>()
  renderer: TuringRenderer
  events: TuringEvents

  whiteColor = new THREE.Color(0xffffff)

  providedEvents!: Events
  canvas!: HTMLCanvasElement
  raycaster!: THREE.Raycaster

  simulation = new TuringForceEngine()

  constructor() {
    try {
      console.log('🔍 TuringInstance constructor starting...')
      this.renderer = new TuringRenderer(this)
      console.log('🔍 TuringRenderer created successfully')
      
      this.events = new TuringEvents(this)  
      console.log('🔍 TuringEvents created successfully')
      console.log('🔍 TuringInstance constructor completed')
    } catch (error) {
      console.error('❌ Error in TuringInstance constructor:', error)
      throw error
    }
  }

  init(canvas: HTMLCanvasElement, events: Events) {
    console.log('🔍 TuringInstance.init starting...')
    this.canvas = canvas

    THREE.ColorManagement.enabled = false

    this.providedEvents = events

    if (!this.initialized) {
      console.log('🔍 Creating controls and raycaster...')
      // Controls
      this.events.createControls()

      // Raycasting
      this.raycaster = new THREE.Raycaster()
    }

    console.log('🔍 Initializing events...')
    this.events.init(events)
    
    console.log('🔍 Initializing renderer...')
    this.renderer.init(this.update.bind(this))

    console.log('🔍 Setting up simulation tick handler...')
    this.simulation.setOnTick(() => {
      this.updatePositions()
    })

    this.initialized = true
    this.initCount++
    console.log('🔍 TuringInstance.init completed successfully!')
    console.log('🔍 Instance state - nodes:', this.nodes.length, 'edges:', this.edges.length)
  }

  hoverNode(n: TuringNode) {
    this.events.hoveredNode = n
  }

  selectNode(n: TuringNode) {
    n.select()
    this.selectedNodes.set(n.id, n)
    this.renderer.updateNodeUniforms(n)
  }

  makePrimary(n: TuringNode) {
    n.makePrimary()
    this.renderer.updateNodeUniforms(n)
  }

  makeSecondary(n: TuringNode) {
    n.makeSecondary()
    this.renderer.updateNodeUniforms(n)
  }

  unselectNode(n: TuringNode) {
    n.unselect()
    this.selectedNodes.delete(n.id)
    this.renderer.updateNodeUniforms(n)
  }

  toggleSelectNode(n: TuringNode) {
    const id = n.id
    n.toggleSelect()

    if (this.selectedNodes.has(id)) {
      this.selectedNodes.delete(id)
    } else {
      this.selectedNodes.set(id, n)
    }

    this.renderer.updateNodeUniforms(n)
  }

  unhoverNode() {
    this.events.hoveredNode = null
  }

  setNodeLabel(n: TuringNode, label: string) {
    const obj = this.renderer.textRenderer.nodeLabels.get(n.id)
    if (obj === undefined) return

    obj.text = label
  }

  setEdgeLabel(e: TuringEdge, label: string) {
    const obj = this.renderer.textRenderer.edgeLabels.get(e.id)
    if (obj === undefined) return

    obj.text = label
  }

  unselectAll() {
    for (const n of this.selectedNodes.values()) {
      n.unselect()
      this.renderer.updateNodeUniforms(n)
    }

    this.selectedNodes.clear()
  }

  setNodeColor(n: TuringNode, color: number | undefined) {
    n.color = color !== undefined ? new THREE.Color(color) : new THREE.Color(BASE_NODE_COLOR)
    this.renderer.updateNodeUniforms(n)
  }

  resetNodeColor(n: TuringNode) {
    n.color = new THREE.Color(BASE_NODE_COLOR)
    this.renderer.updateNodeUniforms(n)
  }

  setNodeOpacity(n: TuringNode, opacity: number) {
    n.opacity = opacity
    this.renderer.updateNodeUniforms(n)
  }

  activateCenterForce(v: boolean) {
    this.simulation.activateCenterForce(v)
  }

  update() {
    this.simulation.tick()

    for (const simulatedNode of this.simulation.getNodes()) {
      const index = simulatedNode.index
      if (index === undefined || simulatedNode.x === undefined || simulatedNode.y === undefined) {
        continue
      }

      const renderedNode = this.nodes[index]
      if (renderedNode === undefined) continue

      renderedNode.x = simulatedNode.x
      renderedNode.y = simulatedNode.y
    }

    this.updatePositions()

    this.events.update()
    this.renderer.update()
  }

  reset() {
    this.nodes = []
    this.nodeMap.clear()
    this.edges = []
    this.edgeMap.clear()
    this.selectedNodes.clear()
    this.simulation.reset()
    this.renderer.reset()
  }

  delNode(id: number) {
    const n = this.nodeMap.get(id)
    if (!n) return

    const index = n.index
    this.renderer.delNode(id)
    this.nodes.splice(index, 1)

    this.nodes.forEach((n, i) => {
      n.index = i
    })

    this.nodeMap.delete(id)
    this.simulation.delNode(index)
  }

  addNodes(
    nodes: {
      id: number
      primary: boolean
      data?: NodeData
    }[]
  ) {
    const turingNodes = [
      ...new Map(
        nodes.map((n) => [
          n.id,
          new TuringNode({
            id: n.id,
            primary: n.primary,
            data: n.data,
          }),
        ])
      ).values(),
    ]

    const firstIndex = this.nodes.length

    turingNodes.forEach((n, i) => {
      n.index = i + firstIndex
      this.nodeMap.set(n.id, n)
      this.renderer.addNode(n.id, n.index)
      this.renderer.updateNodeUniforms(n)
    })

    this.simulation.addNodes(turingNodes)
    this.nodes = this.nodes.concat(turingNodes)
  }

  addEdges(edges: { id: number; src: number; tgt: number; data?: NodeData }[]) {
    const uniqueEdges = [...new Map(edges.map((e) => [e.id, e])).values()]
    const prevSize = this.edges.length

    const newEdges = uniqueEdges
      .map((e, i) => {
        const src = this.nodeMap.get(e.src)
        const tgt = this.nodeMap.get(e.tgt)

        if (!src || !tgt) return

        const edge = {
          id: e.id,
          index: i + prevSize,
          source: src,
          target: tgt,
          data: e.data,
        }

        this.edgeMap.set(e.id, edge)
        return edge
      })
      .filter((e) => e !== undefined)

    for (const e of newEdges) {
      this.renderer.addEdge(e.id, e.index)
    }

    this.edges = this.edges.concat(newEdges)
    this.simulation.addEdges(this.edges.slice(prevSize))
  }

  delEdge(id: number) {
    const e = this.edgeMap.get(id)
    if (!e) return

    const index = e.index
    this.renderer.delEdge(id)
    this.edges.splice(index, 1)
    this.edges.forEach((n, i) => {
      n.index = i
    })
    this.edgeMap.delete(id)
    this.simulation.delEdge(index)
  }

  updatePositions() {
    const edgeScale = 1.0 / Math.sqrt(this.renderer.camera.zoom)
    this.renderer.setMvps(this.nodes, this.edges, edgeScale)
  }

  disconnect() {
    this.events.terminate()
    this.renderer.disconnect()
    console.log('Disconnected')
  }

  terminate() {
    this.disconnect()
    console.log('Terminated')
    //this.initialized = false
  }
}
