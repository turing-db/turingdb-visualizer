import TuringBadge from '@/components/base/turing-badge'
import TuringButton from '@/components/base/turing-button'
import TuringLinkButton from '@/components/base/turing-link-button'
import { TuringSearchInput } from '@/components/base/turing-search-input'
import clsx from 'clsx'
import { useState } from 'react'

export default function TuringNodeCard({
  title,
  children,
  searchable,
  filters,
  canSelectAll,
  selectAllLabel = 'Select All',
  onSelectAll,
  onSearch,
  onSearchClear,
  counter,
  className,
  headerClassName,
}: {
  title: string
  children: React.ReactNode
  items?: string[]
  searchable?: boolean
  filters?: React.ReactNode
  canSelectAll?: boolean
  selectAllLabel?: string
  onSelectAll?: () => void
  onSearch?: (v: string) => void
  onSearchClear?: () => void
  counter?: {
    max: number
    current: number
    unloaded: number
  }
  className?: string
  headerClassName?: string
}) {
  const [isSearchActive, setIsSearchActive] = useState(false)

  const searchIcon = searchable && (
    <TuringButton icon="search" onClick={() => setIsSearchActive(!isSearchActive)} />
  )

  const handleSearchClear = () => {
    setIsSearchActive(false)
    if (onSearchClear) onSearchClear()
  }

  return (
    <div className={clsx('bg-grey-900 rounded-[0.25rem] px-4 pt-2 pb-4', className)}>
      <div
        className={clsx(
          'flex h-8 items-center justify-between gap-x-2 text-xs font-medium',
          headerClassName
        )}
      >
        <div className="flex items-center gap-x-2">
          <p className="text-content-primary leading-[1.66] font-bold tracking-[0.06em] whitespace-nowrap uppercase">
            {title}
          </p>
          {counter && (
            <TuringBadge circle>
              {counter.current}/{counter.max}{' '}
              {counter.unloaded > 0 ? `+ ${counter.unloaded} unloaded` : ''}
            </TuringBadge>
          )}
        </div>
        <div className="flex gap-x-2">
          {isSearchActive ? (
            <TuringSearchInput
              autoFocus
              className="max-w-[10.3125rem]"
              onValueChange={(v) => onSearch?.(v)}
              onClear={handleSearchClear}
              placeholder="Search edges..."
              clearAlwaysVisible
            />
          ) : (
            <>
              {searchIcon}
              {filters}
              {canSelectAll && (
                <TuringLinkButton onClick={onSelectAll}>{selectAllLabel}</TuringLinkButton>
              )}
            </>
          )}
        </div>
      </div>
      <div className="pt-3">{children}</div>
    </div>
  )
}
