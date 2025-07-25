import { listAvailableGraphs } from '@/api'
import { type FC, useCallback, useEffect, useMemo, useState } from 'react'
import { TuringSelect } from '../base/turing-select'
import type { TuringSelectItem } from '../base/turing-select-item'

import useGraphInfo from '@/hooks/use-graph-info'
import { useSelectedChips } from '../turing-bar/use-selected-chips'
import { useAppStore, useCanvasStore, useVisStore } from '@/stores'

export const TuringGraphSelector: FC = () => {
  const entityCache = useVisStore((state) => state.entityCache)
  const neighbourhood = useVisStore((state) => state.neighbourhood)
  const hiddenNodes = useVisStore((state) => state.hiddenNodes)

  const graphName = useAppStore((state: any) => state.graphName)
  const setGraphName = useAppStore((state) => state.setGraphName)
  const turingActions = useCanvasStore((state: any) => state.actions)
  const { refetch } = useGraphInfo(graphName)

  const [graphs, setGraphs] = useState<string[]>([])

  const availGraphs = useMemo(
    () =>
      graphs
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
        .map((graph) => ({ name: graph })),
    [graphs]
  )

  const unselectAllChips = useSelectedChips((state) => state.unselectAllChips)
  const onItemSelect = useCallback(
    (graph: TuringSelectItem) => {
      neighbourhood.reset(graph.name)
      hiddenNodes.clear()
      entityCache.edges.clear()
      entityCache.nodes.clear()
      unselectAllChips()

      turingActions.reset()
      setGraphName(graph.name)
      refetch()
    },
    [
      refetch,
      setGraphName,
      turingActions,
      hiddenNodes,
      neighbourhood,
      entityCache,
      unselectAllChips,
    ]
  )

  useEffect(() => {
    listAvailableGraphs({})
      .then((data) => {
        setGraphs(data)
      })
      .catch((err) => console.log(err))
  }, [])

  return (
    <TuringSelect items={availGraphs} onItemSelect={onItemSelect}>
      {graphName !== undefined ? graphName : 'Graph'}
    </TuringSelect>
  )
}
