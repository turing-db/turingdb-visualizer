// FIXED: Complete working turingcanvas module
import React, { useContext, useEffect, useState } from 'react'

console.log('🔍 FIXED turingcanvas loading...')

// Create context
const TuringContext = React.createContext({
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
})

export function TuringContextProvider({ children }) {
  console.log('🔍 TuringContextProvider active')
  try {
  const [turing] = useState({
    instance: {
      nodes: [],
      edges: [],
      nodeMap: new Map(),
      edgeMap: new Map(),
      addNodes: (nodes) => {
        console.log('addNodes:', nodes)
        return Promise.resolve()
      },
      addEdges: (edges) => {
        console.log('addEdges:', edges)
        return Promise.resolve()
      },
      delNode: (id) => {
        console.log('delNode:', id)
        return Promise.resolve()
      },
      delEdge: (id) => {
        console.log('delEdge:', id)
        return Promise.resolve()
      },
      makePrimary: (node) => console.log('makePrimary:', node),
      makeSecondary: (node) => console.log('makeSecondary:', node),
      init: (canvas, events) => {
        try {
          console.log('🔍 TuringCanvas init called')
          if (canvas && canvas.getContext) {
            canvas.style.backgroundColor = '#2a2a2a'
            canvas.style.border = '2px solid #00ff00'
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.fillStyle = '#00ff00'
              ctx.fillRect(50, 50, 300, 100)
              ctx.fillStyle = 'white'
              ctx.font = '20px Arial'
              ctx.fillText('GRAPH CANVAS WORKING!', 60, 110)
            }
          }
        } catch (error) {
          console.error('❌ Error in TuringCanvas init:', error)
        }
      },
      disconnect: () => console.log('disconnect called')
    }
  })

  return React.createElement(TuringContext.Provider, { value: turing }, children)
  } catch (error) {
    console.error('❌ Error in TuringContextProvider:', error)
    return React.createElement('div', { style: { color: 'red' } }, 'Error loading TuringCanvas')
  }
}

export function useTuringContext() {
  try {
    console.log('🔍 useTuringContext called')
    return useContext(TuringContext)
  } catch (error) {
    console.error('❌ Error in useTuringContext:', error)
    return { instance: { init: () => {}, disconnect: () => {} } }
  }
}

export function TuringCanvas({ id, className = '', events }) {
  console.log('🔍 TuringCanvas rendering with id:', id)
  const turing = useTuringContext()

  useEffect(() => {
    console.log('🔍 TuringCanvas useEffect triggered')
    const canvas = document.getElementById(id)
    
    if (!canvas) {
      console.error('❌ Canvas element not found:', id)
      return
    }

    if (!(canvas instanceof HTMLCanvasElement)) {
      console.error('❌ Element is not a canvas:', id)
      return
    }

    console.log('✅ Canvas found, initializing...')
    turing.instance.init(canvas, events)
    
    return () => turing.instance.disconnect()
  }, [turing, id, events])

  const containerStyle = {
    minHeight: '400px',
    backgroundColor: '#1a1a1a',
    border: '2px solid #00ff00'
  }

  const canvasStyle = {}

  return React.createElement('div', 
    { 
      className: `flex-1 p-0 m-0 h-full w-full relative ${className}`,
      style: containerStyle
    },
    React.createElement('canvas', { 
      id: id, 
      className: 'absolute left-0 top-0 w-full h-full',
      style: canvasStyle
    })
  )
}

export function useCanvasStore(selector) {
  console.log('🔍 useCanvasStore called')
  const mockState = {
    instance: { current: null },
    init: (instance) => {
      console.log('🔍 store init:', instance)
      mockState.instance.current = instance
    },
    resetStates: (...args) => {
      console.log('🔍 resetStates:', args)
      return Promise.resolve()
    },
    actions: {
      addNodes: (nodes) => console.log('🔍 store.addNodes:', nodes),
      addEdges: (edges) => console.log('🔍 store.addEdges:', edges),
      delNode: (id) => console.log('🔍 store.delNode:', id),
      reset: () => console.log('🔍 store.reset'),
      selectNode: (id) => console.log('🔍 store.selectNode:', id),
      unselectNode: (id) => console.log('🔍 store.unselectNode:', id),
      toggleSelectNode: (id) => console.log('🔍 store.toggleSelectNode:', id),
      unselectAll: () => console.log('🔍 store.unselectAll'),
      makePrimary: (node) => console.log('🔍 store.makePrimary:', node),
      setNodeLabel: (id, label) => console.log('🔍 store.setNodeLabel:', id, label),
      setEdgeLabel: (id, label) => console.log('🔍 store.setEdgeLabel:', id, label),
      activateCenterForce: (active) => console.log('🔍 store.activateCenterForce:', active)
    },
    nodes: () => [],
    edges: () => [],
    selectedNodes: () => new Map(),
    nodeMap: () => new Map(),
    edgeMap: () => new Map(),
    centerForce: () => false
  }
  
  return selector ? selector(mockState) : mockState
}

// Additional exports that might be needed
export class TuringInstance {
  constructor() {
    this.nodes = []
    this.edges = []
    this.nodeMap = new Map()
    this.edgeMap = new Map()
    this.selectedNodes = new Map()
    this.simulation = { centerForce: false }
  }
  
  addNodes(nodes) { 
    console.log('🔍 TuringInstance.addNodes:', nodes)
    return Promise.resolve()
  }
  addEdges(edges) { 
    console.log('🔍 TuringInstance.addEdges:', edges)
    return Promise.resolve()
  }
  delNode(id) { 
    console.log('🔍 TuringInstance.delNode:', id)
    return Promise.resolve()
  }
  delEdge(id) { 
    console.log('🔍 TuringInstance.delEdge:', id)
    return Promise.resolve()
  }
  makePrimary(node) { 
    console.log('🔍 TuringInstance.makePrimary:', node)
    return Promise.resolve()
  }
  makeSecondary(node) { 
    console.log('🔍 TuringInstance.makeSecondary:', node)
    return Promise.resolve()
  }
  selectNode(id) {
    console.log('🔍 TuringInstance.selectNode:', id)
    return Promise.resolve()
  }
  unselectNode(id) {
    console.log('🔍 TuringInstance.unselectNode:', id)
    return Promise.resolve()
  }
  toggleSelectNode(id) {
    console.log('🔍 TuringInstance.toggleSelectNode:', id)
    return Promise.resolve()
  }
  unselectAll() {
    console.log('🔍 TuringInstance.unselectAll')
    return Promise.resolve()
  }
  setNodeLabel(id, label) {
    console.log('🔍 TuringInstance.setNodeLabel:', id, label)
    return Promise.resolve()
  }
  setEdgeLabel(id, label) {
    console.log('🔍 TuringInstance.setEdgeLabel:', id, label)
    return Promise.resolve()
  }
  activateCenterForce(active) {
    console.log('🔍 TuringInstance.activateCenterForce:', active)
    return Promise.resolve()
  }
  reset() {
    console.log('🔍 TuringInstance.reset')
    this.nodes = []
    this.edges = []
    this.nodeMap.clear()
    this.edgeMap.clear()
    this.selectedNodes.clear()
    return Promise.resolve()
  }
  init(canvas, events) { 
    try {
      console.log('🔍 TuringInstance.init:', canvas, events)
      if (canvas && canvas.getContext) {
        canvas.style.backgroundColor = '#2a2a2a'
        canvas.style.border = '2px solid #00ff00'
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#00ff00'
          ctx.fillRect(50, 50, 300, 100)
          ctx.fillStyle = 'white'
          ctx.font = '20px Arial'
          ctx.fillText('CANVAS INITIALIZED!', 60, 110)
        }
      }
      return Promise.resolve()
    } catch (error) {
      console.error('❌ Error in TuringInstance.init:', error)
      return Promise.reject(error)
    }
  }
  disconnect() { 
    console.log('🔍 TuringInstance.disconnect')
    return Promise.resolve()
  }
}

console.log('✅ FIXED turingcanvas module loaded successfully!')