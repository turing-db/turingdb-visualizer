import type { PropertyValueType } from './propertyValueType.model'

export type EdgeEntry = [
  id: number,
  src: number,
  tgt: number,
  edgeTypeID: number,
  properties: {
    [propTypeID: number]: PropertyValueType
  },
]
