import type { FC } from 'react'
import { Icon } from '@blueprintjs/core'

import { TuringMenuItem } from '@/components/base/turing-menu-item'
import { TuringMenuDivider } from '@/components/base/turing-menu-divider'
import { PRESET_COLORS } from './colors'

import { useTuringContext } from 'turingcanvas'

export const NodeColorMenuItems: FC = () => {
  const turing = useTuringContext()

  return (
    <>
      <TuringMenuDivider className="app-menu-divider" title="General" />

      <TuringMenuItem
        key="node-color-none"
        text="None"
        icon="cross"
        onClick={() => {
          for (const [, n] of turing.instance.selectedNodes) {
            turing.instance.resetNodeColor(n)
          }
        }}
      />

      <TuringMenuItem key="node-color-preset" text="Preset" icon="edit">
        {[
          ...PRESET_COLORS.entries().map(([colorName, colorValue]) => (
            <TuringMenuItem
              key={colorName}
              text={colorName}
              icon={<Icon icon="symbol-square" color={colorName} />}
              onClick={() => {
                for (const [, n] of turing.instance.selectedNodes) {
                  turing.instance.setNodeColor(n, colorValue)
                }
              }}
            />
          )),
        ]}
      </TuringMenuItem>

      {/* <TuringMenuDivider title="Gradient" />
        <TuringMenuItem text="Based on property">
          <TuringMenuItem text="dbld" />
          <TuringMenuItem text="displayName" />
          <TuringMenuItem text="schemaClass" />
          <TuringMenuItem text="text" />
        </TuringMenuItem>
        <TuringMenuDivider title="Discrete" />
        <TuringMenuItem text="Based on property">
          <TuringMenuItem text="dbld" />
          <TuringMenuItem text="displayName" />
          <TuringMenuItem text="schemaClass" />
          <TuringMenuItem text="text" />
        </TuringMenuItem>
        <TuringMenuItem text="Based on node type" /> */}
    </>
  )
}
