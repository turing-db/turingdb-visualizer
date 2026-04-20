import TuringButton from '@/components/base/turing-button'
import { TuringButtonGroup } from '@/components/base/turing-button-group'
import TuringMenuPopover from '@/components/base/turing-menu-popover'
import { Card, Icon, InputGroup, Spinner } from '@blueprintjs/core'
import clsx from 'clsx'
import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { NodeEntry } from '@/api/models/nodeEntry.model'
import { CypherQueryError } from '@/api/responses'
import { useCypherQuery } from '@/hooks/use-cypher-query'
import { useNodeSearch } from '@/hooks/use-node-search'
import { useNodeSearchPreview } from '@/hooks/use-node-search-preview'
import { useAppStore, useCanvasStore, useVisStore } from '@/stores'
import { isCypherQuery } from '@/utils/is-cypher'
import { AddNodesMenu } from './actions/add-nodes-menu'
import { CenterForceSwitch } from './actions/center-force-switch'
import { ColorNodesButton } from './actions/color-nodes-btn'
import { EdgeLabelSelector } from './actions/edge-label-selector'
import { ExpandNeighborsButton } from './actions/expand-neighbors-btn'
import { HiddenNodesMenu } from './actions/hidden-nodes-menu'
import { NodeLabelSelector } from './actions/node-label-selector'
import { NodeShapeSwitch } from './actions/node-shape-switch'
import { SelectSameLabels } from './actions/select-same-labels-menu'
import { SelectSameProperties } from './actions/select-same-properties-menu'
import { SearchPreview } from './search-preview'

export const TuringTopToolBar = () => {
  const [query, setQuery] = useState('MATCH (n) RETURN n LIMIT 100')
  const cypherMut = useCypherQuery()
  const searchMut = useNodeSearch()
  const mode: 'cypher' | 'search' = useMemo(
    () => (isCypherQuery(query) ? 'cypher' : 'search'),
    [query]
  )
  const isPending = cypherMut.isPending || searchMut.isPending
  const error = cypherMut.error
  const reset = cypherMut.reset
  const neighbourhood = useVisStore((state) => state.neighbourhood)
  const inspectNodeInfo = useVisStore((state) => state.inspectNodeInfo)
  const isNodeInspectorExtended = useVisStore((state) => state.isNodeInspectorExtended)
  const nodeInspectorExtendedWidth = useVisStore((state) => state.nodeInspectorExtendedWidth)
  const nodeInspectorCollapsedWidth = useVisStore((state) => state.nodeInspectorCollapsedWidth)
  const graphLoading = useVisStore((state) => state.graphLoading)
  const isHierarchyBrowserOpen = useVisStore((state) => state.isHierarchyBrowserOpen)
  const setHierarchyBrowserOpen = useVisStore((state) => state.setHierarchyBrowserOpen)
  const graphName = useAppStore((state) => state.graphName)
  const canvasActions = useCanvasStore((state) => state.actions)
  const openAddNodesDialog = useVisStore((state) => state.openAddNodesDialog)

  const [focused, setFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputWrapperRef = useRef<HTMLDivElement>(null)
  const [inputWidth, setInputWidth] = useState(400)

  const trimmedQuery = query.trim()
  const previewVisible = mode === 'search' && focused && trimmedQuery.length > 0
  const preview = useNodeSearchPreview(query, previewVisible)

  useEffect(() => {
    setActiveIndex(preview.results.length > 0 ? 0 : -1)
  }, [preview.results])

  useEffect(() => {
    if (!inputWrapperRef.current) return
    const el = inputWrapperRef.current
    const observer = new ResizeObserver(() => setInputWidth(el.offsetWidth))
    observer.observe(el)
    setInputWidth(el.offsetWidth)
    return () => observer.disconnect()
  }, [])

  const busy = isPending || graphLoading

  const inspectorOffset = inspectNodeInfo
    ? isNodeInspectorExtended
      ? nodeInspectorExtendedWidth
      : nodeInspectorCollapsedWidth
    : 0

  const executeQuery = useCallback(() => {
    const trimmed = query.trim()
    if (!trimmed || isPending) return
    reset()
    if (mode === 'cypher') {
      cypherMut.mutate(trimmed)
    } else if (searchMut.canSearch) {
      searchMut.mutate(trimmed)
    }
  }, [query, isPending, mode, cypherMut, searchMut, reset])

  const selectPreviewNode = useCallback(
    async (node: NodeEntry) => {
      if (!graphName) return
      setFocused(false)
      inputRef.current?.blur()
      if (neighbourhood.has(node.id)) {
        canvasActions.focusNode(node.id, 800)
        return
      }
      neighbourhood.reset(graphName)
      await neighbourhood.add([node.id])
      canvasActions.focusNode(node.id, 800)
    },
    [graphName, neighbourhood, canvasActions]
  )

  const openMoreResults = useCallback(() => {
    setFocused(false)
    inputRef.current?.blur()
    openAddNodesDialog(trimmedQuery)
  }, [openAddNodesDialog, trimmedQuery])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (previewVisible && preview.results.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setActiveIndex((i) => (i + 1) % preview.results.length)
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setActiveIndex((i) => (i <= 0 ? preview.results.length - 1 : i - 1))
          return
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          setFocused(false)
          inputRef.current?.blur()
          return
        }
        if (e.key === 'Enter') {
          e.preventDefault()
          const node = preview.results[activeIndex] ?? preview.results[0]
          if (node) selectPreviewNode(node)
          return
        }
      }
      if (e.key !== 'Enter') return
      executeQuery()
    },
    [executeQuery, previewVisible, preview.results, activeIndex, selectPreviewNode]
  )

  const clearCanvas = useCallback(() => {
    neighbourhood.reset(neighbourhood.graph)
  }, [neighbourhood])

  return (
    <div
      className="absolute top-0 m-4 transition-[left] duration-300"
      style={{ left: `${inspectorOffset}px` }}
    >
      <div className="flex items-center gap-2">
        <div
          ref={inputWrapperRef}
          className={clsx(
            'relative transition-[width] duration-300',
            inspectNodeInfo ? (isNodeInspectorExtended ? 'w-[200px]' : 'w-[300px]') : 'w-[400px]'
          )}
        >
          <InputGroup
            className="app-input w-full"
            inputRef={inputRef}
            placeholder={
              mode === 'cypher' ? 'Cypher query (Enter to execute)' : 'Search nodes by name'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={isPending}
            style={{ fontFamily: mode === 'cypher' ? 'monospace' : undefined }}
            rightElement={busy ? <Spinner size={16} className="m-2" /> : undefined}
          />
          {previewVisible && (
            <div className="absolute left-0 right-0 top-full z-20">
              <SearchPreview
                results={preview.results}
                isLoading={preview.isLoading}
                term={trimmedQuery}
                activeIndex={activeIndex}
                onHover={setActiveIndex}
                onSelect={selectPreviewNode}
                onMore={openMoreResults}
                width={inputWidth}
              />
            </div>
          )}
        </div>
        <TuringButton
          icon={mode === 'cypher' ? 'play' : 'search'}
          intent="primary"
          onClick={executeQuery}
          disabled={!query.trim() || busy || (mode === 'search' && !searchMut.canSearch)}
          loading={busy}
        />
        <TuringButton icon="trash" onClick={clearCanvas} disabled={busy} />
        <TuringButton
          icon="diagram-tree"
          highlight={isHierarchyBrowserOpen}
          onClick={() => setHierarchyBrowserOpen(!isHierarchyBrowserOpen)}
        />

        <div className="mx-1 border-l border-gray-600 h-6" />

        <CenterForceSwitch />
        <NodeShapeSwitch />
        <TuringButtonGroup>
          {/* <TuringTooltip content="Clean up canvas" interactionKind="hover-target" placement="bottom">
            <TuringButton icon="eraser"></TuringButton>
          </TuringTooltip>*/}

          <HiddenNodesMenu />
          <ExpandNeighborsButton />
          <ColorNodesButton />
          {/* <TuringTooltip label="Hide neighbors" interactionKind="hover-target" placement="bottom">
            <TuringButton icon="collapse-all"></TuringButton>
          </TuringTooltip> */}

          <TuringMenuPopover
            trigger={
              <TuringButton rightIcon="caret-down" icon="select" onClick={() => {}}>
                Select
              </TuringButton>
            }
            placement="bottom-start"
            fill
          >
            <SelectSameLabels />
            <SelectSameProperties />
          </TuringMenuPopover>
        </TuringButtonGroup>

        <div className="mx-1">
          <AddNodesMenu />
        </div>

        <div className="mx-1">
          <NodeLabelSelector />
        </div>

        <div className="mx-1">
          <EdgeLabelSelector />
        </div>
        {/* <TuringButton className="mx-1" onClick={() => {}}>
          Add node
        </TuringButton>
        <div className="mx-1">
          <TuringSelect
            items={[]}
            rightIcon="caret-down"
            leftIcon="one-to-one"
            onItemSelect={() => {}}
          >
            None
          </TuringSelect>
        </div>
        <TuringButton className="mx-1" icon="add" onClick={() => {}}>
          Add entiy
        </TuringButton>
        <TuringButton className="mx-1" icon="settings" onClick={() => {}}></TuringButton>
        <TuringButton className="mx-1" icon="search" onClick={() => {}}>
          Search view
        </TuringButton>
        */}
      </div>

      {error && (
        <Card className="mt-2 p-0 overflow-hidden border border-red-700 max-w-[600px]">
          <div className="bg-red-900/50 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-300">
              <Icon icon="error" />
              <span className="font-medium">
                {error instanceof CypherQueryError ? error.errorType : 'Query Error'}
              </span>
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-red-300 hover:text-red-100 p-1"
              aria-label="Dismiss error"
            >
              <Icon icon="cross" />
            </button>
          </div>
          {error instanceof CypherQueryError && error.errorDetails && (
            <div className="p-3 bg-gray-900 overflow-auto max-h-[200px]">
              <pre
                className="text-xs text-red-200 whitespace-pre m-0"
                style={{ fontFamily: 'monospace' }}
              >
                {error.errorDetails}
              </pre>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
