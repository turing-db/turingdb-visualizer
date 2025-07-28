import clsx from 'clsx'
import type { ComponentProps, ElementType } from 'react'

export type TuringBadgeProps<T extends keyof JSX.IntrinsicElements> = ComponentProps<T> & {
  children: React.ReactNode
  as?: T
  circle?: boolean
  alt?: boolean
  active?: boolean
  className?: string
}

export default function TuringBadge<T extends keyof JSX.IntrinsicElements>({
  children,
  as: Tag = 'p' as T,
  circle,
  alt,
  active,
  className = '',
  ...rest
}: TuringBadgeProps<T>) {
  const defaultClasses = 'shadow-badge rounded-[0.125rem] bg-grey-600 p-1'
  const circleClasses =
    'rounded-full px-1.5 py-0.5 rounded-[4.375rem] bg-white/10 border border-white/10'
  const altClasses = 'bg-white/10 px-1 py-0.5 border border-white/10 rounded-[0.125rem]'

  let classes = ''
  if (circle) {
    classes = circleClasses
  } else if (alt) {
    classes = altClasses
  } else {
    classes = defaultClasses
  }

  const Component = Tag as ElementType

  return (
    <Component
      className={clsx(
        'text-content-primary inline-flex text-xs leading-[1.16] font-medium tracking-[0.06rem]',
        {
          'border-primary-default border': active,
        },
        classes,
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  )
}
