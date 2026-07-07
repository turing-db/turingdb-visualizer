import type { PropertyValueType } from '@/api/models/propertyValueType.model'
import { propertyValueToString } from './property-to-string'

export function NodePropertyValue({
  value,
  valueKey,
}: {
  value: PropertyValueType
  valueKey: string
}) {
  if (valueKey === 'url') {
    return (
      <a
        href={String(value)}
        target="_blank"
        rel="noreferrer"
        style={{
          wordBreak: 'break-all',
        }}
      >
        {value}
      </a>
    )
  }

  return propertyValueToString(value)
}
