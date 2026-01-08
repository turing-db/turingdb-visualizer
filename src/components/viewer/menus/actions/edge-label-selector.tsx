import { TuringSelect } from '@/components/base/turing-select'
import { useCanvasEdgeLabels } from '@/hooks/use-canvas-edge-labels'
import { useMemo } from 'react'

export const EdgeLabelSelector = () => {
  const { edgeLabels, showingEdgeLabel, setShowingEdgeLabel } = useCanvasEdgeLabels()

  const edgeLabelItems = useMemo(
    () => Array.from(edgeLabels).map((p) => ({ name: String(p) })),
    [edgeLabels]
  )

  return (
    <TuringSelect
      items={edgeLabelItems}
      rightIcon={'caret-down'}
      leftIcon={'link'}
      onItemSelect={(ptype) => setShowingEdgeLabel(ptype.name)}
    >
      {showingEdgeLabel}
    </TuringSelect>
  )
}
