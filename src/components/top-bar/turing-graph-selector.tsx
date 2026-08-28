import { listAvailableGraphs } from '@/api'
import { type FC, useCallback, useEffect, useMemo, useState } from 'react'
import { TuringSelect } from '../base/turing-select'
import type { TuringSelectItem } from '../base/turing-select-item'

import useGraphInfo from '@/hooks/use-graph-info'
import { useSelectedChips } from '../turing-bar/use-selected-chips'
import { useAppStore, useCanvasStore, useVisStore } from '@/stores'
import type { CanvasStore } from '@turingcanvas'

export const TuringGraphSelector: FC = () => {
  const entityCache = useVisStore((state) => state.entityCache)
  const neighbourhood = useVisStore((state) => state.neighbourhood)
  const hiddenNodes = useVisStore((state) => state.hiddenNodes)

  const graphName = useAppStore((state) => state.graphName)
  const setGraphName = useAppStore((state) => state.setGraphName)
  const turingActions = useCanvasStore((state: CanvasStore) => state.actions)
  const { refetch } = useGraphInfo(graphName)

  const [graphs, setGraphs] = useState<string[]>([])
  // A failed graph list must not render as 'no graphs'. Upstream logged the
  // error to the console and showed the empty state, so a server that is
  // down looks identical to a server with nothing in it.
  const [loadError, setLoadError] = useState<string | null>(null)

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
        // Honour `?graph=` on first load. Upstream has no URL handling at all,
        // so a deep link into a specific graph -- which is the whole point of
        // `codegraph viz` -- lands on "No graph selected" and silently does
        // nothing. Only auto-select a graph the server actually reports.
        const wanted = new URLSearchParams(window.location.search).get('graph')
        if (wanted && !graphName && data.includes(wanted)) {
          onItemSelect({ name: wanted } as TuringSelectItem)
        }
      })
      .catch((err: unknown) => {
        const e = err as { message?: string }
        setLoadError(e?.message ?? String(err))
      })
  }, [graphName, onItemSelect])

  if (loadError) {
    return (
      <span
        role="alert"
        title={loadError}
        className="rounded border border-red-500 px-2 py-1 text-xs text-red-400"
      >
        server unreachable
      </span>
    )
  }

  return (
    <TuringSelect items={availGraphs} onItemSelect={onItemSelect}>
      {graphName !== undefined ? graphName : 'Graph'}
    </TuringSelect>
  )
}
