import { type FC, useMemo } from 'react'
import { TuringMenuItem } from '@/components/base/turing-menu-item'
import { useCanvasStore } from 'turingcanvas'
import type { NodeEntry } from '@/api/models/nodeEntry.model'

import { SelectSameLabels } from './actions/select-same-labels-menu'
import { SelectSameProperties } from './actions/select-same-properties-menu'

export const OnCanvasContextMenuItems: FC = () => {
  const turingNodes = useCanvasStore((state) => state.nodes)

  const labels = useMemo(
    () => [
      ...new Set(
        turingNodes().flatMap((n) => {
          const data = n.data as NodeEntry

          return data.labels
        })
      ),
    ],
    [turingNodes]
  )

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
    <TuringMenuItem text="Select all" icon="select">
      <SelectSameLabels labels={labels} />
      <SelectSameProperties properties={properties} />
    </TuringMenuItem>
  )
}
