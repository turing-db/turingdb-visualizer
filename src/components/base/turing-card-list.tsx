import { CardList, type CardListProps } from '@blueprintjs/core'
import clsx from 'clsx'
import { useCallback, useEffect, useRef, useState } from 'react'

interface TuringCardListProps extends CardListProps {}

export default function TuringCardList(props: TuringCardListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const [isScrollbarVisible, setIsScrollbarVisible] = useState(false)
  const checkForScrollbar = useCallback(() => {
    if (!listRef.current) return
    const { clientHeight, scrollHeight } = listRef.current
    setIsScrollbarVisible(scrollHeight > clientHeight)
  }, [])
  useEffect(() => {
    checkForScrollbar()
  }, [checkForScrollbar])

  return (
    <CardList
      ref={listRef}
      {...props}
      className={clsx(
        'app-card-list',
        {
          'app-card-list--scrollbar-visible': isScrollbarVisible,
        },
        props.className
      )}
    >
      {props.children}
    </CardList>
  )
}
