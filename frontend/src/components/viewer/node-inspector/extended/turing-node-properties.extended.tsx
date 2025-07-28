import TuringCollapseTrigger from '@/components/base/turing-collapse-trigger'
import { TuringExpandable } from '@/components/base/turing-expandable'
import { NodePropertyValue } from '@/utils/properties'
import { propertyKeyToString } from '@/utils/property-to-string'
import TuringNodeCard from './turing-node-card.extended'

function NodePropertiesListItem({ type, value }: { type: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-content-tertiary mb-1 text-xs leading-[1.16] font-medium">
        {propertyKeyToString(type)}
      </span>
      <span
        className="text-sm leading-[1.43] font-medium text-wrap"
        style={{
          wordBreak: !String(value).includes(' ')
            ? String(value).length > 25
              ? 'break-all'
              : undefined
            : undefined,
        }}
      >
        <NodePropertyValue value={value} valueKey={type} />
      </span>
    </div>
  )
}

export default function TuringNodePropertiesListExtended({
  properties,
}: {
  properties: Record<string, string>
}) {
  const isExpandable = Object.keys(properties).length > 6
  const propertiesEntries = Object.entries(properties)
  const preview = propertiesEntries.slice(0, 6)
  const rest = propertiesEntries.slice(6)

  return (
    <TuringNodeCard className="m-2 !px-0" headerClassName="px-4" title="Properties">
      {preview.length > 0 && (
        <div className="px-4">
          <div className="grid grid-cols-2 gap-4">
            {preview.map(([key, value]) => (
              <NodePropertiesListItem key={key} type={key} value={value} />
            ))}
          </div>
          {isExpandable && (
            <TuringExpandable
              className="bp5-dark"
              trigger={({ isExpanded, setIsExpanded }) => (
                <TuringCollapseTrigger onClick={() => setIsExpanded(!isExpanded)}>
                  {rest.length} properties
                </TuringCollapseTrigger>
              )}
              hideTriggerOnExpand
            >
              <div className="mt-4 grid grid-cols-2 gap-4">
                {rest.map(([key, value]) => (
                  <NodePropertiesListItem key={key} type={key} value={value} />
                ))}
              </div>
            </TuringExpandable>
          )}
        </div>
      )}
    </TuringNodeCard>
  )
}
