import type { NodeEntry } from '@/api/models/nodeEntry.model'
import { type FC, useMemo } from 'react'
import { IncludeExcludeButton } from './include-exclude-btn'
import TuringNodePropertiesListExtended from '@/components/viewer/node-inspector/extended/turing-node-properties.extended'

export interface NodeName {
  value: string
  type: string
}

export interface NodeCardProps {
  node: NodeEntry
  name?: NodeName
}

export interface NodeIDBadgeProps {
  id: number
}
const NodeIDBadge: FC<NodeIDBadgeProps> = (props) => (
  <span className="app-node-card-id text-content-tertiary m-0 mr-2 p-0 text-sm">{props.id}</span>
)

export interface NodeNameType {
  type: string
}

const NodeNameType: FC<NodeNameType> = (props) => (
  <span className="app-node-card-name-type text-content-tertiary m-0 ml-2 p-0 text-sm">
    [{props.type}]
  </span>
)

export const NodeCard: FC<NodeCardProps> = (props) => {
  const nodeTitle = useMemo(() => {
    if (props.name === undefined)
      return (
        <>
          <NodeIDBadge id={props.node.id} />
          <span>Unnamed node</span>
        </>
      )

    const value =
      props.name.value.length > 20 ? `${props.name.value.slice(0, 20)}...` : props.name.value

    return (
      <>
        <NodeIDBadge id={props.node.id} />
        <span className="app-node-card-name-value">{value}</span>
        <NodeNameType type={props.name.type} />
      </>
    )
  }, [props.node, props.name])

  return (
    <div className="app-node-card flex flex-col">
      <div className="app-node-card-title m-0 p-0">{nodeTitle}</div>
      <div className="app-node-card-content flex flex-row">
        <div className="app-node-card-icon">
          <IncludeExcludeButton nodeID={props.node.id} />
        </div>
        <TuringNodePropertiesListExtended properties={props.node.properties} />
      </div>
    </div>
  )
}
