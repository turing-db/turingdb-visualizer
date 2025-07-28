import { Button, type ButtonProps } from '@blueprintjs/core'
import clsx from 'clsx'

interface TuringLinkButtonProps extends ButtonProps {}

export default function TuringLinkButton(props: TuringLinkButtonProps) {
  return <Button {...props} className={clsx('app-link-button', props.className)} />
}
