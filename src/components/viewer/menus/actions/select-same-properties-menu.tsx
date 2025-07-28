import type { NodeEntry } from '@/api/models/nodeEntry.model'
import { TuringMenuItem } from '@/components/base/turing-menu-item'
import { MenuItem } from '@blueprintjs/core'
import { type ItemPredicate, Select } from '@blueprintjs/select'
import { type FC, useCallback, useMemo } from 'react'
import { useCanvasStore, useTuringContext } from 'turingcanvas'

function RenderPropertyValues({ parent, property }: { parent: JSX.Element; property: string }) {
  const turing = useTuringContext()
  const turingActions = useCanvasStore((state) => state.actions)
  const turingNodes = useCanvasStore((state) => state.nodes)

  const filter: ItemPredicate<string> = (query, item, _index, exactMatch) => {
    const normalizedEntry = String(item).toLowerCase()
    const normalizedQuery = query.toLowerCase()

    if (exactMatch) {
      return normalizedEntry === normalizedQuery
    }
    return normalizedEntry.indexOf(normalizedQuery) >= 0
  }
  const propValues = useMemo(
    () =>
      Array.from(
        new Set([
          ...turingNodes()
            .map((n) => {
              return (n.data as NodeEntry).properties[property]
            })
            .filter((v) => v !== undefined)
            .flat(),
        ])
      ).flat(),
    [turingNodes, property]
  )

  const handleOnItemSelect = useCallback(
    (propertyValue: string) => {
      turing.instance.unselectAll()

      for (const n of turing.instance.nodes) {
        const nodeData = n.data as NodeEntry
        if (nodeData.properties[property] === propertyValue) {
          turingActions.selectNode(n)
        }
      }
    },
    [property, turing.instance, turingActions]
  )

  const renderPropertyValue = useCallback(
    (propertyValue: string) => {
      return (
        <MenuItem
          key={`select-node-by-property-${property}-${propertyValue}`}
          text={propertyValue}
          onClick={() => handleOnItemSelect(propertyValue)}
        />
      )
    },
    [handleOnItemSelect, property]
  )

  return (
    <Select
      items={propValues}
      itemRenderer={renderPropertyValue}
      itemPredicate={filter}
      onItemSelect={() => {}}
      className="app-select-popover"
      popoverProps={{
        placement: 'right-start',
        popoverClassName: 'app-popover app-select-popover',
      }}
      noResults={
        <TuringMenuItem
          key="select-menu-no-result"
          disabled={true}
          text="No results."
          roleStructure="listoption"
        />
      }
    >
      {parent}
    </Select>
  )
}

export const SelectSameProperties: FC = () => {
  const turingNodes = useCanvasStore((state) => state.nodes)

  const properties = useMemo(() => {
    return Array.from(
      new Set([
        ...turingNodes()
          .map((n) => {
            const data = n.data as NodeEntry
            return Object.keys(data.properties)
          })
          .filter((v) => v !== undefined)
          .flat(),
      ])
    ).flat()
  }, [turingNodes])

  return (
    <TuringMenuItem text="By common property" icon="property">
      <div className="max-h-[50vh] overflow-y-scroll">
        {properties.length === 0 ? (
          <TuringMenuItem key="no-result" text="No labels" disabled />
        ) : (
          properties.map((p) => (
            <RenderPropertyValues
              key={p}
              property={p}
              parent={<TuringMenuItem key={p} text={p} shouldDismissPopover={false} />}
            />
          ))
        )}
      </div>
    </TuringMenuItem>
  )
}
