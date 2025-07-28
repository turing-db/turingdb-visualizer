import { TuringSelect } from '@/components/base/turing-select'
import { useCanvasNodeLabels } from '@/hooks/use-canvas-node-labels'
import { useMemo } from 'react'

export const NodeLabelSelector = () => {
  const { nodeLabels, showingNodeLabel, setShowingNodeLabel } = useCanvasNodeLabels()

  const nodeLabelItems = useMemo(
    () => Array.from(nodeLabels).map((p) => ({ name: p })),
    [nodeLabels]
  )

  return (
    <TuringSelect
      items={nodeLabelItems}
      rightIcon={'caret-down'}
      leftIcon={'hexagon'}
      onItemSelect={(ptype) => setShowingNodeLabel(ptype.name)}
    >
      {showingNodeLabel}
    </TuringSelect>
  )
}
