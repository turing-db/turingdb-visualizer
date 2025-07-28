import clsx from 'clsx'
import TuringInput, { type TuringInputProps } from './turing-input'
import { Icon } from '@blueprintjs/core'

export interface TuringSearchInputProps extends TuringInputProps {
  onClear?: () => void
  clearAlwaysVisible?: boolean
  onIconClick?: () => void
}

export const TuringSearchInput = (props: TuringSearchInputProps) => {
  const { onClear, clearAlwaysVisible, onIconClick, ...rest } = props

  const maybeClear =
    clearAlwaysVisible || props.value?.length !== undefined ? (
      <Icon icon="cross" className="cursor-pointer" onClick={onClear} />
    ) : undefined

  return (
    <TuringInput
      {...rest}
      leftElement={<Icon icon="search" onClick={onIconClick} />}
      rightElement={maybeClear}
      className={clsx('app-input-search', props.className)}
    />
  )
}
