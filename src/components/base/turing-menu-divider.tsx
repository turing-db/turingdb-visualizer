import { MenuDivider, type MenuDividerProps } from '@blueprintjs/core'
import clsx from 'clsx'

interface TuringMenuDividerProps extends MenuDividerProps {}

export const TuringMenuDivider = (props: TuringMenuDividerProps) => {
  return <MenuDivider {...props} className={clsx('app-menu-divider', props.className)} />
}
