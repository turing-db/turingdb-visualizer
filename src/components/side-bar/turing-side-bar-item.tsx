import { type PageType, useAppStore } from '@/stores/app.store'
import { Icon } from '@blueprintjs/core'
import type { BlueprintIcons_16Id } from '@blueprintjs/icons/lib/esm/generated/16px/blueprint-icons-16'
import { useMemo } from 'react'
import { TuringTooltip } from '@/components/base/turing-tooltip'

type SideBarItemProps = {
  name: string
  page: PageType
  iconName: BlueprintIcons_16Id
}

export const TuringSideBarItem = (props: SideBarItemProps) => {
  const currentPage = useAppStore((state) => state.page)
  const setCurrentPage = useAppStore((state) => state.setPage)

  const className = useMemo(
    () =>
      `${
        props.page === currentPage
          ? 'sidebar-item-bg-gradient bg-grey-600 !text-content-primary '
          : 'bg-grey-800 !text-content-fourth hover:bg-grey-700 '
      }flex h-10 w-10 items-center justify-center rounded-[4px] transition-colors cursor-pointer outline-none`,
    [props.page, currentPage]
  )

  return (
    <TuringTooltip content={props.name} interactionKind="hover-target" placement="right">
      <div
        className={className}
        onClick={() => setCurrentPage(props.page)}
        onKeyDown={() => setCurrentPage(props.page)}
      >
        <Icon icon={props.iconName} />
      </div>
    </TuringTooltip>
  )
}
