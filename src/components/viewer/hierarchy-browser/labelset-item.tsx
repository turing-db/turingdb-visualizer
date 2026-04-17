import { Icon, Spinner } from '@blueprintjs/core'
import clsx from 'clsx'
import { type FC, useContext, useMemo, useState } from 'react'
import { GlobalLabelCountsContext } from './global-counts-context'
import { HierarchyNodeItem } from './node-item'
import { useHierarchyNodesQuery } from './use-nodes-query'
import { useLabelsQuery } from './use-labels-query'

export interface LabelsetItemProps {
  label: string
  nodeCount: number
  parentLabels: string[]
  depth: number
  search?: string
}

export const LabelsetItem: FC<LabelsetItemProps> = ({
  label,
  nodeCount,
  parentLabels,
  depth,
  search,
}) => {
  const [expanded, setExpanded] = useState(false)
  const globalCounts = useContext(GlobalLabelCountsContext)

  const labelsPath = useMemo(() => [...parentLabels, label], [parentLabels, label])

  // Lazy: only fetch when expanded at least once
  const labelsQuery = useLabelsQuery(labelsPath, expanded)
  const nodesQuery = useHierarchyNodesQuery(labelsPath, expanded)

  // A child B is a strict subset of the path when every node with B also has
  // every label in the path — i.e., its intersection count with the path
  // equals its global count, and it's strictly smaller than this level.
  const childLabels = useMemo(() => {
    if (!labelsQuery.data) return [] as { label: string; count: number }[]
    const pathSet = new Set(labelsPath)
    return labelsQuery.data.labels
      .map((l, i) => ({ label: l, count: labelsQuery.data.nodeCounts[i] }))
      .filter((e) => {
        if (pathSet.has(e.label)) return false
        if (e.count <= 0) return false
        const global = globalCounts.get(e.label)
        if (global === undefined) return false
        // strict subset: all B-nodes are path-nodes, and B is smaller than path
        if (!(e.count === global && global < nodeCount)) return false
        if (search && !e.label.toLowerCase().includes(search)) return false
        return true
      })
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  }, [labelsQuery.data, labelsPath, globalCounts, nodeCount, search])

  const nodes = useMemo(() => {
    if (!nodesQuery.data) return []
    return nodesQuery.data.pages.flatMap((p) => Object.values(p.data))
  }, [nodesQuery.data])

  const toggle = () => setExpanded((v) => !v)

  const isLoading =
    expanded && (labelsQuery.isLoading || (nodesQuery.isLoading && nodes.length === 0))

  return (
    <div>
      <div
        className="flex items-center gap-1 px-2 py-1 hover:bg-grey-700 cursor-pointer text-sm select-none"
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
        onClick={toggle}
        onKeyUp={(e) => {
          if (e.key === 'Enter' || e.key === ' ') toggle()
        }}
      >
        <span className="w-4 flex items-center justify-center flex-shrink-0">
          <Icon
            icon={expanded ? 'chevron-down' : 'chevron-right'}
            size={12}
            className="text-content-tertiary"
          />
        </span>
        <Icon
          icon={expanded ? 'folder-open' : 'folder-close'}
          size={14}
          className="text-content-secondary flex-shrink-0"
        />
        <span className="flex-1 truncate" title={label}>
          {label}
        </span>
        <span className="text-content-tertiary text-xs flex-shrink-0">{nodeCount}</span>
      </div>

      {expanded && (
        <div>
          {isLoading && (
            <div
              className="flex items-center gap-2 px-2 py-1 text-xs text-content-tertiary"
              style={{ paddingLeft: `${(depth + 1) * 14 + 8}px` }}
            >
              <Spinner size={12} />
              <span>Loading…</span>
            </div>
          )}

          {childLabels.map((c) => (
            <LabelsetItem
              key={c.label}
              label={c.label}
              nodeCount={c.count}
              parentLabels={labelsPath}
              depth={depth + 1}
              search={search}
            />
          ))}

          {nodes.map((n) => (
            <HierarchyNodeItem key={n.id} node={n} depth={depth + 1} />
          ))}

          {nodesQuery.hasNextPage && (
            <button
              type="button"
              disabled={nodesQuery.isFetchingNextPage}
              onClick={(e) => {
                e.stopPropagation()
                nodesQuery.fetchNextPage()
              }}
              className={clsx(
                'flex w-full items-center gap-2 px-2 py-1 text-xs text-content-secondary hover:text-content-primary hover:bg-grey-700',
                nodesQuery.isFetchingNextPage && 'opacity-60'
              )}
              style={{ paddingLeft: `${(depth + 1) * 14 + 8}px` }}
            >
              {nodesQuery.isFetchingNextPage ? (
                <Spinner size={12} />
              ) : (
                <Icon icon="more" size={12} />
              )}
              <span>
                {nodesQuery.isFetchingNextPage ? 'Loading…' : 'Load more nodes'}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
