import type { NodeEntry } from '@/api/models/nodeEntry.model'
import { TuringMenuItem } from '@/components/base/turing-menu-item'
import { type FC, useMemo } from 'react'
import { useTuringContext, useCanvasStore } from 'turingcanvas'

export const SelectSameLabels: FC = () => {
  const turing = useTuringContext()
  const turingActions = useCanvasStore((state) => state.actions)
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

  const handleOnItemSelect = (label: string) => {
    turing.instance.unselectAll()

    for (const n of turing.instance.nodes) {
      const nodeData = n.data as NodeEntry
      if (nodeData.labels.includes(label)) {
        turingActions.selectNode(n)
      }
    }
  }

  return (
    <TuringMenuItem text="By common label" icon="tag">
      {labels.length === 0 ? (
        <TuringMenuItem key="no-result" text="No labels" disabled />
      ) : (
        labels.map((l) => <TuringMenuItem key={l} text={l} onClick={() => handleOnItemSelect(l)} />)
      )}
    </TuringMenuItem>
  )
}
