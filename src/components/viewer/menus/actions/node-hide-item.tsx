import { TuringMenuItem } from '@/components/base/turing-menu-item'
import { useVisStore } from '@/stores'
import type { FC } from 'react'
import { useTuringContext } from 'turingcanvas'

export const NodeHideItem: FC = () => {
  const turing = useTuringContext()
  const neighbourhood = useVisStore((state) => state.neighbourhood)
  const hiddenNodes = useVisStore((state) => state.hiddenNodes)

  return (
  <TuringMenuItem
      text="Hide"
      icon="remove"
      intent="danger"
      onClick={() => {
        for (const [, n] of turing.instance.selectedNodes) {
          if (neighbourhood.has(n.id)) {
            neighbourhood.del([n.id])
          }
          hiddenNodes.add(n.id)
        }
      }}
    />
  )
}
