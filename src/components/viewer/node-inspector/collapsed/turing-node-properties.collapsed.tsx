import { NodePropertyValue } from '@/utils/properties'
import { propertyKeyToString } from '@/utils/property-to-string'

export default function TuringNodePropertiesListCollapsed({
  properties,
}: {
  properties: Record<string, string>
}) {
  const entries = Object.entries(properties)
  if (!entries.length) {
    return null
  }

  return (
    <div className="border-grey-600 flex flex-col border-b p-4">
      {entries.map(([key, value]) => (
        <div key={key} className="flex w-full flex-col">
          <span className="text-content-tertiary mb-1 w-full text-xs leading-[1.16] font-medium text-wrap">
            {propertyKeyToString(key)}
          </span>
          <span
            className="mb-2 w-full text-sm font-medium text-pretty"
            style={{
              wordBreak: !String(value).includes(' ')
                ? String(value).length > 35
                  ? 'break-all'
                  : undefined
                : undefined,
            }}
          >
            <NodePropertyValue value={value} valueKey={key} />
          </span>
        </div>
      ))}
    </div>
  )
}
