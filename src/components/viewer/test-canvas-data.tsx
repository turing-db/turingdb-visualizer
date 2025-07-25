import { useEffect } from 'react'
import { useCanvasStore } from 'turingcanvas'

export const TestCanvasData = () => {
  const canvasStore = useCanvasStore((state: any) => state)

  useEffect(() => {
    console.log('🔍 TestCanvasData: Adding test data to canvas...')
    
    // Add a timeout to ensure canvas is initialized
    setTimeout(() => {
      try {
        // Add some test nodes
        const testNodes = [
          { id: 1, primary: true, data: { label: 'Node 1' } },
          { id: 2, primary: true, data: { label: 'Node 2' } },
          { id: 3, primary: false, data: { label: 'Node 3' } },
        ]

        // Add some test edges
        const testEdges = [
          { id: 1, src: 1, tgt: 2, data: { label: 'Edge 1-2' } },
          { id: 2, src: 2, tgt: 3, data: { label: 'Edge 2-3' } },
        ]

        console.log('🔍 TestCanvasData: Canvas store:', canvasStore)
        console.log('🔍 TestCanvasData: Canvas store actions:', canvasStore.actions)
        
        canvasStore.actions.addNodes(testNodes)
        canvasStore.actions.addEdges(testEdges)
        console.log('✅ TestCanvasData: Test data added successfully')
      } catch (error) {
        console.error('❌ TestCanvasData: Error adding test data:', error)
      }
    }, 1000) // Wait 1 second for canvas to initialize
  }, [canvasStore])

  return null
}