// EMERGENCY: Working turingcanvas module
console.log('🔍 EMERGENCY turingcanvas loading...')

export * from './canvas'
export * from './store'

// Minimal working implementations
export const TuringContextProvider = ({ children }) => {
  console.log('🔍 TuringContextProvider active')
  return children
}

export const useTuringContext = () => {
  console.log('🔍 useTuringContext called')
  return {
    instance: {
      nodes: [],
      edges: [],
      nodeMap: new Map(),
      edgeMap: new Map(),
      addNodes: () => {},
      addEdges: () => {},
      delNode: () => {},
      delEdge: () => {},
      makePrimary: () => {},
      makeSecondary: () => {},
      init: () => {},
      disconnect: () => {}
    }
  }
}

export const TuringCanvas = ({ id, className }) => {
  console.log('🔍 TuringCanvas rendering')
  return React.createElement('div', 
    { className: `flex-1 p-0 m-0 h-full w-full relative ${className}`, style: { backgroundColor: '#ff0000', minHeight: '400px' } },
    React.createElement('canvas', { id, className: 'absolute left-0 top-0 w-full h-full' })
  )
}

export const useCanvasStore = () => ({
  resetStates: () => {},
  init: () => {}
})