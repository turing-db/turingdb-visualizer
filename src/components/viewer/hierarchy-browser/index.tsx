import {
  HIERARCHY_BROWSER_MAX_WIDTH,
  HIERARCHY_BROWSER_MIN_WIDTH,
  useVisStore,
} from '@/stores'
import { Icon, Spinner } from '@blueprintjs/core'
import clsx from 'clsx'
import { useCallback, useMemo, useRef, useState } from 'react'
import TuringButton from '@/components/base/turing-button'
import { TuringSearchInput } from '@/components/base/turing-search-input'
import { GlobalLabelCountsContext } from './global-counts-context'
import { LabelsetItem } from './labelset-item'
import { useLabelsQuery } from './use-labels-query'

export const HierarchyBrowser = () => {
  const isOpen = useVisStore((state) => state.isHierarchyBrowserOpen)
  const setOpen = useVisStore((state) => state.setHierarchyBrowserOpen)
  const width = useVisStore((state) => state.hierarchyBrowserWidth)
  const setWidth = useVisStore((state) => state.setHierarchyBrowserWidth)

  const { data, isLoading, isError } = useLabelsQuery([], isOpen)

  const [search, setSearch] = useState('')
  const searchNorm = search.trim().toLowerCase()

  const globalCounts = useMemo(() => {
    const m = new Map<string, number>()
    if (!data) return m
    for (let i = 0; i < data.labels.length; i++) m.set(data.labels[i], data.nodeCounts[i])
    return m
  }, [data])

  const rootLabels = useMemo(() => {
    if (!data) return [] as { label: string; count: number }[]
    return data.labels
      .map((l, i) => ({ label: l, count: data.nodeCounts[i] }))
      .filter((e) => e.count > 0)
      .filter((e) => !searchNorm || e.label.toLowerCase().includes(searchNorm))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  }, [data, searchNorm])

  const [isResizing, setIsResizing] = useState(false)
  const resizeStartXRef = useRef(0)
  const resizeStartWidthRef = useRef(0)

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      resizeStartXRef.current = e.clientX
      resizeStartWidthRef.current = width
      setIsResizing(true)

      const onMove = (ev: PointerEvent) => {
        const delta = resizeStartXRef.current - ev.clientX
        const next = Math.max(
          HIERARCHY_BROWSER_MIN_WIDTH,
          Math.min(HIERARCHY_BROWSER_MAX_WIDTH, resizeStartWidthRef.current + delta)
        )
        setWidth(next)
      }
      const onUp = () => {
        setIsResizing(false)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [width, setWidth]
  )

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      style={{ width: `${width}px` }}
      className={clsx(
        'bg-grey-800 shadow-dark pointer-events-auto absolute top-0 right-0 flex h-[100%] flex-col overflow-hidden border-l border-grey-600',
        isResizing ? '' : 'transition-transform duration-300',
        isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+2px)]'
      )}
    >
      <div className="border-grey-600 flex flex-shrink-0 items-center justify-between gap-2 border-b px-4 py-3 h-[3rem]">
        <div className="flex items-center gap-2">
          <Icon icon="diagram-tree" />
          <span className="text-content-primary text-sm font-medium">Hierarchy</span>
        </div>
        <TuringButton icon="cross" onClick={() => setOpen(false)} />
      </div>

      <div className="border-grey-600 flex-shrink-0 border-b px-3 py-2">
        <TuringSearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          placeholder="Filter labels…"
        />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 p-4 text-content-tertiary text-sm">
            <Spinner size={14} />
            <span>Loading labels…</span>
          </div>
        )}
        {isError && (
          <div className="p-4 text-sm text-red-300">Failed to load labels.</div>
        )}
        {!isLoading && !isError && rootLabels.length === 0 && (
          <div className="p-4 text-content-tertiary text-sm">No labels found.</div>
        )}
        <GlobalLabelCountsContext.Provider value={globalCounts}>
          {rootLabels.map((entry) => (
            <LabelsetItem
              key={entry.label}
              label={entry.label}
              nodeCount={entry.count}
              parentLabels={[]}
              depth={0}
              search={searchNorm}
            />
          ))}
        </GlobalLabelCountsContext.Provider>
      </div>

      <div
        aria-label="Resize hierarchy browser"
        role="separator"
        onPointerDown={onResizePointerDown}
        className="group absolute top-0 left-0 flex h-full w-[6px] -translate-x-[3px] cursor-col-resize items-stretch justify-center"
      >
        <div className="bg-grey-600 group-hover:bg-primary-default h-full w-[1px] transition-colors" />
      </div>
    </div>
  )
}

export default HierarchyBrowser
