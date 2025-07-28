import type { NodeEntry } from '@/api/models/nodeEntry.model'
import { useMemo } from 'react'
import TuringNodeEdgeCard from './turing-node-edge-card.extended'
import { EdgeDirection } from '../../constants'
import { useNodeEdges } from '../../hooks/useNodeEdges'
import { Spinner } from '@blueprintjs/core'
import useEdgeSearch from '../../hooks/useEdgeSearch'

export default function TuringNodeEdges({
  search = '',
  direction,
  node,
  graph,
}: {
  search: string
  direction: EdgeDirection
  node: NodeEntry
  graph: string
}) {
  const { incrementPage, data, isPending } = useNodeEdges({ node, graph, direction })
  const { isSearchMatch, setInternalSearch } = useEdgeSearch(search)

  const filteredNodes = useMemo(() => {
    if (isPending || !data) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(data.edgesGroupedByEdgeType)
        .map(([edgeType, nodes]) => [edgeType, nodes.filter((n) => isSearchMatch(n))])
        .filter((v) => v[1].length !== 0)
    )
  }, [data, isPending, isSearchMatch])

  return (
    <div className="m-2 flex flex-col">
      {isPending || !data ? (
        <div className="flex flex-col items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <TuringNodeEdgeCard
          title={direction === EdgeDirection.IN ? 'In edges' : 'Out edges'}
          filteredNodes={filteredNodes}
          edgeCounts={data.nodeEdges.edgeCounts}
          onSearch={(v) => setInternalSearch(v)}
          onSearchClear={() => setInternalSearch('')}
          incrementPage={incrementPage}
        />
      )}
    </div>
  )
}
