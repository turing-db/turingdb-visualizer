import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useVisStore, useAppStore } from '@/stores'
import { useGraphEntityIDs } from './use-graph-entity-ids'
import { getEdges, getNodes } from '@/api'
import type { GetEdgesResponse, GetNodesResponse } from '@/api/responses'
import type { NodeEntry } from '@/api/models/nodeEntry.model'
import type { EdgeEntry } from '@/api/models/edgeEntry.model'
import useGraphInfo from './use-graph-info'

type NodeToFetch = {
  id: number
  entry: NodeEntry | undefined
}

type EdgeToFetch = {
  id: number
  entry: EdgeEntry | undefined
}

export const useGraphEntities = () => {
  const entityCache = useVisStore((state) => state.entityCache)
  const graphName = useAppStore((state) => state.graphName)
  const graph = useGraphInfo(graphName)

  const { nodeIDs, edgeIDs } = useGraphEntityIDs()

  // Stable key: use counts to avoid re-fetches when array references change
  const entityKey = `${nodeIDs.length}:${edgeIDs.length}`

  return useQuery({
    queryKey: ['graph-entities', graph.info?.name, entityKey],
    queryFn: async () => {
      if (!graph.info) return

      // Find missing nodes and edges that need to be fetched
      const cacheNodes = [...nodeIDs.values()].map(
        (id) => ({ id: id, entry: entityCache.nodes.get(id) }) as NodeToFetch
      )

      const cacheEdges = [...edgeIDs.values()].map(
        (id) => ({ id: id, entry: entityCache.edges.get(id) }) as EdgeToFetch
      )

      const missingNodesFromCache = cacheNodes.filter((node) => node.entry === undefined)
      const missingEdgesFromCache = cacheEdges.filter((edge) => edge.entry === undefined)

      const newCacheNodes =
        missingNodesFromCache.length > 0
          ? await getNodes({
              graph: graph.info.name,
              nodeIDs: [...missingNodesFromCache.map((node) => node.id)],
            })
          : ({} as GetNodesResponse)

      const newCacheEdges =
        missingEdgesFromCache.length > 0
          ? await getEdges({
              graph: graph.info.name,
              edgeIDs: [...missingEdgesFromCache.map((edge) => edge.id)],
            })
          : ({} as GetEdgesResponse)

      for (const node of missingNodesFromCache) {
        node.entry = newCacheNodes[node.id]
        entityCache.nodes.set(node.id, node.entry)
      }

      for (const edge of missingEdgesFromCache) {
        edge.entry = newCacheEdges[edge.id]
        entityCache.edges.set(edge.id, edge.entry)
      }

      const graphNodes = new Map<number, NodeEntry>(
        cacheNodes
          .map((n) => n.entry)
          .filter((entry) => entry !== undefined)
          .map((entry) => [entry.id, entry])
      )

      const graphEdges = new Map<number, EdgeEntry>(
        cacheEdges
          .map((e) => e.entry)
          .filter((entry) => entry !== undefined)
          .map((entry) => [entry[0], entry])
      )

      return {
        graphNodes,
        graphEdges,
      }
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export default useGraphEntities
