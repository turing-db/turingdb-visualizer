import TuringButton from '@/components/base/turing-button'
import TuringTooltip from '@/components/base/turing-tooltip'
import { useVisStore } from '@/stores'
import { type FC, useState } from 'react'
import { AddNodesDialog } from '@/components/viewer/dialogs/add-nodes/add-nodes-dialog'

interface AddNodesButtonProps {
  setOpen: (open: boolean) => void
}

const AddNodesButton: FC<AddNodesButtonProps> = (props) => {
  const noNodeSelected = useVisStore((state) => state.neighbourhood.size) === 0

  return (
    <TuringTooltip content="Add nodes to view" placement="bottom">
      <TuringButton
        highlight={noNodeSelected}
        onClick={() => {
          props.setOpen(true)
        }}
      >
        Add node
      </TuringButton>
    </TuringTooltip>
  )
}

export const AddNodesMenu: FC = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <AddNodesDialog open={open} onClose={() => setOpen(false)} />
      <AddNodesButton setOpen={setOpen} />
    </>
  )
}
