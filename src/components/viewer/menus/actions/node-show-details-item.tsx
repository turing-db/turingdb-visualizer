import { TuringMenuItem } from '@/components/base/turing-menu-item'
import { useVisStore } from '@/stores'
import type { FC } from 'react'

export type NodeShowDetailsItemProps = {
  node: any
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
