import { MultiSelect } from '@blueprintjs/select'
import {
  type TuringMultiSelectItem,
  filter,
  renderer,
  tagRenderer,
} from './turing-multi-select-item'

export interface TuringMultiSelectProps {
  items: TuringMultiSelectItem[]
  selectedItems: TuringMultiSelectItem[]
  onItemSelect: (item: TuringMultiSelectItem) => void
  onItemRemoved: (item: TuringMultiSelectItem) => void
  highlight?: boolean
  placeholder?: string
  fill?: boolean
  emptyContent?: string
  onClear?: () => void
}

export const TuringMultiSelect: React.FC<TuringMultiSelectProps> = (props) => {
  return (
    <MultiSelect<TuringMultiSelectItem>
      items={props.items}
      fill={props.fill}
      onClear={props.onClear}
      selectedItems={props.selectedItems}
      itemsEqual={(a: TuringMultiSelectItem, b: TuringMultiSelectItem) => a.name === b.name}
      itemPredicate={filter}
      itemRenderer={renderer}
      tagRenderer={tagRenderer}
      resetOnSelect={true}
      initialContent={props.items.length === 0 ? props.emptyContent : undefined}
      onItemSelect={props.onItemSelect}
      onRemove={props.onItemRemoved}
      placeholder={props.placeholder}
    />
  )
}
