import TuringButton from '@/components/base/turing-button'
import TuringTooltip from '@/components/base/turing-tooltip'
import { type FC, useState } from 'react'
import { HiddenNodesDialog } from '@/components/viewer/dialogs/hidden-nodes/hidden-nodes-dialog'

export const HiddenNodesMenu: FC = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <HiddenNodesDialog open={open} onClose={() => setOpen(false)} />

      <TuringTooltip content="Hidden nodes" placement="bottom">
        <TuringButton
          icon="eye-open"
          onClick={() => {
            setOpen(true)
          }}
        />
      </TuringTooltip>
    </>
  )
}
