#!/usr/bin/env node

// EMERGENCY BUILD: Create a minimal turingcanvas dist if it doesn't exist
import { execSync } from 'child_process'
import { existsSync, writeFileSync, mkdirSync } from 'fs'

console.log('🚨 EMERGENCY: Checking turingcanvas build...')

const TURINGCANVAS_DIR = 'turingcanvas'
const DIST_DIR = `${TURINGCANVAS_DIR}/dist`

// Check if dist exists
if (!existsSync(DIST_DIR)) {
  console.log('❌ No dist directory found. Creating minimal build...')
  
  // Create dist directory
  mkdirSync(DIST_DIR, { recursive: true })
  
  // Create minimal index.js
  const minimalContent = `
// Emergency minimal turingcanvas build
import React from 'react'

export const TuringContextProvider = ({ children }) => {
  console.log('🔍 DEBUG: TuringContextProvider rendering')
  return React.createElement('div', { 'data-turingcontext': true }, children)
}

export const useTuringContext = () => {
  console.log('🔍 DEBUG: useTuringContext called')
  return { 
    instance: { 
      nodes: [], 
      edges: [], 
      nodeMap: new Map(),
      edgeMap: new Map(),
      addNodes: () => console.log('addNodes called'),
      addEdges: () => console.log('addEdges called'),
      delNode: () => console.log('delNode called'),
      delEdge: () => console.log('delEdge called'),
      makePrimary: () => console.log('makePrimary called'),
      makeSecondary: () => console.log('makeSecondary called'),
      init: () => console.log('init called'),
      disconnect: () => console.log('disconnect called')
    }
  }
}

export const TuringCanvas = ({ id, className, events }) => {
  console.log('🔍 DEBUG: TuringCanvas rendering', { id, className })
  React.useEffect(() => {
    console.log('🔍 DEBUG: TuringCanvas mounted')
    const canvas = document.getElementById(id)
    if (canvas) {
      console.log('🔍 DEBUG: Canvas element found:', canvas)
      // Add a visible indicator
      canvas.style.backgroundColor = '#ff0000'
      canvas.style.minHeight = '400px'
    } else {
      console.error('🔍 DEBUG: Canvas element NOT found for id:', id)
    }
  }, [id])
  
  return React.createElement('div', 
    { className: 'flex-1 p-0 m-0 h-full w-full relative ' + (className || '') },
    React.createElement('canvas', { 
      id: id, 
      className: 'absolute left-0 top-0 w-full h-full',
      style: { backgroundColor: '#ff0000', minHeight: '400px' }
    })
  )
}

export const useCanvasStore = () => ({
  resetStates: () => console.log('resetStates called'),
  init: () => console.log('store init called')
})

console.log('🔍 DEBUG: Emergency turingcanvas module loaded')
`
  
  writeFileSync(`${DIST_DIR}/index.js`, minimalContent)
  console.log('✅ Emergency minimal build created')
} else {
  console.log('✅ Dist directory exists')
  console.log('📁 Contents:', execSync(`ls -la ${DIST_DIR}`, { encoding: 'utf8' }))
}