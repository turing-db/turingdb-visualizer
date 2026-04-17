import { create } from 'zustand'

export type PageType = 'viewer' | 'help' | 'databases'
export type ThemeType = 'dark' | 'light'

export type AppStore = {
  theme: ThemeType
  setTheme: (v: ThemeType) => void

  page: PageType
  setPage: (v: PageType) => void

  graphName: string | undefined
  setGraphName: (v: string | undefined) => void
}

export const useAppStore = create<AppStore>((set) => ({
  theme: 'dark' as ThemeType,
  setTheme: (v: ThemeType) => set({ theme: v }),

  page: 'viewer' as PageType,
  setPage: (v: PageType) => set({ page: v }),

  graphName: undefined,
  setGraphName: (v: string | undefined) => set({ graphName: v }),
}))

export default useAppStore
