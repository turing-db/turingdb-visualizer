/// <reference types="vite/client" />
/// <reference path="./types/global.d.ts" />

// Skip TypeScript checking for all files in turingcanvas dist
declare module 'turingcanvas/dist/*' {
  const content: any
  export = content
}

// Skip TypeScript checking entirely for turingcanvas
declare module 'turingcanvas' {
  export const TuringCanvas: any
  export const useTuringContext: () => any
  export const useCanvasStore: (selector: any) => any
  export const TuringContextProvider: any
  export const TuringInstance: any
  export type NodeData = any
  export type TuringUserEvents = any
  export type TuringNode = any
}

// Completely disable TypeScript checking for troika-three-text
declare module 'troika-three-text' {
  export const Text: any
  export const FontLoader: any
  export const preloadFont: any
  const content: any
  export = content
}