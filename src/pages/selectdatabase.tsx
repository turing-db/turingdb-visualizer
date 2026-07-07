import React from 'react'

import { Icon, Spinner } from '@blueprintjs/core'
import { loadGraph } from '@/api'
import { useAppStore } from '@/stores/app.store'
import { TuringButton } from '@/components/base/turing-button'
import useGraphInfo from '@/hooks/use-graph-info'
import { useQuery } from '@tanstack/react-query'

export const TSelectDatabasePage: React.FC = () => {
  const graphName = useAppStore((state) => state.graphName)
  const { info, invalidate } = useGraphInfo(graphName)
  const [triggered, setTriggered] = React.useState(false)

  const loadGraphQuery = useQuery({
    queryKey: ['loadGraph', graphName],
    queryFn: async () => {
      setTriggered(false)
      if (graphName === undefined) return {}

      try {
        await loadGraph({ graph: graphName })
      } catch {
        // A missing or already-loaded graph rejects here; the UI reflects the
        // real state via the graph-info refresh below, so swallow it (the old
        // /load_graph endpoint's error response was likewise ignored).
      }
      invalidate(graphName)
      return {}
    },
    enabled: triggered,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Number.POSITIVE_INFINITY,
  })

  return (
    <div className="text-grey-600 flex flex-1 flex-col justify-center self-center">
      <div className="align-center flex flex-col justify-center space-y-6">
        <Icon icon="database" size={50} className="self-center" />

        {graphName === undefined || !info ? (
          <span className="self-center font-bold">Select a database to start</span>
        ) : info.loading || loadGraphQuery.isFetching ? (
          <Spinner size={50} intent={'success'} className="self-center" />
        ) : (
          <TuringButton className="self-center" onClick={() => setTriggered(true)}>
            Load {graphName}
          </TuringButton>
        )}
      </div>
    </div>
  )
}
