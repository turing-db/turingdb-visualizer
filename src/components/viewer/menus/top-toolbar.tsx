import { useState, useCallback, type KeyboardEvent } from 'react'
import { InputGroup, Spinner, Callout } from '@blueprintjs/core'
import TuringButton from '@/components/base/turing-button'
import { TuringButtonGroup } from '@/components/base/turing-button-group'
import TuringMenuPopover from '@/components/base/turing-menu-popover'
import clsx from 'clsx'

import { SelectSameLabels } from './actions/select-same-labels-menu'
import { SelectSameProperties } from './actions/select-same-properties-menu'
import { HiddenNodesMenu } from './actions/hidden-nodes-menu'
import { AddNodesMenu } from './actions/add-nodes-menu'
import { NodeLabelSelector } from './actions/node-label-selector'
import { EdgeLabelSelector } from './actions/edge-label-selector'
import { ExpandNeighborsButton } from './actions/expand-neighbors-btn'
import { ColorNodesButton } from './actions/color-nodes-btn'
import { CenterForceSwitch } from './actions/center-force-switch'
import { useCypherQuery } from '@/hooks/use-cypher-query'
import { useVisStore } from '@/stores'

export const TuringTopToolBar = () => {
  const [query, setQuery] = useState('')
  const { mutate, isPending, error, reset } = useCypherQuery()
  const neighbourhood = useVisStore((state) => state.neighbourhood)
  const inspectNodeInfo = useVisStore((state) => state.inspectNodeInfo)
  const isNodeInspectorExtended = useVisStore((state) => state.isNodeInspectorExtended)

  const executeQuery = useCallback(() => {
    if (!query.trim() || isPending) return
    reset()
    mutate(query.trim())
  }, [query, isPending, mutate, reset])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        executeQuery()
      }
    },
    [executeQuery]
  )

  const clearCanvas = useCallback(() => {
    neighbourhood.reset(neighbourhood.graph)
  }, [neighbourhood])

  return (
    <div
      className={clsx(
        'absolute top-0 m-4 transition-[left] duration-300',
        inspectNodeInfo
          ? isNodeInspectorExtended
            ? 'left-[28.125rem]'
            : 'left-[15.625rem]'
          : 'left-0'
      )}
    >
      {error && (
        <Callout intent="danger" icon="error" className="text-sm mb-2">
          {error instanceof Error ? error.message : 'Query execution failed'}
        </Callout>
      )}
      <div className="flex items-center gap-2">
        <InputGroup
          className={clsx(
            'app-input transition-[width] duration-300',
            inspectNodeInfo
              ? isNodeInspectorExtended
                ? 'w-[200px]'
                : 'w-[300px]'
              : 'w-[400px]'
          )}
          placeholder="Cypher query (Ctrl+Enter to execute)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          style={{ fontFamily: 'monospace' }}
          rightElement={
            isPending ? <Spinner size={16} className="m-2" /> : undefined
          }
        />
        <TuringButton
          icon="play"
          intent="primary"
          onClick={executeQuery}
          disabled={!query.trim() || isPending}
          loading={isPending}
        />
        <TuringButton icon="trash" onClick={clearCanvas} disabled={isPending} />

        <div className="mx-1 border-l border-gray-600 h-6" />

        <CenterForceSwitch />
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
    </div>
  )
}
