import { InputGroup, type InputGroupProps } from '@blueprintjs/core'
import clsx from 'clsx'

export interface TuringInputProps extends InputGroupProps {
  small?: boolean
}

export default function TuringInput(props: TuringInputProps) {
  return (
    <InputGroup
      {...props}
      className={clsx(
        'app-input',
        {
          'app-input--small': props.small,
        },
        props.className
      )}
    />
  )
}
