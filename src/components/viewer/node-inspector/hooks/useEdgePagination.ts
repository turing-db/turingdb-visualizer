import type { EdgeTypeID } from '@/api/args'
import { useCallback, useState } from 'react'

export class PageByEdgeTypeMap extends Map<EdgeTypeID, number> {}

export type NodeEdgesPagination = {
  countPerPage: number
  pageByEdgeType: PageByEdgeTypeMap
}

const defaultPagination = (): NodeEdgesPagination => ({
  countPerPage: 8,
  pageByEdgeType: new PageByEdgeTypeMap(),
})

export const useEdgePagination = () => {
  const [pagination, setAllPaginations] = useState(defaultPagination())

  const incrementPage = useCallback((type: number) => {
    setAllPaginations((state) => {
      const page = state.pageByEdgeType.get(type) ?? 0
      state.pageByEdgeType.set(type, page + 1)
      return { ...state }
    })
  }, [])

  return {
    incrementPage,
    pagination,
  }
}
