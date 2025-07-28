import type { ListNodesResponse } from '@/api/responses'
import type { FilterType } from './use-filters'
import { useAppStore } from '@/stores'
import useGraphInfo from '@/hooks/use-graph-info'
import { useCallback, useMemo } from 'react'
import { type InfiniteData, useInfiniteQuery } from '@tanstack/react-query'
import { listNodes } from '@/api'
import queryClient from '@/query-client'

const NODES_PER_REQ = 30

const defaultNodes: ListNodesResponse = { data: [], nodeCount: 0, reachedEnd: true }

export const useNodesQuery = (filter: FilterType) => {
  const graphName = useAppStore((state) => state.graphName)
  const graph = useGraphInfo(graphName)

  const flatPropTypes = useMemo(() => [...filter.propertyFilters.entries()], [filter])

  const query = useInfiniteQuery({
    queryKey: [
      'explore-nodes',
      graph.info,
      graph.info?.name,
      filter?.labelFilters,
      flatPropTypes,
      filter?.propertyFilters,
    ],

    queryFn: async ({ signal, pageParam }) => {
      if (!graph.info) return defaultNodes

      const res = await listNodes({
        graph: graph.info.name,
        labels: filter?.labelFilters ?? [],
        properties: filter?.propertyFilters ?? new Map(),
        skip: NODES_PER_REQ * pageParam,
        limit: NODES_PER_REQ,
        signal,
      })

      return res
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.reachedEnd) return undefined
      return lastPageParam + 1
    },
    staleTime: 5 * 1000 * 60,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  const resetPage = useCallback(
    () =>
      queryClient.setQueryData(
        [
          'explore-nodes',
          graph.info,
          graph.info?.name,
          filter?.labelFilters,
          flatPropTypes,
          filter?.propertyFilters,
        ],
        (oldData: InfiniteData<ListNodesResponse, unknown> | undefined) => {
          if (oldData === undefined) return undefined

          return {
            ...oldData,
            pages: oldData.pages.slice(0, 1),
            pageParams: oldData.pageParams.slice(0, 1),
          }
        }
      ),
    [graph.info, flatPropTypes, filter?.labelFilters, filter?.propertyFilters]
  )

  return {
    nodes: query.data,
    hasNextPage: query.hasNextPage,
    isFetching: query.isFetching,
    fetchNextPage: query.fetchNextPage,
    resetPage: resetPage,
  }
}
