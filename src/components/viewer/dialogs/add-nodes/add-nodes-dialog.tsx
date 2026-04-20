import type { NodeEntry } from '@/api/models/nodeEntry.model'
import TuringButton from '@/components/base/turing-button'
import { TuringDialog } from '@/components/base/turing-dialog'
import useGraphInfo from '@/hooks/use-graph-info'
import { useAppStore, useVisStore } from '@/stores'
import { getNodeName } from '@/utils/nodes'
import { DialogBody, DialogFooter } from '@blueprintjs/core'
import { type FC, useEffect, useMemo, useRef } from 'react'
import { AddNodesSearchBar } from './add-nodes-search-bar'
import { NodeCard, type NodeName } from './node-card'
import { useFilters } from './use-filters'
import { useNodesQuery } from './use-nodes'

export const AddNodesDialog: FC = () => {
  const graphName = useAppStore((state) => state.graphName)
  const graph = useGraphInfo(graphName)
  const open = useVisStore((state) => state.addNodesDialogOpen)
  const initialSearchTerm = useVisStore((state) => state.addNodesDialogInitialTerm)
  const closeDialog = useVisStore((state) => state.closeAddNodesDialog)
  const [filters, setFilters] = useFilters()

  const { nodes, hasNextPage, isFetching, fetchNextPage, resetPage } = useNodesQuery(filters)

  const ref = useRef<HTMLDivElement>(null)

  const data = useMemo(
    () =>
      (nodes ? nodes.pages.flatMap((d) => Object.values(d.data)) : []).map((n) => {
        const returnValue: { node: NodeEntry; name: NodeName | undefined } = {
          node: n,
          name: undefined,
        }

        const nameProperty = getNodeName(n.properties)

        if (nameProperty === null || nameProperty.value === null) {
          return returnValue
        }

        returnValue.name = {
          value: nameProperty.value.toString(),
          type: nameProperty.type,
        }

        return returnValue
      }),
    [nodes]
  )

  useEffect(() => {
    resetPage()
    ref.current?.scrollTo(0, 0)
  }, [resetPage])

  if (!graph.info) return null

  return (
    <TuringDialog isOpen={open} onClose={closeDialog} title="Add nodes" icon="plus">
      <DialogBody className="flex h-screen flex-1 flex-col">
        <div className="flex h-full flex-1 flex-col">
          <AddNodesSearchBar
            setFilters={setFilters}
            open={open}
            initialSearchTerm={initialSearchTerm}
          />
          <div
            ref={ref}
            className="app-node-card-list mt-4! h-full flex-1 overflow-y-scroll"
            onScroll={(e) => {
              if (!hasNextPage || isFetching) {
                return
              }

              const target = e.target as HTMLDivElement
              const scroll = target.scrollHeight - target.scrollTop
              const threshold = target.offsetHeight * 0.05
              const atBottom = scroll - threshold < target.offsetHeight

              if (atBottom) {
                fetchNextPage()
              }
            }}
          >
            {data.map((n) => {
              return <NodeCard key={n.node.id} node={n.node} name={n.name} />
            })}
          </div>
        </div>
      </DialogBody>

      <DialogFooter
        actions={<TuringButton intent="primary" text="Close" outlined onClick={closeDialog} />}
      />
    </TuringDialog>
  )
}
