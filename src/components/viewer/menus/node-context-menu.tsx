import { type FC } from 'react'

import { TuringMenuItem } from '@/components/base/turing-menu-item'
import { TuringMenuDivider } from '@/components/base/turing-menu-divider'

import { SelectSameLabels } from './actions/select-same-labels-menu'
import { SelectSameProperties } from './actions/select-same-properties-menu'
import { NodeColorMenuItems } from './actions/node-color-menu'
import { NodeHideItem } from './actions/node-hide-item'
import { NodeShowDetailsItem } from './actions/node-show-details-item'

export type NodeContextMenuItemsProps = {
  node: any
}

export const OnNodeContextMenuItems: FC<NodeContextMenuItemsProps> = (props) => {
  return (
    <>
      <NodeShowDetailsItem node={props.node} />

      <NodeHideItem />

      {/* <TuringMenuItem text="Show in Pathways"  />
      <TuringMenuItem text="Open in new tab"  />
      <TuringMenuItem text="Collapse neighbors"  />
      <TuringMenuDivider />*/}

      <TuringMenuItem text="Select nodes" icon="select">
        <SelectSameLabels />
        <SelectSameProperties />
      </TuringMenuItem>

      <TuringMenuDivider />

      <TuringMenuItem text="Set node colors" icon="color-fill">
        <NodeColorMenuItems />
      </TuringMenuItem>

      {/* <TuringMenuItem text="Set layout" >
        <TuringMenuItem text="Vertical line" />
        <TuringMenuItem text="Auto" />
      </TuringMenuItem> */}
    </>
  )
}