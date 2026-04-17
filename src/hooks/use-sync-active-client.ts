import queryClient from '@/query-client'
import { useAppStore } from '@/stores/app.store'
import { useClientsStore } from '@/stores/clients.store'
import { useEffect } from 'react'

// Whenever the active TuringDB client changes, clear per-client state: the
// React Query cache (which is keyed by graph name, not client) and the
// currently selected graph, since it belongs to the previous instance.
export const useSyncActiveClient = () => {
  useEffect(() => {
    let prev = useClientsStore.getState().activeClientId
    return useClientsStore.subscribe((state) => {
      if (state.activeClientId === prev) return
      prev = state.activeClientId
      useAppStore.getState().setGraphName(undefined)
      queryClient.clear()
    })
  }, [])
}
