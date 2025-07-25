import { Auth0Provider } from '@auth0/auth0-react'
import type { ReactNode } from 'react'

interface TuringAuth0ProviderProps {
  children: ReactNode
}

export function TuringAuth0Provider({ children }: TuringAuth0ProviderProps) {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
  const redirectUri = import.meta.env.VITE_AUTH0_CALLBACK_URL

  if (!domain || !clientId || !redirectUri) {
    throw new Error('Missing Auth0 configuration. Check your environment variables.')
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
      }}
    >
      {children}
    </Auth0Provider>
  )
}
