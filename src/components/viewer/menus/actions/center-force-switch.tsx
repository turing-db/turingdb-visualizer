import TuringSwitch from '@/components/base/turing-switch'
import TuringTooltip from '@/components/base/turing-tooltip'
import { useCanvasStore } from '@/stores'
import { useMemo } from 'react'

export const CenterForceSwitch = () => {
  const centerForce = useCanvasStore((state: any) => state.centerForce)
  const turingActions = useCanvasStore((state: any) => state.actions)

  const centerForceTooltip = useMemo(() => {
    return centerForce() ? 'Deactivate center force' : 'Activate center force'
  }, [centerForce])

  return (
    <TuringTooltip content={centerForceTooltip} placement="bottom">
      <TuringSwitch
        icon="clip"
        iconActive="circle"
        value={centerForce()}
        onChange={(value) => {
          turingActions.activateCenterForce(value)
        }}
      >
        Gravity
      </TuringSwitch>
    </TuringTooltip>
  )
}
