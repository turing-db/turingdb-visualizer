import { useCallback, useEffect, useMemo } from 'react'

import { useInitState } from './useinitstate'
import type { EdgeEntry } from '@/api/models/edgeEntry.model'
import { useAppStore, useCanvasStore } from '@/stores'
import useGraphInfo from './use-graph-info'

export const useCanvasEdgeLabels = () => {
  const [showingEdgeLabel, setShowingEdgeLabel, initShowingEdgeLabel] = useInitState('Edge types')
  const graphName = useAppStore((state) => state.graphName)
  const graph = useGraphInfo(graphName)
  const getTuringEdges = useCanvasStore((state) => state.edges)
  const turingActions = useCanvasStore((state) => state.actions)

  initShowingEdgeLabel('Edge types')

  const edges = useMemo(() => {
    return getTuringEdges()
  }, [getTuringEdges])

  const edgeLabels = useMemo(() => {
    const defaultLabels = ['None', 'Edge IDs', 'Edge types']
    const info = graph.info

    if (!info) return defaultLabels

    // Edge properties are keyed by name, so their keys are the property-type
    // names directly.
    const edgePropertyTypes = new Set(
      edges.flatMap((e) => {
        const props = (e.data as EdgeEntry)[4]
        return props ? Object.keys(props) : []
      })
    )

    return [...defaultLabels, ...edgePropertyTypes]
  }, [graph.info, edges])

  const applyNone = useCallback(() => {
    for (const e of edges) {
      turingActions.setEdgeLabel(e, '')
    }
  }, [edges, turingActions])

  const applyEdgeIDs = useCallback(() => {
    for (const e of edges) {
      turingActions.setEdgeLabel(e, e.id.toString())
    }
  }, [edges, turingActions])

  const applyEdgeTypes = useCallback(() => {
    if (!graph.info) return

    for (const e of edges) {
      const edgeData = e.data as EdgeEntry
      const edgeTypeID = edgeData[3]
      turingActions.setEdgeLabel(e, graph.info.edgeTypes[edgeTypeID])
    }
  }, [edges, turingActions, graph.info])

  const applyPropertyType = useCallback(() => {
    // showingEdgeLabel is the property-type name, and edge properties are keyed
    // by name, so index directly.
    for (const e of edges) {
      const properties = (e.data as EdgeEntry)[4]
      const propValue = properties?.[showingEdgeLabel]
      turingActions.setEdgeLabel(e, propValue !== undefined ? propValue.toString() : '')
    }
  }, [edges, showingEdgeLabel, turingActions])

  useEffect(() => {
    switch (showingEdgeLabel) {
      case 'None':
        applyNone()
        break

      case 'Edge IDs':
        applyEdgeIDs()
        break

      case 'Edge types':
        applyEdgeTypes()
        break

      default:
        applyPropertyType()
        break
    }
  }, [applyPropertyType, applyEdgeTypes, applyEdgeIDs, applyNone, showingEdgeLabel])

  return {
    edgeLabels,
    showingEdgeLabel,
    setShowingEdgeLabel,
  }
}
