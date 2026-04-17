import type { NodeEntry } from '@/api/models/nodeEntry.model'
import { createRef, type MutableRefObject } from 'react'
import { create } from 'zustand'
import { EntityCache } from '@/utils/entity-cache'
import { NeighbourMap } from '@/utils/neighbour-map'
import { ProxyRef } from '@/utils/proxy-ref'

export type TEdge = {
  id: number
  source: number
  target: number
}

export type InspectNodeInfo = {
  nodeID: number
}

export type VisNodes = Map<number, NodeEntry>
export type TEdges = { [id: string]: TEdge }

export type GraphNodeEntry = {
  inNeighbours: { edgeID: number; srcID: number }[]
  outNeighbours: { edgeID: number; tgtID: number }[]
}

export type VisStore = {
  entityCache: EntityCache
  neighbourhood: NeighbourMap

  hiddenNodes: Set<number>

  inspectNodeInfo: InspectNodeInfo | undefined
  isNodeInspectorExtended: boolean
  nodeInspectorExtendedWidth: number
  nodeInspectorCollapsedWidth: number
  graphLoading: boolean
  isHierarchyBrowserOpen: boolean
  hierarchyBrowserWidth: number
  inspectNode: (nodeID: number) => void
  closeInspectNodePanel: () => void
  setNodeInspectorExtended: (extended: boolean) => void
  setNodeInspectorExtendedWidth: (width: number) => void
  setNodeInspectorCollapsedWidth: (width: number) => void
  setGraphLoading: (v: boolean) => void
  setHierarchyBrowserOpen: (v: boolean) => void
  setHierarchyBrowserWidth: (v: number) => void
}

export const HIERARCHY_BROWSER_DEFAULT_WIDTH = 320
export const HIERARCHY_BROWSER_MIN_WIDTH = 240
export const HIERARCHY_BROWSER_MAX_WIDTH = 600

export const NODE_INSPECTOR_COLLAPSED_DEFAULT_WIDTH = 250
export const NODE_INSPECTOR_EXTENDED_DEFAULT_WIDTH = 450
export const NODE_INSPECTOR_COLLAPSED_MIN_WIDTH = 200
export const NODE_INSPECTOR_COLLAPSED_MAX_WIDTH = 450
export const NODE_INSPECTOR_EXTENDED_MIN_WIDTH = 280
export const NODE_INSPECTOR_EXTENDED_MAX_WIDTH = 800

export const useVisStore = create<VisStore>((set) => {
  let graphLoadingOffTimer: ReturnType<typeof setTimeout> | null = null

  const entityCacheRef = createRef<EntityCache>() as MutableRefObject<EntityCache>
  entityCacheRef.current = new EntityCache()

  const neighbourhoodRef = createRef<NeighbourMap>() as MutableRefObject<NeighbourMap>
  neighbourhoodRef.current = new NeighbourMap()

  const hiddenNodesRef = createRef<Set<number>>() as MutableRefObject<Set<number>>
  hiddenNodesRef.current = new Set()

  function createNeighbourhoodRef(ref: MutableRefObject<NeighbourMap>) {
    const proxy = ProxyRef.create<NeighbourMap>(() => ref.current)
    const trigger = () => {
      set(() => ({ neighbourhood: createNeighbourhoodRef(neighbourhoodRef) }))
    }

    proxy.hook('addNeighbour', trigger)
    proxy.hook('del', trigger)
    proxy.hook('delNeighbour', trigger)
    proxy.hook('reset', trigger)
    proxy.hook('add', trigger)

    return proxy
  }

  function createHiddenNodesRef(ref: MutableRefObject<Set<number>>) {
    const proxy = ProxyRef.create<Set<number>>(() => ref.current)
    const trigger = () => {
      set(() => ({ hiddenNodes: createHiddenNodesRef(hiddenNodesRef) }))
    }

    proxy.hook('add', trigger)
    proxy.hook('delete', trigger)
    proxy.hook('clear', trigger)

    return proxy
  }

  return {
    entityCache: ProxyRef.create<EntityCache>(() => entityCacheRef.current),
    neighbourhood: createNeighbourhoodRef(neighbourhoodRef),
    hiddenNodes: createHiddenNodesRef(hiddenNodesRef),

    inspectNodeInfo: undefined,
    isNodeInspectorExtended: false,
    nodeInspectorExtendedWidth: NODE_INSPECTOR_EXTENDED_DEFAULT_WIDTH,
    nodeInspectorCollapsedWidth: NODE_INSPECTOR_COLLAPSED_DEFAULT_WIDTH,
    graphLoading: false,
    isHierarchyBrowserOpen: false,
    hierarchyBrowserWidth: HIERARCHY_BROWSER_DEFAULT_WIDTH,
    setHierarchyBrowserOpen: (v: boolean) => set(() => ({ isHierarchyBrowserOpen: v })),
    setHierarchyBrowserWidth: (v: number) =>
      set(() => ({
        hierarchyBrowserWidth: Math.max(
          HIERARCHY_BROWSER_MIN_WIDTH,
          Math.min(HIERARCHY_BROWSER_MAX_WIDTH, v)
        ),
      })),
    setGraphLoading: (v: boolean) => {
      // Hysteresis: turn the spinner on immediately, but debounce turning it
      // off so multiple back-to-back effect runs (e.g. reset followed by add)
      // don't cause the spinner to flicker off in between.
      if (v) {
        if (graphLoadingOffTimer) {
          clearTimeout(graphLoadingOffTimer)
          graphLoadingOffTimer = null
        }
        set(() => ({ graphLoading: true }))
      } else {
        if (graphLoadingOffTimer) clearTimeout(graphLoadingOffTimer)
        graphLoadingOffTimer = setTimeout(() => {
          graphLoadingOffTimer = null
          set(() => ({ graphLoading: false }))
        }, 250)
      }
    },
    inspectNode: (nodeID: number) => set(() => ({ inspectNodeInfo: { nodeID } })),
    closeInspectNodePanel: () => set(() => ({ inspectNodeInfo: undefined })),
    setNodeInspectorExtended: (extended: boolean) => set(() => ({ isNodeInspectorExtended: extended })),
    setNodeInspectorExtendedWidth: (width: number) =>
      set(() => ({
        nodeInspectorExtendedWidth: Math.max(
          NODE_INSPECTOR_EXTENDED_MIN_WIDTH,
          Math.min(NODE_INSPECTOR_EXTENDED_MAX_WIDTH, width)
        ),
      })),
    setNodeInspectorCollapsedWidth: (width: number) =>
      set(() => ({
        nodeInspectorCollapsedWidth: Math.max(
          NODE_INSPECTOR_COLLAPSED_MIN_WIDTH,
          Math.min(NODE_INSPECTOR_COLLAPSED_MAX_WIDTH, width)
        ),
      })),
  }
})

export default useVisStore
