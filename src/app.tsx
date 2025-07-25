import './style.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { BlueprintProvider } from '@blueprintjs/core'
import { FocusStyleManager } from '@blueprintjs/core'
import { TuringContextProvider } from 'turingcanvas'

console.log('🔍 DEBUG: TuringContextProvider import:', !!TuringContextProvider)
console.log('🔍 DEBUG: App.tsx is loading...')
import { TuringFrame } from '@/components/turing-frame'
import { TuringLayout } from '@/components/turing-layout'
import { ErrorBoundary } from '@/components/error-boundary'
import { useAppStore } from '@/stores/app.store'
import queryClient from '@/query-client'

FocusStyleManager.onlyShowFocusOnTabs()

export function App() {
  console.log('🔍 DEBUG: App component rendering...')
  
  try {
    const theme = useAppStore((state) => state.theme)
    console.log('🔍 DEBUG: Theme loaded successfully:', theme)

    return (
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <TuringLayout>
            <TuringContextProvider>
              <BlueprintProvider portalClassName={theme === 'dark' ? 'bp5-dark' : 'bp5-light'}>
                <TuringFrame />
              </BlueprintProvider>
            </TuringContextProvider>
          </TuringLayout>
        </QueryClientProvider>
      </ErrorBoundary>
    )
  } catch (error) {
    console.error('❌ Error in App component:', error)
    throw error
  }
}
