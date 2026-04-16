import { Select } from '@blueprintjs/select'
import { type TuringSelectItem, filter, renderer } from './turing-select-item'
import type { IconName } from '@blueprintjs/icons'
import TuringButton from './turing-button'
import type { FC } from 'react'

export interface AppSelectProps {
  items: TuringSelectItem[]
  onItemSelect: (item: TuringSelectItem) => void
  highlight?: boolean
  children?: React.ReactNode
  rightIcon?: IconName
  leftIcon?: IconName
}

export const TuringSelect: FC<AppSelectProps> = (props) => {
  return (
    <Select<TuringSelectItem>
      items={props.items}
      itemRenderer={renderer}
      itemPredicate={filter}
      onItemSelect={props.onItemSelect}
      popoverProps={{
        popoverClassName: 'app-select-popover',
        minimal: true,
      }}
    >
      <TuringButton
        icon={props.leftIcon}
        rightIcon={props.rightIcon || 'double-caret-vertical'}
        highlight={props.highlight}
      >
        {props.children}
      </TuringButton>
    </Select>
  )
}
