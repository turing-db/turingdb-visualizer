import { Icon } from '@blueprintjs/core'
import type { IconName } from '@blueprintjs/icons'
import { type ChangeEvent, useEffect, useRef, useState } from 'react'

export interface ChipData {
  text: string
  value?: string
  icon?: IconName
  takesInput?: boolean
}

export interface ChipProps {
  data: ChipData
  onDelete?: () => void
  onChange?: (e: ChangeEvent<HTMLInputElement>, chipLabel: string) => void
}

export const Chip = (props: ChipProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputFocused, setInputFocused] = useState(false)

  useEffect(() => {
    if (!inputFocused && props.data.value === undefined) {
      inputRef.current?.focus()
      setInputFocused(true)
    }
  }, [props, props.data.value, inputFocused])

  return (
    <div className={'inline-flex items-center justify-center gap-1 rounded bg-[#2f343c] p-1'}>
      <div className="flex items-center justify-center gap-1">
        <Icon className="px-1" icon={props.data.icon} />
        <span>{props.data.text}</span>
        {!!props.data.takesInput && (
          <input
            ref={inputRef}
            type="text"
            value={props.data.value ?? ''}
            className={
              'field-sizing-content rounded border-1 border-transparent bg-[#2f343c] px-1 text-[#A2A6AF] focus:border-1 focus:border-solid focus:border-[#679CFF] focus:bg-[#1F232B]'
            }
            onChange={(e) => props.onChange?.(e, props.data.text)}
            placeholder="value"
          />
        )}
      </div>
      <Icon className="cursor-pointer px-1" icon="cross" onClick={props.onDelete} />
    </div>
  )
}
