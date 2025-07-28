import { useState } from 'react'

export type FilterType = {
  labelFilters: string[]
  propertyFilters: Map<string, string>
}

const filterTypeDefaultState = (): FilterType => {
  return { labelFilters: [], propertyFilters: new Map() }
}

export const useFilters = () => {
  return useState<FilterType>(filterTypeDefaultState())
}
