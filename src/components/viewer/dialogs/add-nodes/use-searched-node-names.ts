import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useAppStore } from '@/stores'
import { useGraphInfo } from '@/hooks/use-graph-info'

import { NODE_DISPLAY_NAMES } from '@/utils/nodes'
import { listNodes } from '@/api'
import { getNodeName } from '@/utils/nodes'
import { useDebounce } from '@/hooks/use-debounce'

const NODES_PER_REQ = 30

export const useNodeChips = () => {
  const [searchedName, setSearchedName] = useState('')
  const graphName = useAppStore((state) => state.graphName)
  const graph = useGraphInfo(graphName)
  const [debouncedSearchName, searchedNameLoading] = useDebounce(searchedName, 250)

  const defaultPropertyType = useMemo(() => {
    return NODE_DISPLAY_NAMES.find((ndn) => graph.info?.propTypes.some((prop) => prop === ndn))
  }, [graph.info?.propTypes])

  const nodeChipsQuery = useQuery({
    queryKey: ['searched-node-names', debouncedSearchName, graph.info?.name, defaultPropertyType],
    queryFn: async ({ signal }) => {
      if (defaultPropertyType === undefined) return []
      const properties = new Map<string, string>([[defaultPropertyType, debouncedSearchName]])
      const info = graph.info
      if (!info) return undefined

      const response = await listNodes({
        graph: info.name,
        labels: [],
        limit: NODES_PER_REQ,
        properties,
        signal,
      })

      const nodeNames = Object.values(response.data)
        .map((n) => getNodeName(n.properties))
        .filter((name) => name !== null)
        .map((name) => name.value)
        .filter((name) => name !== null)
        .map((name) => name.toString())

      const uniqueNames = nodeNames.filter((name, index) => nodeNames.indexOf(name) === index)
      return uniqueNames.map((name) => ({
        text: defaultPropertyType,
        value: name,
      }))
    },

    staleTime: 5 * 1000 * 60,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  return {
    nodeChips: nodeChipsQuery.data || [],
    searchedName,
    setSearchedName,
    loadingChips: nodeChipsQuery.isPending || searchedNameLoading,
  }
}
