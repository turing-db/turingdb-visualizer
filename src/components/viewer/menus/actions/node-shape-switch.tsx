import TuringSwitch from '@/components/base/turing-switch'
import TuringTooltip from '@/components/base/turing-tooltip'
import { useCanvasStore } from '@/stores'
import type { CanvasStore } from '@turingcanvas'
import { useMemo } from 'react'

export const NodeShapeSwitch = () => {
  const nodeShape = useCanvasStore((state: CanvasStore) => state.nodeShape)
  const turingActions = useCanvasStore((state: CanvasStore) => state.actions)

  const isRoundedRect = nodeShape() === 'rounded-rect'

  const tooltip = useMemo(
    () => (isRoundedRect ? 'Render nodes as octagons' : 'Render nodes as rounded rectangles'),
    [isRoundedRect]
  )

  return (
    <TuringTooltip content={tooltip} placement="bottom">
      <TuringSwitch
        icon="polygon-filter"
        iconActive="widget"
        value={isRoundedRect}
        onChange={(value) => {
          turingActions.setNodeShape(value ? 'rounded-rect' : 'octagon')
        }}
      >
        Shape
      </TuringSwitch>
    </TuringTooltip>
  )
}
