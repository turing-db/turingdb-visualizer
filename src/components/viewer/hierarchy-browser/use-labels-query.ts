import { listLabels } from '@/api'
import type { ListLabelsResponse } from '@/api/responses'
import useGraphInfo from '@/hooks/use-graph-info'
import { useAppStore } from '@/stores'
import { useQuery } from '@tanstack/react-query'

const defaultLabels: ListLabelsResponse = { labels: [], nodeCounts: [] }

export const useLabelsQuery = (parentLabels: string[], enabled = true) => {
  const graphName = useAppStore((state) => state.graphName)
  const graph = useGraphInfo(graphName)

  return useQuery({
    queryKey: ['hierarchy-labels', graph.info?.name, parentLabels],
    queryFn: async () => {
      if (!graph.info) return defaultLabels
      return listLabels({
        graph: graph.info.name,
        currentLabels: parentLabels,
      })
    },
    enabled: enabled && !!graph.info,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })
}
