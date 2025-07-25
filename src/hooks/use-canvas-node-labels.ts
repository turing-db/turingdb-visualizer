import { useCallback, useEffect, useMemo } from 'react'

import { useInitState } from './useinitstate'
import type { NodeEntry } from '@/api/models/nodeEntry.model'
import { useCanvasStore } from '@/stores'
import { NODE_DISPLAY_NAMES } from '@/utils/nodes'

export const useCanvasNodeLabels = () => {
  const [showingNodeLabel, setShowingNodeLabel, initShowingNodeLabel, showingNodeLabelInitialized] =
    useInitState('None')

  const getTuringNodes = useCanvasStore((state) => state.nodes)
  const turingActions = useCanvasStore((state) => state.actions)

  const nodes = useMemo(() => {
    return getTuringNodes()
  }, [getTuringNodes])

  const nodeLabels = useMemo(() => {
    const defaultLabels = new Set(['None', 'Node IDs'])

    const nodePropertyTypes = new Set(
      nodes.flatMap((e: any) => {
        const nodeData = e.data as NodeEntry
        const props = nodeData.properties
        return Object.keys(props)
      })
    )

    return new Set([...defaultLabels, ...nodePropertyTypes])
  }, [nodes])

  const applyNone = useCallback(() => {
    if (showingNodeLabelInitialized.current) {
      for (const n of nodes) {
        turingActions.setNodeLabel(n, '')
      }
    } else {
      const names = NODE_DISPLAY_NAMES.filter((pt1) => nodeLabels.has(pt1))
      if (names.length === 0) return
      initShowingNodeLabel(names[0])
    }
  }, [initShowingNodeLabel, nodeLabels, showingNodeLabelInitialized, nodes, turingActions])

  const applyNodeIDs = useCallback(() => {
    for (const n of nodes) {
      turingActions.setNodeLabel(n, n.id.toString())
    }
  }, [nodes, turingActions])

  const applyPropertyType = useCallback(() => {
    for (const n of nodes) {
      const data = n.data as NodeEntry
      const propValue = data.properties[showingNodeLabel]
      turingActions.setNodeLabel(n, propValue !== undefined ? propValue.toString() : '')
    }
  }, [nodes, showingNodeLabel, turingActions])

  useEffect(() => {
    switch (showingNodeLabel) {
      case 'None':
        applyNone()
        break

      case 'Node IDs':
        applyNodeIDs()
        break

      default:
        applyPropertyType()
        break
    }
  }, [applyPropertyType, applyNodeIDs, applyNone, showingNodeLabel])

  return {
    nodeLabels,
    showingNodeLabel,
    setShowingNodeLabel,
  }
}
