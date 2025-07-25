import { MenuItem, type MenuItemProps } from '@blueprintjs/core'
import clsx from 'clsx'

export interface TuringMenuItemProps extends MenuItemProps {
  isActive?: boolean
}

export const TuringMenuItem = (props: TuringMenuItemProps) => {
  const { active, icon, children, className, popoverProps, ...rest } = props

  return (
    <MenuItem
      className={clsx('app-popover-menu-item', className)}
      icon={icon}
      active={active}
      popoverProps={{
        ...popoverProps,
        popoverClassName: clsx('app-popover', popoverProps?.popoverClassName),
      }}
      {...rest}
    >
      {children}
    </MenuItem>
  )
}
