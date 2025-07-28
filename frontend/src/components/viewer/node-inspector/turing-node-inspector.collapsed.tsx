import type { NodeEntry } from '@/api/models/nodeEntry.model'
import { TuringNodeEdgesListCollapsed } from './collapsed/turing-node-edges.collapsed'
import { EdgeDirection } from './constants'
import TuringNodePropertiesListCollapsed from './collapsed/turing-node-properties.collapsed'

interface TuringNodeInspectorCollapsedProps {
  node: NodeEntry
  graph: string
}

export const TuringNodeInspectorCollapsed = (props: TuringNodeInspectorCollapsedProps) => {
  const { node, graph } = props

  return (
    <>
      <TuringNodePropertiesListCollapsed properties={props.node.properties} />

      <TuringNodeEdgesListCollapsed
        title="In edges"
        direction={EdgeDirection.IN}
        node={node}
        graph={graph}
      />
      <TuringNodeEdgesListCollapsed
        title="Out edges"
        direction={EdgeDirection.OUT}
        node={node}
        graph={graph}
      />
    </>
  )
}
