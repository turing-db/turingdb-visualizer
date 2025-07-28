import { Icon } from '@blueprintjs/core'
import TuringLinkButton from './turing-link-button'

export default function TuringCollapseTrigger({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <div className="relative mt-3 flex items-center justify-center">
      <hr className="bg-grey-700 absolute top-1/2 h-[2px] w-full translate-y-[-50%] transform border-0" />
      <div className="!bg-grey-900 z-[1] flex px-4">
        <TuringLinkButton rightIcon={<Icon icon="plus" color="#679CFF" />} onClick={onClick}>
          {children}
        </TuringLinkButton>
      </div>
    </div>
  )
}
