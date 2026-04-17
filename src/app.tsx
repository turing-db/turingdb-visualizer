import './style.css'

import { TuringFrame } from '@/components/turing-frame'
import { TuringLayout } from '@/components/turing-layout'
import { useSyncActiveClient } from '@/hooks/use-sync-active-client'
import queryClient from '@/query-client'
import { useAppStore } from '@/stores/app.store'
import { BlueprintProvider } from '@blueprintjs/core'
import { FocusStyleManager } from '@blueprintjs/core'
import { QueryClientProvider } from '@tanstack/react-query'
import { TuringContextProvider } from '@turingcanvas'

FocusStyleManager.onlyShowFocusOnTabs()

export function App() {
  const theme = useAppStore((state) => state.theme)
  useSyncActiveClient()

  return (
    <QueryClientProvider client={queryClient}>
      <TuringContextProvider>
        <TuringLayout>
          <BlueprintProvider portalClassName={theme === 'dark' ? 'bp5-dark' : 'bp5-light'}>
            <TuringFrame />
          </BlueprintProvider>
        </TuringLayout>
      </TuringContextProvider>
    </QueryClientProvider>
  )
}
