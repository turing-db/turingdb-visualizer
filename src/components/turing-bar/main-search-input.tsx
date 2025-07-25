import {
  type ChangeEvent,
  type FC,
  type KeyboardEvent,
  type MutableRefObject,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
} from 'react'

interface SearchInputProps {
  containerRef: RefObject<HTMLDivElement>
  inputRef?: MutableRefObject<HTMLDivElement>
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onOpen: () => void
  onClose: () => void
  onAccept?: (value: string) => void
  onDelete?: () => void
}

export const MainSearchInput: FC<SearchInputProps> = (props) => {
  const ref = useRef<HTMLInputElement>(null)
  const { inputRef, containerRef, onOpen, onClose, onAccept, onDelete } = props

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        onClose()
        e.stopPropagation()
        return
      }

      if (e.key === 'Enter') {
        if (!onAccept) return
        if (!ref.current) return
        onAccept(ref.current.value)
        onClose()
        ref.current.value = ''
        return
      }

      if (e.key === 'Backspace') {
        if (!onDelete) return
        if (!ref.current) return
        if (ref.current.value.length > 0) return
        onDelete()
        onClose()
        return
      }

      onOpen()
    },
    [onOpen, onClose, onAccept, onDelete]
  )

  if (inputRef && ref.current) {
    inputRef.current = ref.current
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!event.target) {
        onClose()
        return
      }

      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [containerRef, onClose])

  return (
    <input
      ref={ref}
      type="text"
      placeholder="Select filters..."
      onChange={props.onChange}
      onClick={props.onOpen}
      onKeyDown={onKeyDown}
      className="flex-grow text-[#A2A6AF]"
    />
  )
}
