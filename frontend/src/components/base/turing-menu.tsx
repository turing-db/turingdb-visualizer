import { Menu, type MenuProps } from '@blueprintjs/core'
import clsx from 'clsx'

interface TuringMenuProps extends MenuProps {}

export const TuringMenu = (props: TuringMenuProps) => {
  return (
    <Menu {...props} className={clsx('app-popover-menu', props.className)}>
      {props.children}
    </Menu>
  )
}
