import { listNodes } from '@/api'
import type { NodeEntry } from '@/api/models/nodeEntry.model'
import useGraphInfo from '@/hooks/use-graph-info'
import { useAppStore } from '@/stores'
import { NODE_DISPLAY_NAMES } from '@/utils/nodes'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

const PREVIEW_LIMIT = 8
const DEBOUNCE_MS = 180

// Debounced, cancellable preview query of nodes matching the current term by
// their default name-like property. Kept lightweight (PREVIEW_LIMIT) — the full
// search via useNodeSearch still handles result-set commits to the canvas.
export const useNodeSearchPreview = (term: string, enabled: boolean) => {
  const graphName = useAppStore((state) => state.graphName)
  const graph = useGraphInfo(graphName)

  const defaultPropertyType = useMemo(
    () => NODE_DISPLAY_NAMES.find((ndn) => graph.info?.propTypes.some((p) => p === ndn)),
    [graph.info?.propTypes]
  )

  const [debounced, setDebounced] = useState(term)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [term])

  const trimmed = debounced.trim()
  const canSearch = !!defaultPropertyType && !!graphName && !!graph.info

  const query = useQuery({
    queryKey: ['node-search-preview', graphName, defaultPropertyType, trimmed],
    enabled: enabled && canSearch && trimmed.length > 0,
    staleTime: 30_000,
    queryFn: async ({ signal }) => {
      const properties = new Map<string, string>([[defaultPropertyType!, trimmed]])
      const res = await listNodes({
        graph: graph.info!.name,
        labels: [],
        properties,
        limit: PREVIEW_LIMIT,
        signal,
      })
      return Object.values(res.data) as NodeEntry[]
    },
  })

  return {
    results: query.data ?? [],
    isLoading: query.isLoading || query.isFetching,
    isTypingAhead: term !== debounced,
    canSearch,
  }
}

export default useNodeSearchPreview
