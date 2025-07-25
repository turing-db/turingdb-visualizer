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
    console.log('🔍 Looking for canvas with ID:', props.id)
    
    const canvas = document.getElementById(props.id)
    console.log('🔍 Found canvas element:', canvas)

    if (!(canvas instanceof HTMLCanvasElement)) {
      const errorMsg = `Could not initialize turing canvas: could not find canvas of id ${props.id}`
      console.error('❌', errorMsg)
      throw new Error(errorMsg)
    }

    console.log('🔍 Canvas is valid HTMLCanvasElement')
    console.log('🔍 Canvas dimensions:', canvas.width, 'x', canvas.height)
    console.log('🔍 Turing instance:', turing.instance)
    console.log('🔍 Events object:', props.events)
    
    try {
      console.log('🔍 Calling turing.instance.init...')
      turing.instance.init(canvas as HTMLCanvasElement, props.events)
      console.log('✅ TuringInstance initialized successfully')
      
      console.log('🔍 Connecting instance to store...')
      canvasStore.init(turing.instance)
      console.log('✅ CanvasStore connected successfully')
      
      // Test if canvas is working by adding a test node immediately
      setTimeout(() => {
        console.log('🔍 Testing canvas with immediate test node...')
        try {
          turing.instance.addNodes([{ id: 999, primary: true, data: { label: 'Test Node' } }])
          console.log('✅ Test node added successfully')
        } catch (testError) {
          console.error('❌ Error adding test node:', testError)
        }
      }, 100)
      
    } catch (initError) {
      console.error('❌ Error during canvas initialization:', initError)
      throw initError
    }
    
    return () => {
      console.log('🔍 TuringCanvas cleanup - disconnecting...')
      turing.instance.disconnect()
    }
  }, [turing, props.id, props.events, canvasStore])

  return (
    <div className={`flex-1 p-0 m-0 h-full w-full relative ${props.className}`}>
      <canvas 
        id={props.id} 
        className="absolute left-0 top-0 w-full h-full"
        style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}
      />
    </div>
  )
}
