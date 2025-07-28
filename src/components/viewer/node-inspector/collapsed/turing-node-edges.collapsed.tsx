import type { NodeEntry } from '@/api/models/nodeEntry.model'
import { useVisStore, useAppStore } from '@/stores'
import TuringBadge from '@/components/base/turing-badge'
import TuringLinkButton from '@/components/base/turing-link-button'
import { getNodeName } from '@/utils/nodes'
import { useCallback, useMemo } from 'react'
import type { EdgeDirection } from '../constants'
import { useNodeEdges } from '../hooks/useNodeEdges'
import { Spinner } from '@blueprintjs/core'
import useGraphInfo from '@/hooks/use-graph-info'

function NodeEdgesItem({ node }: { node: NodeEntry }) {
  const neighbourhood = useVisStore((state) => state.neighbourhood)

  const nodeName = useMemo(() => {
    return getNodeName(node.properties)?.value
  }, [node.properties])

  const includesSpace = typeof nodeName === 'string' ? nodeName.includes(' ') : false

  const wordBreak = includesSpace ? 'break-all' : undefined

  const onClick = useCallback(
    (nodeID: number) => {
      if (neighbourhood.has(nodeID)) {
        neighbourhood.del([nodeID])
      } else {
        neighbourhood.add([nodeID])
      }
    },
    [neighbourhood]
  )

  return (
    <TuringBadge
      key={node.id}
      as="button"
      active={neighbourhood.has(node.id)}
      type="button"
      className="w-fit text-left text-pretty"
      onClick={() => onClick(node.id)}
      style={{
        wordBreak,
      }}
    >
      {nodeName ?? node.id}
    </TuringBadge>
  )
}

function NodeEdgesGroup({
  edges,
  type,
  edgeCounts,
  incrementPagination,
}: {
  edges: NodeEntry[]
  type: string
  edgeCounts: { [edgeTypeID: number]: number }
  incrementPagination: (type: number) => void
}) {
  const graphName = useAppStore((state) => state.graphName)
  const edgeTypes = useGraphInfo(graphName).info?.edgeTypes

  const handleLoadMore = useCallback(() => {
    incrementPagination(Number.parseInt(type))
  }, [incrementPagination, type])

  const remainingEdges = useMemo(() => {
    return edgeCounts[Number.parseInt(type)] - edges.length
  }, [edgeCounts, edges.length, type])

  if (!edgeTypes) {
    return null
  }

  return (
    <div className="flex flex-col">
      <p className="text-content-tertiary mb-2 text-xs leading-[1.16] font-medium">
        {edgeTypes[Number.parseInt(type)]}
      </p>
      <div className="flex flex-col flex-wrap gap-2">
        {edges.map((node, index) => (
          <NodeEdgesItem key={`node-${index}-${node.id}`} node={node} />
        ))}
      </div>
      {remainingEdges > 1 && (
        <>
          <span className="text-content-tertiary text-xs font-medium">
            + {remainingEdges} edges
          </span>
          <TuringLinkButton onClick={() => handleLoadMore()}>Load more</TuringLinkButton>
        </>
      )}
    </div>
  )
}

interface TuringNodeEdgesListCollapsedProps {
  title: string
  direction: EdgeDirection
  node: NodeEntry
  graph: string
}

export const TuringNodeEdgesListCollapsed = (props: TuringNodeEdgesListCollapsedProps) => {
  const { node, graph, direction } = props

  const { incrementPage, data, isPending } = useNodeEdges({
    node,
    graph,
    direction,
  })

  return (
    <div className="m-4">
      <p className="mb-2 text-xs leading-[1.6] font-bold tracking-[0.06em] uppercase">
        {props.title}
      </p>

      {isPending || data === undefined ? (
        <div className="flex flex-col items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-y-3">
          {data.nodeEdges.edges.length === 0 ? (
            <p className="text-content-primary py-2 text-xs leading-[1.5] font-medium tracking-[0.01em]">
              No results found.
            </p>
          ) : (
            Object.entries(data.edgesGroupedByEdgeType).map(([type, edges]) => (
              <NodeEdgesGroup
                key={type}
                edges={edges}
                type={type}
                edgeCounts={data.nodeEdges.edgeCounts}
                incrementPagination={incrementPage}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
