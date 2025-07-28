import type { NodePropertyEntries } from '../models/nodePropertyEntries.model'
import type { PropertyValueType } from '../models/propertyValueType.model'

export type GetNodePropertiesResponse = {
  [name: string]: NodePropertyEntries<PropertyValueType>
}
