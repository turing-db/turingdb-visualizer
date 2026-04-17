import { listNodes } from '@/api'
import type { ListNodesResponse } from '@/api/responses'
import useGraphInfo from '@/hooks/use-graph-info'
import { useAppStore } from '@/stores'
import { useInfiniteQuery } from '@tanstack/react-query'

const NODES_PER_PAGE = 30

const defaultPage: ListNodesResponse = { data: {}, nodeCount: 0, reachedEnd: true }

export const useHierarchyNodesQuery = (labels: string[], enabled: boolean) => {
  const graphName = useAppStore((state) => state.graphName)
  const graph = useGraphInfo(graphName)

  const query = useInfiniteQuery({
    queryKey: ['hierarchy-nodes', graph.info?.name, labels],
    queryFn: async ({ pageParam, signal }) => {
      if (!graph.info) return defaultPage
      return listNodes({
        graph: graph.info.name,
        labels,
        skip: NODES_PER_PAGE * pageParam,
        limit: NODES_PER_PAGE,
        signal,
      })
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.reachedEnd) return undefined
      return lastPageParam + 1
    },
    enabled: enabled && !!graph.info,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  return query
}
