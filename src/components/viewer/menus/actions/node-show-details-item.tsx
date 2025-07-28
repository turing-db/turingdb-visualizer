import { TuringMenuItem } from '@/components/base/turing-menu-item'
import { useVisStore } from '@/stores'
import type { FC } from 'react'
import type { TuringNode } from '@turingcanvas'

export type NodeShowDetailsItemProps = {
  node: TuringNode
}

export const NodeShowDetailsItem: FC<NodeShowDetailsItemProps> = (props) => {
  const inspectNode = useVisStore((state) => state.inspectNode)

  return (
    <TuringMenuItem
      text="Node info"
      icon="info-sign"
      intent="primary"
      onClick={() => inspectNode(props.node.id)}
    />
  )
}
