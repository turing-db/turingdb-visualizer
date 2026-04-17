import { useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { listNodes } from '@/api'
import { useAppStore, useCanvasStore, useVisStore } from '@/stores'
import useGraphInfo from '@/hooks/use-graph-info'
import { NODE_DISPLAY_NAMES, getNodeName } from '@/utils/nodes'

const SEARCH_LIMIT = 100

// Mutation hook that runs a free-text node search — plugs into the same
// neighbourhood.reset + neighbourhood.add pipeline used by useCypherQuery so
// the downstream render/spinner flow is identical.
export const useNodeSearch = () => {
  const graphName = useAppStore((state) => state.graphName)
  const graph = useGraphInfo(graphName)
  const neighbourhood = useVisStore((state) => state.neighbourhood)
  const entityCache = useVisStore((state) => state.entityCache)
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

      // Fast path: if the term already matches a node currently in view,
      // just focus on it — don't disturb the existing neighbourhood.
      const needle = term.toLowerCase()
      for (const id of neighbourhood.keys()) {
        const node = entityCache.nodes.get(id)
        if (!node) continue
        const nameProp = getNodeName(node.properties)
        if (!nameProp || nameProp.value === null) continue
        if (String(nameProp.value).toLowerCase().includes(needle)) {
          return { nodeIDs: [id], fromView: true }
        }
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

      return { nodeIDs, fromView: false }
    },
    onSuccess: async ({ nodeIDs, fromView }) => {
      if (!graphName) {
        setGraphLoading(false)
        return
      }

      if (fromView) {
        setGraphLoading(false)
        canvasActions.focusNode(nodeIDs[0], 800)
        return
      }

      neighbourhood.reset(graphName)
      if (nodeIDs.length === 0) {
        setGraphLoading(false)
        return
      }

      await neighbourhood.add([...new Set(nodeIDs)])

      const duration = Math.min(800 + nodeIDs.length * 5, 4000)
      canvasActions.focusNode(nodeIDs[0], duration)
    },
  })

  return {
    ...mutation,
    canSearch: !!defaultPropertyType,
  }
}

export default useNodeSearch
