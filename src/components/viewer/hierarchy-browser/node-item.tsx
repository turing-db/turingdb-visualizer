import type { NodeEntry } from '@/api/models/nodeEntry.model'
import { useCanvasStore, useVisStore } from '@/stores'
import { getNodeName } from '@/utils/nodes'
import { Icon } from '@blueprintjs/core'
import clsx from 'clsx'
import { type FC, useMemo } from 'react'

export interface HierarchyNodeItemProps {
  node: NodeEntry
  depth: number
}

export const HierarchyNodeItem: FC<HierarchyNodeItemProps> = ({ node, depth }) => {
  const neighbourhood = useVisStore((state) => state.neighbourhood)
  const canvasActions = useCanvasStore((state) => state.actions)
  const included = neighbourhood.has(node.id)

  const name = useMemo(() => {
    const p = getNodeName(node.properties)
    if (p === null || p.value === null) return null
    return String(p.value)
  }, [node])

  const displayName = name
    ? name.length > 30
      ? `${name.slice(0, 30)}…`
      : name
    : 'Unnamed'

  const onToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (included) {
      neighbourhood.del([node.id])
    } else {
      await neighbourhood.add([node.id])
      canvasActions.focusNode(node.id, 2000)
    }
  }

  const onRowClick = async () => {
    if (!included) {
      await neighbourhood.add([node.id])
    }
    canvasActions.focusNode(node.id, 2000)
  }

  return (
    <div
      className={clsx(
        'flex items-center gap-1 px-2 py-1 hover:bg-grey-700 cursor-pointer text-sm group',
        included && 'text-primary-default'
      )}
      style={{ paddingLeft: `${depth * 14 + 8}px` }}
      onClick={onRowClick}
      onKeyUp={() => {}}
    >
      <span className="w-4 flex-shrink-0" />
      <Icon icon="dot" size={10} className="text-content-tertiary flex-shrink-0" />
      <span className="flex-1 truncate" title={name ?? String(node.id)}>
        {displayName}
      </span>
      <span className="text-content-tertiary text-xs flex-shrink-0">{node.id}</span>
      <button
        type="button"
        onClick={onToggle}
        className="opacity-0 group-hover:opacity-100 text-content-secondary hover:text-content-primary flex-shrink-0 p-0.5"
        title={included ? 'Remove from view' : 'Add to view'}
      >
        <Icon icon={included ? 'cross' : 'plus'} size={12} />
      </button>
    </div>
  )
}
