import { Card, type CardProps } from '@blueprintjs/core'
import clsx from 'clsx'
import TuringBadge from './turing-badge'

interface TuringCardProps extends CardProps {
  title?: string
  subtitle?: string | number
  clampSubtitle?: boolean
  icon?: React.ReactNode
  iconOnlyOnHover?: boolean
  badge?: React.ReactNode
  activeBadge?: boolean
}

export default function TuringCard(props: TuringCardProps) {
  const isHeaderVisible = props.title !== undefined || props.subtitle !== undefined
  return (
    <Card
      {...props}
      className={clsx(
        'app-card',
        {
          'icon-only-on-hover': props.iconOnlyOnHover,
        },
        props.className
      )}
    >
      <div className="app-card-content flex-grow">
        {isHeaderVisible && (
          <div className="app-card-header flex w-full items-center justify-between gap-x-4">
            <div className="app-card-header-text">
              {props.title !== undefined && (
                <h5 className="app-card-title text-content-primary text-sm leading-[1.43] font-semibold">
                  {props.title}
                </h5>
              )}
              <div className="mt-1 flex items-center gap-2">
                {props.badge !== undefined && (
                  <TuringBadge active={props.activeBadge}>{props.badge}</TuringBadge>
                )}
                {props.subtitle !== undefined && (
                  <p
                    className={clsx(
                      'app-card-subtitle text-content-secondary text-xs leading-[1.33]',
                      {
                        'line-clamp-1': props.clampSubtitle,
                      }
                    )}
                  >
                    {props.subtitle}
                  </p>
                )}
              </div>
            </div>
            {props.icon !== undefined && (
              <div className="app-card-header-icon flex-shrink-0">{props.icon}</div>
            )}
          </div>
        )}
        {props.children}
      </div>
    </Card>
  )
}
