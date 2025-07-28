import { useState, useCallback } from 'react'
import { Icon } from '@blueprintjs/core'
import type { BlueprintIcons_16Id } from '@blueprintjs/icons/lib/esm/generated/16px/blueprint-icons-16'

interface TuringButtonProps {
  highlight?: boolean
  borderless?: boolean
  disabled?: boolean
  className?: string
  children?: string
  value?: boolean
  icon?: BlueprintIcons_16Id
  iconActive?: BlueprintIcons_16Id
  onChange?: (newValue: boolean) => void
}

export const TuringSwitch = (props: TuringButtonProps) => {
  const { icon, highlight, children, className, borderless, disabled } = props
  const [active, setActive] = useState(props.value)

  const callback = useCallback(() => {
    props.onChange?.(!active)
    setActive((state) => !state)
  }, [props, active])

  return (
    <div
      className={
        `app-button cursor-pointer ${highlight && 'is-highlighted'} ` +
        `${borderless && 'is-borderless'} ` +
        `${disabled && 'is-disabled'} ` +
        `${active && 'is-active'} ` +
        `${className} `
      }
      onClick={callback}
      onKeyDown={callback}
    >
      {icon !== undefined ? <Icon icon={active ? (props.iconActive ?? icon) : icon} /> : <></>}
      {children}
    </div>
  )
}
export default TuringSwitch
