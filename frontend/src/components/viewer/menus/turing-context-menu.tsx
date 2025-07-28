import { type FC, useCallback } from 'react'

import { TuringMenu } from '@/components/base/turing-menu'
import { useAppStore } from '@/stores'
import { ContextMenuPopover } from '@blueprintjs/core'
import type { TuringNode } from 'turingcanvas'
import { OnCanvasContextMenuItems } from './canvas-context-menu'
import { OnNodeContextMenuItems } from './node-context-menu'
import { TuringContextMenuType } from './turing-context-menu-type'

export interface TuringContextMenuInfo {
  type: TuringContextMenuType
  offset: { left: number; top: number }
  node?: TuringNode
}

export interface TuringContextMenuProps {
  close: () => void
  info?: TuringContextMenuInfo
}

export const TuringContextMenu: FC<TuringContextMenuProps> = (props) => {
  const theme = useAppStore((state) => state.theme)

  const handleClose = useCallback(() => {
    props.close()
  }, [props])

  if (!props.info) return

  return (
    <ContextMenuPopover
      isDarkTheme={theme === 'dark'}
      popoverClassName="app-popover"
      isOpen={props.info !== undefined}
      targetOffset={props.info.offset}
      onClose={handleClose}
      content={
        <TuringMenu>
          {props.info.type === TuringContextMenuType.NODE && props.info.node && (
            <OnNodeContextMenuItems node={props.info.node} />
          )}

          {props.info.type === TuringContextMenuType.CANVAS && <OnCanvasContextMenuItems />}
        </TuringMenu>
      }
    />
  )
}
