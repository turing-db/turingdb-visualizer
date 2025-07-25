import { useCallback, useEffect, useMemo } from 'react'

import { useInitState } from './useinitstate'
import type { EdgeEntry } from '@/api/models/edgeEntry.model'
import { useAppStore, useCanvasStore } from '@/stores'
import useGraphInfo from './use-graph-info'

export const useCanvasEdgeLabels = () => {
  const [showingEdgeLabel, setShowingEdgeLabel, initShowingEdgeLabel] = useInitState('Edge types')
  const graphName = useAppStore((state) => state.graphName)
  const graph = useGraphInfo(graphName)
  const getTuringEdges = useCanvasStore((state: any) => state.edges)
  const turingActions = useCanvasStore((state: any) => state.actions)

  initShowingEdgeLabel('Edge types')

  const edges = useMemo(() => {
    return getTuringEdges()
  }, [getTuringEdges])

  const edgeLabels = useMemo(() => {
    const defaultLabels = ['None', 'Edge IDs', 'Edge types']
    const info = graph.info

    if (!info) return defaultLabels

    const edgePropertyTypes = new Set(
      edges
        .map((e: any) => {
          const edgeData = e.data as EdgeEntry
          const props = edgeData[4]

          if (props === undefined) return undefined
          return Object.keys(props)
        })
        .filter((p: any) => p !== undefined)
        .flat()
        .map((id: any) => info.propTypes[Number.parseInt(id)])
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
    if (!graph.info) return

    const propType = graph.info.propTypes
      .map((ptName, i) => ({ ptName, i }))
      .find((pt) => pt.ptName === showingEdgeLabel)

    if (!propType) return

    for (const e of edges) {
      const data = e.data as EdgeEntry
      const properties = data[4]
      const propValue = properties[propType.i]
      turingActions.setEdgeLabel(e, propValue !== undefined ? propValue.toString() : '')
    }
  }, [graph.info, edges, showingEdgeLabel, turingActions])

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
