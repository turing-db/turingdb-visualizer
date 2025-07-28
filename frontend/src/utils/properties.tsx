import { propertyValueToString } from './property-to-string'

export function NodePropertyValue({ value, valueKey }: { value: string; valueKey: string }) {
  if (valueKey === 'url') {
    return (
      <a
        href={value}
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
