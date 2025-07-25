import { type FC } from 'react'
import { TuringMenuItem } from '@/components/base/turing-menu-item'

import { SelectSameLabels } from './actions/select-same-labels-menu'
import { SelectSameProperties } from './actions/select-same-properties-menu'

export const OnCanvasContextMenuItems: FC = () => {
  return (
    <TuringMenuItem text="Select all" icon="select">
      <SelectSameLabels />
      <SelectSameProperties />
    </TuringMenuItem>
  )
}
