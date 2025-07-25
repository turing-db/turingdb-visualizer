import TuringButton from '@/components/base/turing-button'
import TuringTooltip from '@/components/base/turing-tooltip'
import { useVisStore } from '@/stores'
import { useCallback } from 'react'
import { useTuringContext } from 'turingcanvas'

export const ExpandNeighborsButton = () => {
  const neighbourhood = useVisStore((state) => state.neighbourhood)
  const turing = useTuringContext()

  const expandNodes = useCallback(async () => {
    const secondaryNodes = turing.instance.nodes.filter((n: any) => !n.isPrimary())

    neighbourhood.add(secondaryNodes.map((n: any) => n.id))
  }, [turing.instance, neighbourhood])

  return (
    <TuringTooltip content="Expand all neighbors" placement="bottom">
      <TuringButton icon="expand-all" onClick={expandNodes} />
    </TuringTooltip>
  )
}
