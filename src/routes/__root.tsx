import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import queryClient from '@/query-client'
import type { Auth0ContextInterface } from '@auth0/auth0-react'

interface RootRouterContext {
  auth: Auth0ContextInterface
}

export const Route = createRootRouteWithContext<RootRouterContext>()({
  component: App,
})

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  )
}
