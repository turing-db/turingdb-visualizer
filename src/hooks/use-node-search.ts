import { useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { listNodes } from '@/api'
import { useAppStore, useCanvasStore, useVisStore } from '@/stores'
import useGraphInfo from '@/hooks/use-graph-info'
import { NODE_DISPLAY_NAMES } from '@/utils/nodes'

const SEARCH_LIMIT = 100

// Mutation hook that runs a free-text node search — plugs into the same
// neighbourhood.reset + neighbourhood.add pipeline used by useCypherQuery so
// the downstream render/spinner flow is identical.
export const useNodeSearch = () => {
  const graphName = useAppStore((state) => state.graphName)
  const graph = useGraphInfo(graphName)
  const neighbourhood = useVisStore((state) => state.neighbourhood)
  const setGraphLoading = useVisStore((state) => state.setGraphLoading)
  const canvasActions = useCanvasStore((state) => state.actions)

  // Default search property: the first NODE_DISPLAY_NAMES entry that exists
  // in this graph's schema (e.g. 'name', 'displayName', 'title').
  const defaultPropertyType = useMemo(
    () => NODE_DISPLAY_NAMES.find((ndn) => graph.info?.propTypes.some((p) => p === ndn)),
    [graph.info?.propTypes]
  )

  const mutation = useMutation({
    onMutate: () => {
      setGraphLoading(true)
    },
    onError: () => {
      setGraphLoading(false)
    },
    mutationFn: async (term: string) => {
      if (!graphName || !graph.info) {
        throw new Error('No graph selected')
      }
      if (!defaultPropertyType) {
        throw new Error('No searchable name-like property in this graph')
      }

      const properties = new Map<string, string>([[defaultPropertyType, term]])
      const res = await listNodes({
        graph: graph.info.name,
        labels: [],
        properties,
        limit: SEARCH_LIMIT,
      })

      const nodeIDs = Object.values(res.data)
        .map((n) => n.id)
        .filter((id): id is number => typeof id === 'number')

      return { nodeIDs }
    },
    onSuccess: async ({ nodeIDs }) => {
      if (!graphName) {
        setGraphLoading(false)
        return
      }

      neighbourhood.reset(graphName)
      if (nodeIDs.length === 0) {
        setGraphLoading(false)
        return
      }

      await neighbourhood.add([...new Set(nodeIDs)])

      const duration = Math.min(800 + nodeIDs.length * 5, 4000)
      canvasActions.autoFit(duration)
    },
  })

  return {
    ...mutation,
    canSearch: !!defaultPropertyType,
  }
}

export default useNodeSearch
