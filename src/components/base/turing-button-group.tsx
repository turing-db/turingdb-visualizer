import { ButtonGroup, type ButtonGroupProps } from '@blueprintjs/core'
import clsx from 'clsx'

interface TuringButtonGroupProps extends ButtonGroupProps {}

export const TuringButtonGroup = (props: TuringButtonGroupProps) => {
  return (
    <ButtonGroup {...props} className={clsx(props.className)}>
      {props.children}
    </ButtonGroup>
  )
}
