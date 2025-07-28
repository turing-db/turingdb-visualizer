import { getGraphStatus, listEdgeTypes, listLabels, listPropertyTypes } from '@/api'
import queryClient from '@/query-client'
import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'

const defaultGraphInfo = {
  name: '',
  loaded: false,
  loading: false,
  edgeTypes: [] as string[],
  propTypes: [] as string[],
  labels: [] as string[],
}

export const useGraphInfo = (graph: string | undefined) => {
  const query = useQuery({
    queryKey: ['graph-status', graph],
    queryFn: async () => {
      if (graph === undefined) return null

      const info = { ...defaultGraphInfo }
      info.name = graph

      const status = await getGraphStatus({ graph: graph })

      if (!status) {
        return {
          ...info,
        }
      }

      if (!status.isLoaded) {
        info.loading = status.isLoading
        return info
      }

      const edgeTypes = await listEdgeTypes({ graph: graph })
      const propTypes = await listPropertyTypes({ graph: graph })
      const labels = (await listLabels({ graph: graph })).labels

      info.loaded = true
      info.edgeTypes = edgeTypes
      info.propTypes = propTypes
      info.labels = labels

      return info
    },
    refetchOnWindowFocus: true,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000,
  })

  const invalidate = useCallback((graph: string) => {
    queryClient.invalidateQueries({ queryKey: ['graph-status', graph] })
  }, [])

  return {
    info: query.data,
    refetch: query.refetch,
    invalidate,
  }
}

export default useGraphInfo
