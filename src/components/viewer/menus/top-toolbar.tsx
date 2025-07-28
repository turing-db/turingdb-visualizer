import TuringButton from '@/components/base/turing-button'
import { TuringButtonGroup } from '@/components/base/turing-button-group'
import TuringMenuPopover from '@/components/base/turing-menu-popover'

import { SelectSameLabels } from './actions/select-same-labels-menu'
import { SelectSameProperties } from './actions/select-same-properties-menu'
import { HiddenNodesMenu } from './actions/hidden-nodes-menu'
import { AddNodesMenu } from './actions/add-nodes-menu'
import { NodeLabelSelector } from './actions/node-label-selector'
import { EdgeLabelSelector } from './actions/edge-label-selector'
import { ExpandNeighborsButton } from './actions/expand-neighbors-btn'
import { ColorNodesButton } from './actions/color-nodes-btn'
import { CenterForceSwitch } from './actions/center-force-switch'

export const TuringTopToolBar = () => {
  return (
    <div className="absolute top-0 right-0 m-4">
      <div className="flex justify-around">
        <CenterForceSwitch />
        <TuringButtonGroup className="mx-1">
          {/* <TuringTooltip content="Clean up canvas" interactionKind="hover-target" placement="bottom">
            <TuringButton icon="eraser"></TuringButton>
          </TuringTooltip>*/}

          <HiddenNodesMenu />
          <ExpandNeighborsButton />
          <ColorNodesButton />
          {/* <TuringTooltip label="Hide neighbors" interactionKind="hover-target" placement="bottom">
            <TuringButton icon="collapse-all"></TuringButton>
          </TuringTooltip> */}

          <TuringMenuPopover
            trigger={
              <TuringButton rightIcon="caret-down" icon="select" onClick={() => {}}>
                Select
              </TuringButton>
            }
            placement="bottom-start"
            fill
          >
            <SelectSameLabels />
            <SelectSameProperties />
          </TuringMenuPopover>
        </TuringButtonGroup>

        <div className="mx-1">
          <AddNodesMenu />
        </div>

        <div className="mx-1">
          <NodeLabelSelector />
        </div>

        <div className="mx-1">
          <EdgeLabelSelector />
        </div>
        {/* <TuringButton className="mx-1" onClick={() => {}}>
          Add node
        </TuringButton>
        <div className="mx-1">
          <TuringSelect
            items={[]}
            rightIcon="caret-down"
            leftIcon="one-to-one"
            onItemSelect={() => {}}
          >
            None
          </TuringSelect>
        </div>
        <TuringButton className="mx-1" icon="add" onClick={() => {}}>
          Add entiy
        </TuringButton>
        <TuringButton className="mx-1" icon="settings" onClick={() => {}}></TuringButton>
        <TuringButton className="mx-1" icon="search" onClick={() => {}}>
          Search view
        </TuringButton>
        */}
      </div>
    </div>
  )
}
