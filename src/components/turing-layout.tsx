import { useAppStore } from '@/stores'
import type React from 'react'
import { TuringTopBar } from './top-bar/turing-top-bar'
import { TuringSideBar } from './side-bar/turing-side-bar'

type TuringLayoutProps = {
  children?: React.ReactNode
}

export const TuringLayout = (props: TuringLayoutProps) => {
  const theme = useAppStore((state) => state.theme)

  return (
    <div
      className={`bp5-${theme} app-scrollbar box-border grid h-screen w-full grid-cols-2 grid-cols-[max-content_1fr] grid-rows-[max-content_1fr] bg-white`}
    >
      <div className="row-span-2">
        <TuringSideBar />
      </div>
      <div>
        <TuringTopBar />
      </div>
      <div className="h-full w-full overflow-hidden">{props.children}</div>
    </div>
  )
}
