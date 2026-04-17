import * as THREE from 'three'

import type { NodeData } from 'three/webgpu'
import type { Events } from './canvas'

import { BASE_NODE_COLOR } from './colors'
import { TuringEvents } from './events'
import { TuringRenderer } from './renderer'
import { TuringForceEngine } from './simulation'

import {
  type EdgeMap,
  type Edges,
  type NodeMap,
  type NodeShape,
  type Nodes,
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
  autoFitUntil = 0
  autoFitControlsBound = false
  focusNodeId: number | null = null
  focusUntil = 0
  focusControlsBound = false
  nodeShape: NodeShape = 'octagon'
  renderer: TuringRenderer
  events: TuringEvents

  whiteColor = new THREE.Color(0xffffff)

  providedEvents!: Events
  canvas!: HTMLCanvasElement
  raycaster!: THREE.Raycaster

  simulation = new TuringForceEngine()

  constructor() {
    this.renderer = new TuringRenderer(this)
    this.events = new TuringEvents(this)
  }

  init(canvas: HTMLCanvasElement, events: Events) {
    console.log('Initializing')
    this.canvas = canvas

    THREE.ColorManagement.enabled = false

    this.providedEvents = events

    if (!this.initialized) {
      // Controls
      this.events.createControls()

      // Raycasting
      this.raycaster = new THREE.Raycaster()
    }

    this.events.init(events)
    this.renderer.init(this.update.bind(this))

    this.initialized = true
    this.initCount++
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
    // Size the rect up-front from a synchronous char-count estimate so the
    // text is never clipped during the window before troika finishes layout.
    this.renderer.textRenderer.applyEstimatedSize(label, n)
    obj.sync(() => {
      this.renderer.textRenderer.measureLabel(obj, n)
    })
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

  setNodeShape(shape: NodeShape) {
    this.nodeShape = shape
    this.renderer.setNodeShape(shape)
    this.renderer.textRenderer.setNodeShape(shape, this.nodeMap)
  }

  fitView(padding = 1.2) {
    if (this.nodes.length === 0) return

    // Calculate bounding box of all nodes
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (const node of this.nodes) {
      minX = Math.min(minX, node.x)
      maxX = Math.max(maxX, node.x)
      minY = Math.min(minY, node.y)
      maxY = Math.max(maxY, node.y)
    }

    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const width = (maxX - minX) || 1
    const height = (maxY - minY) || 1

    // Calculate zoom to fit all nodes
    const camera = this.renderer.camera
    const viewWidth = camera.right - camera.left
    const viewHeight = camera.bottom - camera.top

    const zoomX = viewWidth / (width * padding)
    const zoomY = viewHeight / (height * padding)
    const zoom = Math.min(zoomX, zoomY, 1) // Cap at 1 to avoid over-zooming

    // Update camera position and zoom
    camera.position.x = centerX
    camera.position.y = centerY
    camera.zoom = zoom
    camera.updateProjectionMatrix()

    // Update controls target
    this.events.controls.target.set(centerX, centerY, 0)
    this.events.controls.update()
  }

  autoFit(durationMs: number) {
    this.autoFitUntil = performance.now() + durationMs

    if (!this.autoFitControlsBound) {
      this.events.controls.addEventListener('start', () => {
        this.autoFitUntil = 0
      })
      this.autoFitControlsBound = true
    }
  }

  focusView(id: number, zoom = 1) {
    const n = this.nodeMap.get(id)
    if (!n) return

    const camera = this.renderer.camera
    camera.position.x = n.x
    camera.position.y = n.y
    camera.zoom = zoom
    camera.updateProjectionMatrix()

    this.events.controls.target.set(n.x, n.y, 0)
    this.events.controls.update()
  }

  focusNode(id: number, durationMs: number) {
    this.focusNodeId = id
    this.focusUntil = performance.now() + durationMs
    // Cancel any in-flight autoFit so the two don't fight each frame.
    this.autoFitUntil = 0

    if (!this.focusControlsBound) {
      this.events.controls.addEventListener('start', () => {
        this.focusUntil = 0
      })
      this.focusControlsBound = true
    }
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

    if (performance.now() < this.autoFitUntil) {
      this.fitView()
    } else if (this.focusNodeId !== null && performance.now() < this.focusUntil) {
      this.focusView(this.focusNodeId)
    }

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
