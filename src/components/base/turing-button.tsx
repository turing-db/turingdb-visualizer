import { Button, type ButtonSharedProps } from '@blueprintjs/core'

interface TuringButtonProps extends ButtonSharedProps {
  highlight?: boolean
  borderless?: boolean
}

export const TuringButton = (props: TuringButtonProps) => {
  const { highlight, children, className, borderless, ...rest } = props

  return (
    <Button
      {...rest}
      className={`app-button ${highlight && 'is-highlighted'} ${borderless && 'is-borderless'} ${className}`}
    >
      {children}
    </Button>
  )
}
export default TuringButton
