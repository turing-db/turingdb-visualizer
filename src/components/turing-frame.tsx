import { useMemo } from 'react'

import { useAppStore } from '@/stores'

import useGraphInfo from '@/hooks/use-graph-info'
import { TDatabasesPage } from '@/pages/databases'
import { TSelectDatabasePage } from '@/pages/selectdatabase'
import { TViewerPage } from '@/pages/viewer'

export const TuringFrame = () => {
  const page = useAppStore((state) => state.page)
  const graphName = useAppStore((state) => state.graphName)
  const graph = useGraphInfo(graphName)

  const content = useMemo(() => {
    if (page === 'databases') {
      return <TDatabasesPage />
    }

    if (!graph.info || !graph.info.loaded) {
      return <TSelectDatabasePage />
    }

    switch (page) {
      case 'viewer':
        return <TViewerPage />
    }
  }, [graph.info, page])

  return <div className="bg-grey-900 flex h-full flex-1 p-0">{content}</div>
}
