import { Dialog, type DialogProps } from '@blueprintjs/core'
import type { FC } from 'react'

export interface HiddenNodesDialogProps extends DialogProps {}

export const TuringDialog: FC<HiddenNodesDialogProps> = (props) => {
  const { style, ...rest } = props

  return (
    <Dialog
      canEscapeKeyClose
      canOutsideClickClose
      shouldReturnFocusOnClose={false}
      transitionDuration={200}
      portalClassName="app-dialog"
      style={style || { width: '80vw', height: '80vh' }}
      {...rest}
    >
      {props.children}
    </Dialog>
  )
}

export default TuringDialog
