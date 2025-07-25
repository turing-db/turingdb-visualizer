import React, { useContext, useEffect } from 'react'
import { TuringInstance } from './instance'
import type { PartialTuringUserEvents } from './types'
import { useCanvasStore } from './store'

export type TuringContextProviderProps = {
  children: React.ReactNode
}

export type TuringContextType = {
  instance: TuringInstance
}

export const TuringContext = React.createContext<TuringContextType>({
  instance: new TuringInstance(),
})

export const TuringContextProvider: React.FC<TuringContextProviderProps> = (props) => {
  try {
    console.log('🔍 DEBUG: TuringContextProvider rendering...')
    const [turing] = React.useState<TuringContextType>({
      instance: new TuringInstance(),
    })
    console.log('🔍 DEBUG: TuringInstance created successfully:', turing.instance)

    return <TuringContext.Provider value={turing}>{props.children}</TuringContext.Provider>
  } catch (error) {
    console.error('❌ Error in TuringContextProvider:', error)
    throw error
  }
}

export const useTuringContext = () => {
  return React.useContext(TuringContext)
}

export interface TuringCanvasProps {
  id: string
  className?: string
  events: PartialTuringUserEvents
}

export type Events = TuringCanvasProps['events']

export const TuringCanvas: React.FC<TuringCanvasProps> = (props) => {
  const turing = useContext(TuringContext)
  const canvasStore = useCanvasStore((state: any) => state)

  useEffect(() => {
    console.log('🔍 TuringCanvas useEffect starting...')
    const canvas = document.getElementById(props.id)

    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error(`Could not initialize turing canvas: could not find canvas of id ${props.id}`)
    }

    console.log('🔍 Found canvas element, initializing instance...')
    turing.instance.init(canvas as HTMLCanvasElement, props.events)
    
    console.log('🔍 Connecting instance to store...')
    canvasStore.init(turing.instance)
    
    return () => turing.instance.disconnect()
  }, [turing, props.id, props.events, canvasStore])

  return (
    <div className={`flex-1 p-0 m-0 h-full w-full relative ${props.className}`}>
      <canvas id={props.id} className="absolute left-0 top-0 w-full h-full" />
    </div>
  )
}
