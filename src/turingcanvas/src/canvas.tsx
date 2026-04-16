import React, { useContext, useEffect } from 'react'
import { useStore } from 'zustand'
import { TuringInstance } from './instance'
import { type CanvasStore, type CanvasStoreApi, createCanvasStore } from './store'
import type { PartialTuringUserEvents } from './types'

export type TuringContextProviderProps = {
  children: React.ReactNode
}

export type TuringContextType = {
  instance: TuringInstance
  store: CanvasStoreApi
}

export const TuringContext = React.createContext<TuringContextType | null>(null)

export const TuringContextProvider: React.FC<TuringContextProviderProps> = (props) => {
  const [turing] = React.useState<TuringContextType>(() => {
    const instance = new TuringInstance()
    const store = createCanvasStore(instance)
    return { instance, store }
  })

  if (import.meta.env.DEV) {
    ;(window as unknown as { __turing?: TuringContextType }).__turing = turing
  }

  return <TuringContext.Provider value={turing}>{props.children}</TuringContext.Provider>
}

export const useTuringContext = () => {
  const ctx = React.useContext(TuringContext)
  if (!ctx) {
    throw new Error('useTuringContext must be used within a TuringContextProvider')
  }
  return ctx
}

export function useCanvasStore<T>(selector: (state: CanvasStore) => T): T {
  const ctx = React.useContext(TuringContext)
  if (!ctx) {
    throw new Error('useCanvasStore must be used within a TuringContextProvider')
  }
  return useStore(ctx.store, selector)
}

export interface TuringCanvasProps {
  id: string
  className?: string
  events: PartialTuringUserEvents
}

export type Events = TuringCanvasProps['events']

export const TuringCanvas: React.FC<TuringCanvasProps> = (props) => {
  const turing = useContext(TuringContext)

  useEffect(() => {
    if (!turing) return

    const canvas = document.getElementById(props.id)

    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error(`Could not initialize turing canvas: could not find canvas of id ${props.id}`)
    }

    turing.instance.init(canvas as HTMLCanvasElement, props.events)
    return () => turing.instance.disconnect()
  }, [turing, props.id, props.events])

  return (
    <div className={`flex-1 p-0 m-0 h-full w-full relative ${props.className}`}>
      <canvas id={props.id} className="absolute left-0 top-0 w-full h-full" />
    </div>
  )
}
