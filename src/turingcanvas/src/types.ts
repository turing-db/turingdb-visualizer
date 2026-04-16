import * as THREE from 'three'
import { BASE_NODE_COLOR } from './colors'
import type { TuringInstance } from './instance'

export type NodeShape = 'octagon' | 'rounded-rect'

export enum EntityState {
  None = 0,
  Secondary = 1 << 0,
  Hovered = 1 << 1,
  Selected = 1 << 2,
}

// biome-ignore lint/suspicious/noExplicitAny: Fixing fix would require The instance to be generic
export type NodeData = any

export class TuringNode {
  id: number
  index: number
  x: number
  y: number
  state: EntityState
  opacity: number
  color: THREE.Color
  data?: NodeData
  labelWidth: number
  labelHeight: number

  constructor(args: {
    id: number
    primary: boolean
    index?: number
    x?: number
    y?: number
    color?: THREE.Color
    data?: NodeData
  }) {
    this.id = args.id
    this.state = args.primary ? EntityState.None : EntityState.Secondary
    this.index = args.index !== undefined ? args.index : 0
    this.x = args.x !== undefined ? args.x : 0
    this.y = args.y !== undefined ? args.y : 0
    this.color = args.color || new THREE.Color(BASE_NODE_COLOR)
    this.opacity = 1
    this.data = args.data
    this.labelWidth = 1.4
    this.labelHeight = 1.1
  }

  isSelected() {
    return (this.state & EntityState.Selected) === EntityState.Selected
  }

  isHovered() {
    return (this.state & EntityState.Hovered) === EntityState.Hovered
  }

  isPrimary() {
    return (this.state & EntityState.Secondary) !== EntityState.Secondary
  }

  isSecondary() {
    return (this.state & EntityState.Secondary) === EntityState.Secondary
  }

  toggleSelect() {
    this.state ^= EntityState.Selected
  }

  select() {
    this.state |= EntityState.Selected
  }

  unselect() {
    this.state &= ~EntityState.Selected
  }

  hover() {
    this.state |= EntityState.Hovered
  }

  unhover() {
    this.state &= ~EntityState.Hovered
  }

  makeSecondary() {
    this.state |= EntityState.Secondary
  }

  makePrimary() {
    this.state &= ~EntityState.Secondary
  }
}

export type TuringEdge = {
  id: number
  index: number
  source: TuringNode
  target: TuringNode
  data?: NodeData
}

export type Nodes = TuringNode[]
export type Edges = TuringEdge[]
export type NodeMap = Map<number, TuringNode>
export type EdgeMap = Map<number, TuringEdge>

export type MouseEventData = {
  event: MouseEvent
  n?: TuringNode
  e?: TuringEdge
}

export type NodeDragEventData = {
  event: MouseEvent
  nodes: TuringNode[]
}

export type NodeSelectEventData = {
  event: MouseEvent
  selectedNodeIDs: number[]
}

export class CanvasNodeDragEvent extends CustomEvent<NodeDragEventData> {
  constructor(d: NodeDragEventData) {
    super('canvasnodedrag', { detail: d })
  }
}

export class CanvasNodeSelectEvent extends CustomEvent<NodeSelectEventData> {
  constructor(d: NodeSelectEventData) {
    super('canvasnodeselect', { detail: d })
  }
}

export class CanvasMouseDownEvent extends CustomEvent<MouseEventData> {
  constructor(d: MouseEventData) {
    super('canvasmousedown', { detail: d })
  }
}

export class CanvasMouseUpEvent extends CustomEvent<MouseEventData> {
  constructor(d: MouseEventData) {
    super('canvasmouseup', { detail: d })
  }
}

export class CanvasSingleClickEvent extends CustomEvent<MouseEventData> {
  constructor(d: MouseEventData) {
    super('canvassingleclick', { detail: d })
  }
}

export class CanvasDoubleClickEvent extends CustomEvent<MouseEventData> {
  constructor(d: MouseEventData) {
    super('canvasdoubleclick', { detail: d })
  }
}

export class CanvasContextMenuEvent extends CustomEvent<MouseEventData> {
  constructor(d: MouseEventData) {
    super('canvascontextmenu', { detail: d })
  }
}

export interface TuringCustomEventMap {
  canvasnodedrag: CanvasNodeDragEvent
  canvasnodeselect: CanvasNodeSelectEvent
  canvasmousedown: CanvasMouseDownEvent
  canvasmouseup: CanvasMouseUpEvent
  canvassingleclick: CanvasSingleClickEvent
  canvasdoubleclick: CanvasDoubleClickEvent
  canvascontextmenu: CanvasContextMenuEvent
}

export type TuringCustomEventName = keyof TuringCustomEventMap
export type TuringCustomEvent<K extends TuringCustomEventName> = TuringCustomEventMap[K]

export type TuringUserEvents = {
  [K in TuringCustomEventName]: TuringCustomEventFunc<K>
}

const getTuringCustomEventNames = () => {
  const events: TuringUserEvents = {
    canvasnodedrag: () => {},
    canvasnodeselect: () => {},
    canvasmousedown: () => {},
    canvasmouseup: () => {},
    canvassingleclick: () => {},
    canvasdoubleclick: () => {},
    canvascontextmenu: () => {},
  }
  return Object.keys(events) as TuringCustomEventName[]
}

export const TuringCustomEventNames = getTuringCustomEventNames()

export type PartialTuringUserEvents = Partial<TuringUserEvents>

export type TuringCustomEventFunc<K extends TuringCustomEventName> = (
  ev: TuringCustomEventMap[K]
) => void

declare global {
  interface HTMLCanvasElement {
    addEventListener<K extends TuringCustomEventName>(
      type: K,
      listener: (this: Document, ev: TuringCustomEventMap[K]) => void
    ): void
    removeEventListener<K extends TuringCustomEventName>(
      type: K,
      listener: (this: Document, ev: TuringCustomEventMap[K]) => void
    ): void
    dispatchEvent<K extends keyof TuringCustomEventMap>(ev: TuringCustomEventMap[K]): void
  }
}

export type AddNodesArgs = Parameters<TuringInstance['addNodes']>
export type AddEdgesArgs = Parameters<TuringInstance['addEdges']>
export type DelNodeArgs = Parameters<TuringInstance['delNode']>
//export type DelEdgeArgs = Parameters<TuringInstance['delEdge']>
export type SelectNodeArgs = Parameters<TuringInstance['selectNode']>
export type UnselectNodeArgs = Parameters<TuringInstance['unselectNode']>
export type ToggleSelectNodeArgs = Parameters<TuringInstance['toggleSelectNode']>
export type MakePrimaryArgs = Parameters<TuringInstance['makePrimary']>
export type SetNodeLabelArgs = Parameters<TuringInstance['setNodeLabel']>
export type SetEdgeLabelArgs = Parameters<TuringInstance['setEdgeLabel']>
export type SetNodeColorArgs = Parameters<TuringInstance['setNodeColor']>
export type ActiveCenterForceArgs = Parameters<TuringInstance['activateCenterForce']>
export type SetNodeShapeArgs = Parameters<TuringInstance['setNodeShape']>
