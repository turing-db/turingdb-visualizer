import { MenuItem } from '@blueprintjs/core'
import type { ItemPredicate, ItemRenderer } from '@blueprintjs/select'

export interface TuringMultiSelectItem {
  name: string
  key?: string
}

export const renderer: ItemRenderer<TuringMultiSelectItem> = (
  item,
  { handleClick, handleFocus }
) => {
  return (
    <MenuItem
      text={item.name}
      label={item.key}
      key={item.name}
      roleStructure="listoption"
      onClick={handleClick}
      onFocus={handleFocus}
    />
  )
}

export const tagRenderer = (item: TuringMultiSelectItem) => item.name

export const filter: ItemPredicate<TuringMultiSelectItem> = (query, item, _index, exactMatch) => {
  const normalizedEntry = item.name.toLowerCase()
  const normalizedQuery = query.toLowerCase()

  if (exactMatch) {
    return normalizedEntry === normalizedQuery
  }

  return normalizedEntry.indexOf(normalizedQuery) >= 0
}
