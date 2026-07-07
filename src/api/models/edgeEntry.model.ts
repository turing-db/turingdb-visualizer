import type { PropertyValueType } from './propertyValueType.model'

export type EdgeEntry = [
  id: number,
  src: number,
  tgt: number,
  edgeTypeID: number,
  properties: {
    // Keyed by property NAME, matching NodeEntry — see db.getEdges / ProcUtils.
    [propType: string]: PropertyValueType
  },
]
