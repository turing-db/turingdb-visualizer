import { Tooltip, type TooltipProps } from '@blueprintjs/core'

interface TuringTooltipProps extends TooltipProps {}

export const TuringTooltip = (props: TuringTooltipProps) => {
  const { children, ...rest } = props
  return (
    <Tooltip compact popoverClassName="app-tooltip" hoverCloseDelay={50} minimal {...rest}>
      {children}
    </Tooltip>
  )
}
export default TuringTooltip
