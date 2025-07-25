import { useAuth0 } from '@auth0/auth0-react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/__authenticated/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user, logout } = useAuth0()

  return (
    <div>
      Hello "/__authenticated/dashboard"!{' '}
      <div>
        {user && (
          <div>
            <h1>Welcome {user.name}</h1>
            <img src={user.picture} alt={user.name} />
            <p>{user.email}</p>
            <p>{user.sub}</p>
          </div>
        )}
        <button
          type="button"
          onClick={() =>
            logout({
              logoutParams: {
                returnTo: window.location.origin,
              },
            })
          }
          className="bg-yellow-300"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
