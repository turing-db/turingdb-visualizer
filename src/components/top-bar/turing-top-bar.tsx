import { useMemo } from 'react'
import { TuringGraphSelector } from './turing-graph-selector'

import useGraphInfo from '@/hooks/use-graph-info'
import { useAppStore } from '@/stores'

export const TuringTopBar = () => {
  const page = useAppStore((state) => state.page)
  const graphName = useAppStore((state) => state.graphName)
  const graph = useGraphInfo(graphName)

  const rightTitle = useMemo(
    () => (graph.info ? graph.info.name : 'No graph selected'),
    [graph.info]
  )
  const leftTitle = useMemo(() => {
    switch (page) {
      case 'viewer':
        return 'Viewing:'
      case 'databases':
        return 'Databases'
      default:
        return ''
    }
  }, [page])

  return (
    <div className="border-grey-900 bg-grey-800 flex items-center space-x-4 border-t border-b p-4">
      <div className="text-content-secondary flex flex-1 items-center space-x-7 font-sans text-sm font-medium">
        <span>{leftTitle}</span>
        <span
          className={
            'border-grey-500 text-content-secondary ml-4 rounded-md border p-1 pr-2 pl-2 text-sm'
          }
        >
          {rightTitle}
        </span>
      </div>
      <TuringGraphSelector />
    </div>
  )
}
