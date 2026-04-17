import { createContext } from 'react'

export const GlobalLabelCountsContext = createContext<ReadonlyMap<string, number>>(new Map())
