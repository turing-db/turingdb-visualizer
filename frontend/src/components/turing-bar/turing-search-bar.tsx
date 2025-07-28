import { Icon, Spinner } from '@blueprintjs/core'
import {
  type ChangeEvent,
  type FC,
  type MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { TuringMenu } from '@/components/base/turing-menu'
import { TuringMenuItem } from '@/components/base/turing-menu-item'
import { type ChipData, Chip } from './chip'
import { MainSearchInput } from './main-search-input'
import { type SelectChipFunction, useSelectedChips } from './use-selected-chips'

interface TuringSearchBarProps {
  chips: ChipData[]
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onChipChange: (chips: Map<string, ChipData>) => void
  onAcceptInput?: (value: string) => void
  loading?: boolean
  selectChipRef?: MutableRefObject<SelectChipFunction>
}

export const TuringSearchBar: FC<TuringSearchBarProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null) as MutableRefObject<HTMLInputElement>
  const [showingMenu, setShowingMenu] = useState(false)
  const { onChipChange } = props
  const { selectedChips, unselectChip, selectChip, unselectAllChips, updateChipValue } =
    useSelectedChips()

  const deleteLastChip = useCallback(() => {
    if (selectedChips.size === 0) return
    const keys = [...selectedChips.keys()]
    const lastKey = keys[keys.length - 1]
    unselectChip(lastKey)
  }, [selectedChips, unselectChip])

  if (props.selectChipRef) {
    props.selectChipRef.current = selectChip
  }

  useEffect(() => {
    onChipChange(selectedChips)
  }, [onChipChange, selectedChips])

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex min-h-10 flex-wrap items-center gap-2 rounded bg-[#1F232B] p-2">
        <Icon icon="search" className="px-2" />
        {[...selectedChips.entries()].map(([key, chip]) => (
          <Chip
            key={key}
            data={chip}
            onDelete={() => {
              unselectChip(key)
            }}
            onChange={(e) => updateChipValue(key, e.target.value)}
          />
        ))}
        <MainSearchInput
          onChange={props.onChange}
          containerRef={containerRef}
          onOpen={() => setShowingMenu(true)}
          onClose={() => setShowingMenu(false)}
          inputRef={inputRef}
          onAccept={props.onAcceptInput}
          onDelete={deleteLastChip}
        />
        {props.loading && <Spinner size={20} />}
        <Icon icon="cross" onClick={unselectAllChips} className="cursor-pointer px-2" />
      </div>
      {props.chips.length !== 0 && showingMenu && (
        <TuringMenu className="bg-grey-900! absolute z-[1000] mt-8 max-h-80 w-full overflow-y-auto rounded opacity-95">
          {props.chips
            .filter((chip) => !selectedChips.has(chip.text))
            .map((chip) => (
              <TuringMenuItem
                text={chip.value ?? chip.text}
                icon={chip.icon}
                key={`${chip.text}-${chip.value}`}
                onClick={() => {
                  selectChip(chip.text, chip)
                  setShowingMenu(false)
                  if (inputRef.current === undefined) return
                  inputRef.current.value = ''
                }}
                className="bg-grey-900! p-2 text-left"
              />
            ))}
        </TuringMenu>
      )}
    </div>
  )
}
