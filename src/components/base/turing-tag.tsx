import { Tag, type TagProps } from '@blueprintjs/core'

interface TuringTagProps extends TagProps {
  label: string
}

export const TuringTag = (props: TuringTagProps) => {
  return (
    <Tag key={props.label} round={true} {...props}>
      {props.label}
    </Tag>
  )
}
