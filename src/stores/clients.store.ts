import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TuringClient = {
  id: string
  name: string
  // Base URL of the TuringDB HTTP API (no trailing slash). Empty string means
  // "use the Vite dev proxy at /api" — the local default shipped with the app.
  url: string
}

export type ClientsStore = {
  clients: TuringClient[]
  activeClientId: string

  addClient: (client: Omit<TuringClient, 'id'>) => string
  removeClient: (id: string) => void
  setActiveClient: (id: string) => void
  updateClient: (id: string, patch: Partial<Omit<TuringClient, 'id'>>) => void
}

const DEFAULT_LOCAL: TuringClient = {
  id: 'local',
  name: 'Local',
  url: '',
}

const makeId = () => `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

export const useClientsStore = create<ClientsStore>()(
  persist(
    (set) => ({
      clients: [DEFAULT_LOCAL],
      activeClientId: DEFAULT_LOCAL.id,

      addClient: (client) => {
        const id = makeId()
        set((state) => ({ clients: [...state.clients, { id, ...client }] }))
        return id
      },

      removeClient: (id) =>
        set((state) => {
          if (id === DEFAULT_LOCAL.id) return state
          const clients = state.clients.filter((c) => c.id !== id)
          const activeClientId =
            state.activeClientId === id ? DEFAULT_LOCAL.id : state.activeClientId
          return { clients, activeClientId }
        }),

      setActiveClient: (id) =>
        set((state) => {
          if (!state.clients.some((c) => c.id === id)) return state
          return { activeClientId: id }
        }),

      updateClient: (id, patch) =>
        set((state) => ({
          clients: state.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
    }),
    {
      name: 'turing-clients',
      version: 1,
    }
  )
)

export const getActiveClient = (): TuringClient => {
  const { clients, activeClientId } = useClientsStore.getState()
  return clients.find((c) => c.id === activeClientId) ?? DEFAULT_LOCAL
}

export const getActiveApiBase = (): string => {
  const client = getActiveClient()
  return client.url ? client.url.replace(/\/$/, '') : '/api'
}

export default useClientsStore
