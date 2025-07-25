import type { NodeEntry } from '@/api/models/nodeEntry.model'
import { TuringSearchInput } from '@/components/base/turing-search-input'
import { useState } from 'react'
import { EdgeDirection } from './constants'
import TuringNodeEdges from './extended/edges/turing-node-edge.extended'
import TuringNodePropertiesListExtended from './extended/turing-node-properties.extended'

interface TuringNodeInspectorExtendedProps {
  node: NodeEntry
  graph: string
}

export const TuringNodeInspectorExtended = (props: TuringNodeInspectorExtendedProps) => {
  const [search, setSearch] = useState('')
  const { node, graph } = props

  return (
    <>
      <TuringSearchInput
        className="m-4"
        value={search}
        onValueChange={(v) => setSearch(v)}
        onClear={() => setSearch('')}
        placeholder="Search in edges and out edges..."
      />

      <TuringNodeEdges search={search} direction={EdgeDirection.IN} node={node} graph={graph} />
      <TuringNodeEdges search={search} direction={EdgeDirection.OUT} node={node} graph={graph} />

      <TuringNodePropertiesListExtended properties={props.node.properties} />
    </>
  )
}
