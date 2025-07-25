import TuringButton from '@/components/base/turing-button'
import { TuringTag } from '@/components/base/turing-tag'
import { getNodeName } from '@/utils/nodes'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { TuringNodeInspectorCollapsed } from './turing-node-inspector.collapsed'
import { TuringNodeInspectorExtended } from './turing-node-inspector.extended'

import { useAppStore, useVisStore } from '@/stores'
import { Icon } from '@blueprintjs/core'
import nodeBlueSmall from '../../../assets/imgs/node-blue-small.svg'

export const TuringNodeInspector = () => {
  const entityCache = useVisStore((state) => state.entityCache)
  const [isExtended, setIsExtended] = useState(false)
  const inspectNodeInfo = useVisStore((state) => state.inspectNodeInfo)
  const graphName = useAppStore((state) => state.graphName)

  const node = useMemo(() => {
    if (!inspectNodeInfo) return undefined
    return entityCache.nodes.get(inspectNodeInfo.nodeID)
  }, [entityCache, inspectNodeInfo])

  const nodePrimaryProperty = useMemo(() => {
    if (!node) return undefined
    return getNodeName(node.properties)
  }, [node])

  if (!node) return
  if (graphName === undefined) return

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
      }}
      onKeyUp={(e) => {
        e.stopPropagation()
      }}
      className={clsx(
        'bg-grey-800 shadow-dark pointer-events-auto absolute top-[0.0625rem] left-[0.0625rem] flex h-[100%] flex-col overflow-hidden transition-all duration-300',
        [inspectNodeInfo ? 'translate-x-[0]' : 'translate-x-[calc(-100%-2px)]'],
        [isExtended ? 'w-[28.125rem]' : 'w-[15.625rem]']
      )}
    >
      <div
        className={clsx(
          'border-grey-600 flex flex-shrink-0 items-center justify-between gap-x-4 border-r border-b px-4 py-3 transition-[height] duration-200 ease-linear',
          [isExtended ? 'h-[3.75rem]' : 'h-[3rem]']
        )}
      >
        <div className="overflow-hidden">
          <div className="flex items-center gap-x-2.5">
            <img
              aria-label="Node"
              src={nodeBlueSmall}
              className="h-[24px] w-[25px] flex-shrink-0"
            />
            <div className="flex min-h-[1.5rem] items-center overflow-hidden">
              <div className="overflow-hidden">
                <h2
                  className="text-content-primary line-clamp-1 text-sm leading-[1.42] font-medium"
                  title={String(nodePrimaryProperty?.value)}
                >
                  {nodePrimaryProperty?.value ?? node.id}
                </h2>
                {isExtended && (
                  <p className="text-content-secondary mt-0.5 line-clamp-1 block text-xs leading-[1.16] font-medium text-ellipsis whitespace-nowrap">
                    ID: {node.id}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        {isExtended ? (
          <TuringButton
            className="flex-shrink-0"
            onClick={() => setIsExtended((v) => !v)}
            rightIcon="cross"
          />
        ) : (
          <button
            className="text-primary-default flex flex-shrink-0 items-center gap-1 text-xs tracking-[0.06em] whitespace-nowrap"
            type="button"
            onClick={() => setIsExtended((v) => !v)}
          >
            <span>Details</span>
            <Icon className="{}" icon="chevron-right" />
          </button>
        )}
      </div>
      <div
        className={clsx(
          'border-grey-600 flex flex-grow flex-col overflow-x-hidden overflow-y-auto border-r transition-opacity duration-300',
          [inspectNodeInfo ? 'opacity-100' : 'opacity-0']
        )}
      >
        <div className="flex flex-wrap justify-start p-4">
          {node.labels.map((label) => (
            <TuringTag className="m-1" key={label} label={label} />
          ))}
        </div>
        {isExtended ? (
          <TuringNodeInspectorExtended node={node} graph={graphName} />
        ) : (
          <TuringNodeInspectorCollapsed node={node} graph={graphName} />
        )}
      </div>
    </div>
  )
}
