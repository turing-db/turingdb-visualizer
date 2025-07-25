// Global TypeScript exclusions for problematic auto-generated files
/// <reference types="vite/client" />

// Exclude the problematic turingcanvas dist JavaScript files from TypeScript checking
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