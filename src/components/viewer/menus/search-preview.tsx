import type { NodeEntry } from '@/api/models/nodeEntry.model'
import { getNodeName } from '@/utils/nodes'
import { Card, Icon, Spinner } from '@blueprintjs/core'
import clsx from 'clsx'
import { type FC, useMemo } from 'react'

export interface SearchPreviewProps {
  results: NodeEntry[]
  isLoading: boolean
  term: string
  activeIndex: number
  onHover: (index: number) => void
  onSelect: (node: NodeEntry) => void
  onMore?: () => void
  width: number
}

const highlightMatch = (text: string, needle: string) => {
  if (!needle) return text
  const lower = text.toLowerCase()
  const idx = lower.indexOf(needle.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-primary-default font-medium">
        {text.slice(idx, idx + needle.length)}
      </span>
      {text.slice(idx + needle.length)}
    </>
  )
}

export const SearchPreview: FC<SearchPreviewProps> = ({
  results,
  isLoading,
  term,
  activeIndex,
  onHover,
  onSelect,
  onMore,
  width,
}) => {
  const items = useMemo(
    () =>
      results.map((node) => {
        const p = getNodeName(node.properties)
        const name = p?.value != null ? String(p.value) : null
        return { node, name }
      }),
    [results]
  )

  const empty = !isLoading && items.length === 0

  return (
    <Card
      className="mt-2 p-0 overflow-hidden border border-gray-700 bg-background-primary shadow-lg"
      style={{ width }}
    >
      {isLoading && items.length === 0 && (
        <div className="flex items-center gap-2 px-3 py-2 text-content-secondary text-sm">
          <Spinner size={14} />
          <span>Searching…</span>
        </div>
      )}

      {empty && (
        <div className="px-3 py-2 text-content-tertiary text-sm italic">
          No matches for “{term}”
        </div>
      )}

      {items.length > 0 && (
        <>
          <ul className="max-h-[320px] overflow-y-auto py-1 m-0 list-none">
            {items.map(({ node, name }, idx) => {
              const active = idx === activeIndex
              const displayName = name ?? 'Unnamed'
              const truncated =
                displayName.length > 60 ? `${displayName.slice(0, 60)}…` : displayName
              return (
                <li
                  key={node.id}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm',
                    active ? 'bg-grey-700 text-content-primary' : 'hover:bg-grey-800'
                  )}
                  onMouseEnter={() => onHover(idx)}
                  onMouseDown={(e) => {
                    // onMouseDown (not onClick) so we fire before the input's
                    // blur event closes the dropdown.
                    e.preventDefault()
                    onSelect(node)
                  }}
                >
                  <Icon
                    icon="dot"
                    size={10}
                    className={clsx(
                      'flex-shrink-0',
                      active ? 'text-primary-default' : 'text-content-tertiary'
                    )}
                  />
                  <span className="flex-1 truncate" title={name ?? String(node.id)}>
                    {name ? highlightMatch(truncated, term) : truncated}
                  </span>
                  {node.labels.length > 0 && (
                    <span className="text-content-tertiary text-xs flex-shrink-0 truncate max-w-[120px]">
                      {node.labels.join(', ')}
                    </span>
                  )}
                  <span className="text-content-tertiary text-xs flex-shrink-0">{node.id}</span>
                </li>
              )
            })}
          </ul>
          {onMore && (
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2 border-t border-gray-700 text-sm text-content-secondary hover:bg-grey-800 hover:text-content-primary cursor-pointer bg-transparent"
              onMouseDown={(e) => {
                e.preventDefault()
                onMore()
              }}
            >
              <Icon icon="more" size={12} className="text-content-tertiary" />
              <span>More results…</span>
            </button>
          )}
        </>
      )}
    </Card>
  )
}

export default SearchPreview
