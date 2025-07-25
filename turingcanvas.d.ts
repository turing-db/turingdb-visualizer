// Type declarations for the compiled turingcanvas module
declare module 'turingcanvas/dist/index.js' {
  export const TuringCanvas: any;
  export const useTuringContext: () => any;
  export const useCanvasStore: (selector: any) => any;
  export const TuringContextProvider: any;
  export const TuringInstance: any;
  export type NodeData = any;
  export type TuringUserEvents = any;
  export type TuringNode = any;
}

// Declare all files in turingcanvas/dist as any
declare module 'turingcanvas/dist/*' {
  const content: any;
  export = content;
}

// Fallback for the main turingcanvas module
declare module 'turingcanvas' {
  export const TuringCanvas: any;
  export const useTuringContext: () => any;
  export const useCanvasStore: (selector: any) => any;
  export const TuringContextProvider: any;
  export const TuringInstance: any;
  export type NodeData = any;
  export type TuringUserEvents = any;
  export type TuringNode = any;
}