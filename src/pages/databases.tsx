import { Icon } from '@blueprintjs/core'
import { useState } from 'react'

import { TuringButton } from '@/components/base/turing-button'
import TuringInput from '@/components/base/turing-input'
import { useClientsStore } from '@/stores/clients.store'

const LOCAL_API_PORT = Number(import.meta.env.VITE_TURING_API_PORT ?? 6666)

export const TDatabasesPage = () => {
  const clients = useClientsStore((s) => s.clients)
  const activeClientId = useClientsStore((s) => s.activeClientId)
  const addClient = useClientsStore((s) => s.addClient)
  const removeClient = useClientsStore((s) => s.removeClient)
  const setActiveClient = useClientsStore((s) => s.setActiveClient)

  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | undefined>()

  const onAdd = () => {
    const trimmedName = name.trim()
    const trimmedUrl = url.trim()
    if (!trimmedName || !trimmedUrl) {
      setError('Name and URL are required.')
      return
    }
    try {
      new URL(trimmedUrl)
    } catch {
      setError('URL must be a valid http(s) address.')
      return
    }
    addClient({ name: trimmedName, url: trimmedUrl })
    setName('')
    setUrl('')
    setError(undefined)
  }

  const launchLocal = () => {
    // Hands off to the local `turingdb://` URL handler registered by
    // install.sh. The handler starts a TuringDB server on the given port.
    window.location.href = `turingdb://start?port=${LOCAL_API_PORT}`
  }

  return (
    <div className="text-content-primary flex flex-1 flex-col overflow-auto p-8">
      <div className="mx-auto flex w-full max-w-[720px] flex-col space-y-8">
        <header className="flex items-center space-x-3">
          <Icon icon="database" size={24} />
          <h1 className="text-xl font-bold">Databases</h1>
        </header>

        <section className="flex flex-col space-y-3">
          <h2 className="text-content-secondary text-sm font-semibold uppercase">Instances</h2>
          <div className="border-grey-700 divide-grey-700 bg-grey-800 divide-y rounded-md border">
            {clients.map((client) => {
              const isActive = client.id === activeClientId
              const isLocal = client.id === 'local'
              return (
                <div key={client.id} className="flex items-center space-x-3 px-4 py-3">
                  <Icon
                    icon={isActive ? 'tick-circle' : 'circle'}
                    intent={isActive ? 'success' : 'none'}
                  />
                  <div className="flex flex-1 flex-col">
                    <span className="font-medium">{client.name}</span>
                    <span className="text-content-secondary text-xs">
                      {client.url || `http://localhost:${LOCAL_API_PORT} (proxied)`}
                    </span>
                  </div>
                  {!isActive && (
                    <TuringButton onClick={() => setActiveClient(client.id)}>Use</TuringButton>
                  )}
                  {!isLocal && (
                    <TuringButton borderless icon="trash" onClick={() => removeClient(client.id)} />
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section className="flex flex-col space-y-3">
          <h2 className="text-content-secondary text-sm font-semibold uppercase">
            Add remote instance
          </h2>
          <div className="bg-grey-800 border-grey-700 flex flex-col space-y-3 rounded-md border p-4">
            <TuringInput
              placeholder="Name (e.g. Staging)"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
            />
            <TuringInput
              placeholder="http://host:6666"
              value={url}
              onChange={(e) => setUrl(e.currentTarget.value)}
            />
            {error && <span className="text-red-400 text-xs">{error}</span>}
            <TuringButton onClick={onAdd} highlight className="self-start">
              Add instance
            </TuringButton>
          </div>
        </section>

        <section className="flex flex-col space-y-3">
          <h2 className="text-content-secondary text-sm font-semibold uppercase">
            Launch local TuringDB
          </h2>
          <div className="bg-grey-800 border-grey-700 flex flex-col space-y-3 rounded-md border p-4">
            <p className="text-content-secondary text-sm">
              Starts a TuringDB server on your machine on port {LOCAL_API_PORT}. Requires the{' '}
              <code className="bg-grey-900 rounded px-1">turingdb://</code> URL handler installed by{' '}
              <code className="bg-grey-900 rounded px-1">install.sh</code>.
            </p>
            <TuringButton icon="play" highlight onClick={launchLocal} className="self-start">
              Launch local instance
            </TuringButton>
          </div>
        </section>
      </div>
    </div>
  )
}

export default TDatabasesPage
