import TuringMenuPopover from '@/components/base/turing-menu-popover'
import TuringTooltip from '@/components/base/turing-tooltip'
import { NodeColorMenuItems } from './node-color-menu'
import TuringButton from '@/components/base/turing-button'

export const ColorNodesButton = () => {
  return (
    <TuringTooltip content="Color nodes" placement="bottom">
      <TuringMenuPopover trigger={<TuringButton icon="color-fill" />} placement="bottom-end">
        <NodeColorMenuItems />
      </TuringMenuPopover>
    </TuringTooltip>
  )
}
