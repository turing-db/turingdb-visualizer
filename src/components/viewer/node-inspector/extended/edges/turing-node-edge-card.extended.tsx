import type { NodeEntry } from '@/api/models/nodeEntry.model'
import { useVisStore } from '@/stores'
import { useCallback, useEffect, useMemo, useState } from 'react'
import TuringNodeCard from '../turing-node-card.extended'
import TuringNodeEdgeGroup from './turing-node-edge-group.extended'

export default function TuringNodeEdgeCard({
  title,
  filteredNodes,
  edgeCounts,
  onSearch,
  onSearchClear,
  incrementPage,
}: {
  title: string
  filteredNodes: Record<string, NodeEntry[]>
  edgeCounts: { [edgeTypeID: number]: number }
  onSelectAll?: () => void
  onSearch?: (v: string) => void
  onSearchClear?: () => void
  selectAllLabel?: string
  incrementPage: (type: number) => void
}) {
  const empty = !Object.keys(filteredNodes).length
  const neighbourhood = useVisStore((state) => state.neighbourhood)

  const onEdgeClick = useCallback(
    (nodeID: number) => {
      if (neighbourhood.has(nodeID)) {
        neighbourhood.del([nodeID])
      } else {
        neighbourhood.add([nodeID])
      }
    },
    [neighbourhood]
  )

  const handleToggleEdges = useCallback(
    (nodeIds: number[]) => {
      for (const id of nodeIds) {
        onEdgeClick(id)
      }
      setIsAllSelected(true)
    },
    [onEdgeClick]
  )

  const [isAllSelected, setIsAllSelected] = useState(false)

  useEffect(() => {
    setIsAllSelected(false)
  }, [])

  const currentCounter = useMemo(() => {
    return Object.values(filteredNodes).flatMap((nes) =>
      nes.filter((ne) => neighbourhood.has(ne.id))
    ).length
  }, [filteredNodes, neighbourhood])

  const unloaded = Object.values(edgeCounts)
    .flat()
    .reduce((sum, a) => sum + a, 0)

  return (
    <TuringNodeCard
      title={title}
      searchable
      canSelectAll={!isAllSelected}
      counter={{
        current: currentCounter,
        max: Object.values(filteredNodes).flat().length,
        unloaded: unloaded - Object.values(filteredNodes).flat().length,
      }}
      onSelectAll={() =>
        handleToggleEdges(
          Object.entries(filteredNodes).flatMap((edges) => edges[1].map((e) => e.id))
        )
      }
      selectAllLabel={!isAllSelected ? 'Select all' : 'All selected'}
      onSearch={onSearch}
      onSearchClear={onSearchClear}
    >
      <div className="flex flex-col">
        {empty ? (
          <p className="text-content-primary py-2 text-center leading-[1.5] font-medium tracking-[0.01em]">
            No results found.
          </p>
        ) : (
          Object.entries(filteredNodes).map(([nodeType, nodes]) => (
            <TuringNodeEdgeGroup
              key={nodeType}
              nodes={nodes}
              type={nodeType}
              edgeCounts={edgeCounts}
              onEdgeClick={onEdgeClick}
              incrementPage={incrementPage}
            />
          ))
        )}
      </div>
    </TuringNodeCard>
  )
}
