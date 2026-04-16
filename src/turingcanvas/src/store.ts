import type { MutableRefObject } from 'react'
import type {
  ActiveCenterForceArgs as ActivateCenterForceArgs,
  AddEdgesArgs,
  AddNodesArgs,
  DelNodeArgs,
  EdgeMap,
  MakePrimaryArgs,
  NodeMap,
  SelectNodeArgs,
  SetEdgeLabelArgs,
  SetNodeColorArgs,
  SetNodeLabelArgs,
  ToggleSelectNodeArgs,
  TuringEdge,
  TuringInstance,
  TuringNode,
  UnselectNodeArgs,
} from './'

import { create } from 'zustand'

type TrackedState = 'nodes' | 'nodeMap' | 'edges' | 'edgeMap' | 'selectedNodes' | 'centerForce'
type TuringInstanceRef = MutableRefObject<TuringInstance | undefined>

export type CanvasStore = {
  instance: TuringInstanceRef

  nodes: () => TuringNode[]
  selectedNodes: () => Map<number, TuringNode>
  nodeMap: () => NodeMap
  edges: () => TuringEdge[]
  edgeMap: () => EdgeMap
  centerForce: () => boolean

  actions: {
    addNodes: (...args: AddNodesArgs) => void
    addEdges: (...args: AddEdgesArgs) => void
    addEntities: (nodes: AddNodesArgs[0], edges: AddEdgesArgs[0]) => void
    delNode: (...args: DelNodeArgs) => void
    reset: () => void
    selectNode: (...args: SelectNodeArgs) => void
    unselectNode: (...args: UnselectNodeArgs) => void
    toggleSelectNode: (...args: ToggleSelectNodeArgs) => void
    unselectAll: () => void
    makePrimary: (...args: MakePrimaryArgs) => void
    setNodeLabel: (...args: SetNodeLabelArgs) => void
    setEdgeLabel: (...args: SetEdgeLabelArgs) => void
    activateCenterForce: (...args: ActivateCenterForceArgs) => void
    fitView: (padding?: number) => void
    autoFit: (durationMs: number) => void
  }

  resetStates: (...args: TrackedState[]) => void
}

export type CanvasStoreApi = ReturnType<typeof createCanvasStore>

export const createCanvasStore = (instance: TuringInstance) => {
  const instanceRef: TuringInstanceRef = { current: instance }

  return create<CanvasStore>((set, get) => ({
    instance: instanceRef,

    nodes: () => instanceRef.current?.nodes || [],
    selectedNodes: () => instanceRef.current?.selectedNodes || new Map(),
    edges: () => instanceRef.current?.edges || [],
    nodeMap: () => instanceRef.current?.nodeMap || new Map<number, TuringNode>(),
    edgeMap: () => instanceRef.current?.edgeMap || new Map<number, TuringEdge>(),
    centerForce: () => (instanceRef.current ? instanceRef.current.simulation.centerForce : true),
    actions: {
      addNodes: (...args: AddNodesArgs) => {
        const nodes = args[0]
        if (nodes.length === 0) return
        instanceRef.current?.addNodes(nodes)
        get().resetStates('nodes', 'nodeMap', 'selectedNodes')
      },

      delNode: (...args: DelNodeArgs) => {
        const nodeID = args[0]
        instanceRef.current?.delNode(nodeID)
        get().resetStates('nodes', 'nodeMap', 'selectedNodes')
      },

      addEdges: (...args: AddEdgesArgs) => {
        const edges = args[0]
        if (edges.length === 0) return
        instanceRef.current?.addEdges(edges)
        get().resetStates('edges', 'edgeMap')
      },

      addEntities: (nodes: AddNodesArgs[0], edges: AddEdgesArgs[0]) => {
        if (nodes.length === 0 && edges.length === 0) return
        instanceRef.current?.addNodes(nodes)
        instanceRef.current?.addEdges(edges)
        get().resetStates('nodes', 'nodeMap', 'selectedNodes', 'edges', 'edgeMap')
      },

      reset: () => {
        instanceRef.current?.reset()
        get().resetStates('nodes', 'nodeMap', 'selectedNodes', 'edges', 'edgeMap')
      },

      selectNode: (...args: SelectNodeArgs) => {
        instanceRef.current?.selectNode(...args)
        get().resetStates('selectedNodes')
      },

      unselectNode: (...args: UnselectNodeArgs) => {
        instanceRef.current?.unselectNode(...args)
        get().resetStates('selectedNodes')
      },

      toggleSelectNode: (...args: ToggleSelectNodeArgs) => {
        instanceRef.current?.toggleSelectNode(...args)
        get().resetStates('selectedNodes')
      },

      unselectAll: () => {
        instanceRef.current?.unselectAll()
        get().resetStates('selectedNodes')
      },

      makePrimary: (...args: MakePrimaryArgs) => {
        instanceRef.current?.makePrimary(...args)
      },

      setNodeLabel: (...args: SetNodeLabelArgs) => {
        instanceRef.current?.setNodeLabel(...args)
      },

      setEdgeLabel: (...args: SetEdgeLabelArgs) => {
        instanceRef.current?.setEdgeLabel(...args)
      },

      setNodeColor: (...args: SetNodeColorArgs) => {
        instanceRef.current?.setNodeColor(...args)
      },

      activateCenterForce: (...args: ActivateCenterForceArgs) => {
        instanceRef.current?.activateCenterForce(...args)
        get().resetStates('centerForce')
      },

      fitView: (padding?: number) => {
        instanceRef.current?.fitView(padding)
      },

      autoFit: (durationMs: number) => {
        instanceRef.current?.autoFit(durationMs)
      },
    },

    resetStates: (...states: TrackedState[]) => {
      // Prepare a partial state update object
      const updatedState = states.reduce(
        (acc, stateKey) => {
          switch (stateKey) {
            case 'nodes':
              acc.nodes = () => instanceRef.current?.nodes || []
              break
            case 'nodeMap':
              acc.nodeMap = () => instanceRef.current?.nodeMap || new Map<number, TuringNode>()
              break
            case 'edges':
              acc.edges = () => instanceRef.current?.edges || []
              break
            case 'edgeMap':
              acc.edgeMap = () => instanceRef.current?.edgeMap || new Map<number, TuringEdge>()
              break
            case 'selectedNodes':
              acc.selectedNodes = () => instanceRef.current?.selectedNodes || new Map()
              break
            case 'centerForce':
              acc.centerForce = () =>
                instanceRef.current ? instanceRef.current.simulation.centerForce : true
              break
            default:
              break
          }
          return acc
        },
        {} as Partial<CanvasStore>
      )

      // Update the store only with the changed states
      set(updatedState)
    },
  }))
}
