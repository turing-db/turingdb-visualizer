import TuringButton from '@/components/base/turing-button'
import TuringTooltip from '@/components/base/turing-tooltip'
import { AddNodesDialog } from '@/components/viewer/dialogs/add-nodes/add-nodes-dialog'
import { useVisStore } from '@/stores'
import type { FC } from 'react'

export const AddNodesMenu: FC = () => {
  const noNodeSelected = useVisStore((state) => state.neighbourhood.size) === 0
  const openAddNodesDialog = useVisStore((state) => state.openAddNodesDialog)

  return (
    <>
      <AddNodesDialog />
      <TuringTooltip content="Add nodes to view" placement="bottom">
        <TuringButton highlight={noNodeSelected} onClick={() => openAddNodesDialog()}>
          Add node
        </TuringButton>
      </TuringTooltip>
    </>
  )
}
