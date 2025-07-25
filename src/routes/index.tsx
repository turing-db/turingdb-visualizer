import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    const { isAuthenticated, loginWithRedirect } = context.auth

    if (!isAuthenticated) {
      throw loginWithRedirect()
    }

    return {}
  },
})
