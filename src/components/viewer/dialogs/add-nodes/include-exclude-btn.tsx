import TuringButton from '@/components/base/turing-button'
import { useCanvasStore, useVisStore } from '@/stores'
import type { FC } from 'react'

export interface IncludeExcludeButtonProps {
  nodeID: number
}

export const IncludeExcludeButton: FC<IncludeExcludeButtonProps> = (props) => {
  const neighbourhood = useVisStore((state) => state.neighbourhood)
  const canvasActions = useCanvasStore((state) => state.actions)

  return neighbourhood.has(props.nodeID) ? (
    <TuringButton
      icon="trash"
      textClassName="text-red-200"
      className="w-[100px]"
      onClick={() => {
        neighbourhood.del([props.nodeID])
      }}
    >
      Exclude
    </TuringButton>
  ) : (
    <TuringButton
      icon="plus"
      textClassName="text-content-secondary"
      className="w-[100px]"
      onClick={async () => {
        await neighbourhood.add([props.nodeID])
        canvasActions.focusNode(props.nodeID, 2000)
      }}
    >
      Include
    </TuringButton>
  )
}
