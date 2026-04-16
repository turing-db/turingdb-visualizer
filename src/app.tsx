import './style.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { BlueprintProvider } from '@blueprintjs/core'
import { FocusStyleManager } from '@blueprintjs/core'
import { TuringContextProvider } from '@turingcanvas'
import { TuringFrame } from '@/components/turing-frame'
import { TuringLayout } from '@/components/turing-layout'
import { useAppStore } from '@/stores/app.store'
import queryClient from '@/query-client'

FocusStyleManager.onlyShowFocusOnTabs()

export function App() {
  const theme = useAppStore((state) => state.theme)

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
