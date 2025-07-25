// Global TypeScript exclusions for problematic auto-generated files
/// <reference types="vite/client" />

// Completely exclude TypeScript checking of turingcanvas dist files
declare module 'turingcanvas' {
  const TuringCanvas: any
  const useTuringContext: () => any
  const useCanvasStore: (selector: any) => any
  const TuringContextProvider: any
  type NodeData = any
  type TuringUserEvents = any
  type TuringNode = any
  const TuringInstance: any
  
  export {
    TuringCanvas,
    useTuringContext,
    useCanvasStore,
    TuringContextProvider,
    TuringInstance
  }
  export type { NodeData, TuringUserEvents, TuringNode }
}

declare module 'turingcanvas/dist/*' {
  const content: any
  export = content
}

declare module 'troika-three-text' {
  const content: any
  export = content
}

// Allow importing .js files without TypeScript errors
declare module '*.js' {
  const content: any
  export default content
}