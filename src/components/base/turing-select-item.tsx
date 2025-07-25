import { MenuItem } from '@blueprintjs/core'
import type { ItemPredicate, ItemRenderer } from '@blueprintjs/select'

export interface TuringSelectItem {
  name: string
  key?: string
}

export const renderer: ItemRenderer<TuringSelectItem> = (item, { handleClick, handleFocus }) => {
  return (
    <MenuItem
      text={item.name}
      key={item.name}
      label={item.key}
      roleStructure="listoption"
      onClick={handleClick}
      onFocus={handleFocus}
    />
  )
}

export const filter: ItemPredicate<TuringSelectItem> = (query, item, _index, exactMatch) => {
  const normalizedEntry = item.name.toLowerCase()
  const normalizedQuery = query.toLowerCase()

  if (exactMatch) {
    return normalizedEntry === normalizedQuery
  }

  return normalizedEntry.indexOf(normalizedQuery) >= 0
}
