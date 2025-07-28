import type { NodeEntry } from '@/api/models/nodeEntry.model'
import { getNodeName } from '@/utils/nodes'
import { useCallback, useState } from 'react'

export const useEdgeSearch = (search: string) => {
  const [internalSearch, setInternalSearch] = useState('')

  const isEdgeSearchMatch = useCallback((search: string, node: NodeEntry) => {
    if (!search.length) {
      return true
    }

    const nodeId = String(node.id)
    const nodeName = String(getNodeName(node.properties)?.value)

    const tests = [nodeId, nodeName].filter(Boolean)

    return tests.some((value: string) =>
      String(value).toLowerCase().trim().includes(search.toLowerCase().trim())
    )
  }, [])

  const isSearchMatch = useCallback(
    (node: NodeEntry) => {
      return isEdgeSearchMatch(search, node) && isEdgeSearchMatch(internalSearch, node)
    },
    [internalSearch, isEdgeSearchMatch, search]
  )

  return { isSearchMatch, setInternalSearch }
}

export default useEdgeSearch
