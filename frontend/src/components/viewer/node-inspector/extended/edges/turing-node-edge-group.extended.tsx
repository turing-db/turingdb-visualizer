import type { NodeEntry } from '@/api/models/nodeEntry.model'
import { useAppStore, useVisStore } from '@/stores'
import TuringBadge from '@/components/base/turing-badge'
import TuringLinkButton from '@/components/base/turing-link-button'
import { getNodeName } from '@/utils/nodes'
import clsx from 'clsx'
import { useCallback, useMemo } from 'react'
import useGraphInfo from '@/hooks/use-graph-info'

function NodeEdgeCard({ node, onClick }: { node: NodeEntry; onClick: (nodeId: number) => void }) {
  const neighbourhood = useVisStore((state) => state.neighbourhood)
  const isPrimary = useMemo(() => neighbourhood.has(node.id), [neighbourhood, node.id])

  const nodeName = useMemo(() => {
    return getNodeName(node.properties)?.value
  }, [node.properties])

  return (
    <div
      className={clsx([
        'bg-grey-700 text-content-primary hover:bg-grey-600 mr-2 mb-2 cursor-pointer justify-start rounded-[0.25rem] border p-2 text-xs transition-colors',
        isPrimary ? 'border-primary-default' : 'border-white/10',
      ])}
      key={node.id}
      onClick={() => {
        onClick(node.id)
      }}
      onKeyUp={(e) => {
        if (e.key === 'Enter') {
          onClick(node.id)
        }
      }}
    >
      <p
        className="pb-2 leading-[1.16] font-medium tracking-[0.06em] transition-colors"
        style={{
          wordBreak: String(nodeName).length > 35 ? 'break-all' : undefined,
        }}
      >
        {nodeName}
      </p>
      <TuringBadge alt>{node.id}</TuringBadge>
      {node.properties.definition && (
        <p className="text-content-secondary pt-3 leading-[1.33] tracking-[0.02em]">
          {node.properties.definition}
        </p>
      )}
    </div>
  )
}

export default function TuringNodeEdgeGroup({
  nodes,
  onEdgeClick,
  type,
  edgeCounts,
  incrementPage,
}: {
  nodes: NodeEntry[]
  onEdgeClick: (nodeId: number) => void
  type: string
  edgeCounts: { [edgeTypeID: number]: number }
  incrementPage: (type: number) => void
}) {
  const graphName = useAppStore((state) => state.graphName)
  const edgeTypes = useGraphInfo(graphName).info?.edgeTypes

  const handleLoadMore = useCallback(() => {
    incrementPage(Number.parseInt(type))
  }, [type, incrementPage])

  const remainingEdges = useMemo(() => {
    return edgeCounts[Number.parseInt(type)] - nodes.length
  }, [edgeCounts, nodes.length, type])

  if (!edgeTypes) return

  return (
    <div className="mb-2 flex flex-col">
      <span className="text-content-tertiary mb-2 text-xs font-medium">
        {edgeTypes[Number.parseInt(type)]}:
      </span>
      <div className="flex flex-wrap">
        {nodes.map((node, index) => (
          <NodeEdgeCard key={`${node.id}-${index}`} node={node} onClick={onEdgeClick} />
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
      {/* {isExpandable && (
        <TuringExpandable
          trigger={({ setIsExpanded }) => (
            <TuringCollapseTrigger onClick={() => setIsExpanded(true)}>
              Show more
            </TuringCollapseTrigger>
          )}
          hideTriggerOnExpand
        >
          <div className="mt-3 flex flex-col">
            {rest.map((node) => (
              <NodeEdgeCard key={node.id} node={node} onClick={onEdgeClick} />
            ))}
          </div>
        </TuringExpandable>
      )} */}
    </div>
  )
}
