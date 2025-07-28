import { Popover, type PopoverProps } from '@blueprintjs/core'
import clsx from 'clsx'
import { TuringMenu } from './turing-menu'

interface Props extends PopoverProps {
  trigger: React.ReactNode
  children: React.ReactNode
}

export default function TuringMenuPopover(props: Props) {
  const { trigger, children, popoverClassName, ...rest } = props
  return (
    <Popover
      popoverClassName={clsx('app-popover', popoverClassName)}
      hasBackdrop={false}
      minimal
      content={<TuringMenu>{children}</TuringMenu>}
      modifiers={{
        offset: {
          enabled: true,
          options: {
            offset: [0, 5],
          },
        },
      }}
      {...rest}
    >
      {trigger}
    </Popover>
  )
}
