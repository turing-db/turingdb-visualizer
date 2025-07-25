export type GetGraphStatusResponse =
  | {
      isLoaded: boolean
      isLoading: boolean
      nodeCount?: number
      edgeCount?: number
    }
  | undefined
