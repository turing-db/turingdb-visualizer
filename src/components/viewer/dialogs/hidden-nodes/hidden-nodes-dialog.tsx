import TuringButton from '@/components/base/turing-button'
import { useVisStore } from '@/stores'
import { TuringDialog } from '@/components/base/turing-dialog'
import { DialogBody, DialogFooter } from '@blueprintjs/core'
import { type FC, useMemo, useState } from 'react'
import type { NodeEntry } from '@/api/models/nodeEntry.model'
import { getNodeName } from '@/utils/nodes'
import TuringNodePropertiesListExtended from '@/components/viewer/node-inspector/extended/turing-node-properties.extended'
import TuringInput from '@/components/base/turing-input'

interface NodeName {
  value: string
  type: string
}

interface NodeCardProps {
  node: NodeEntry
  name?: NodeName
}

export interface NodeIDBadgeProps {
  id: number
}
const NodeIDBadge: FC<NodeIDBadgeProps> = (props) => (
  <span className="app-node-card-id text-content-tertiary m-0 mr-2 p-0 text-sm">{props.id}</span>
)

export interface NodeNameType {
  type: string
}

const NodeNameType: FC<NodeNameType> = (props) => (
  <span className="app-node-card-name-type text-content-tertiary m-0 ml-2 p-0 text-sm">
    [{props.type}]
  </span>
)

const NodeCard: FC<NodeCardProps> = (props) => {
  const hiddenNodes = useVisStore((state) => state.hiddenNodes)
  const nodeTitle = useMemo(() => {
    if (props.name === undefined)
      return (
        <>
          <NodeIDBadge id={props.node.id} />
          <span>Unnamed node</span>
        </>
      )

    const value =
      props.name.value.length > 20 ? `${props.name.value.slice(0, 20)}...` : props.name.value

    return (
      <>
        <NodeIDBadge id={props.node.id} />
        <span className="app-node-card-name-value">{value}</span>
        <NodeNameType type={props.name.type} />
      </>
    )
  }, [props.node, props.name])

  return (
    <div className="app-node-card flex flex-col">
      <div className="app-node-card-title m-0 p-0">{nodeTitle}</div>
      <div className="app-node-card-content flex flex-row">
        <div className="app-node-card-icon">
          <TuringButton
            icon="eye-open"
            className="text-content-tertiary"
            onClick={() => {
              hiddenNodes.delete(props.node.id)
            }}
          >
            Show
          </TuringButton>
        </div>
        <TuringNodePropertiesListExtended properties={props.node.properties} />
      </div>
    </div>
  )
}

export interface HiddenNodesDialogProps {
  open: boolean
  onClose: () => void
}

export const HiddenNodesDialog: FC<HiddenNodesDialogProps> = (props) => {
  const [page, setPage] = useState(0)
  const hiddenNodes = useVisStore((state) => state.hiddenNodes)
  const entityCache = useVisStore((state) => state.entityCache)
  const [filter, setFilter] = useState('')

  const nodeEntries = useMemo(() => {
    return Array.from(hiddenNodes)
      .map((id) => entityCache.nodes.get(id))
      .filter((n) => n !== undefined)
      .map((n) => {
        const returnValue: { node: NodeEntry; name: NodeName | undefined } = {
          node: n,
          name: undefined,
        }

        const nameProperty = getNodeName(n.properties)

        if (nameProperty === null || nameProperty.value === null) {
          return returnValue
        }

        returnValue.name = {
          value: nameProperty.value.toString(),
          type: nameProperty.type,
        }

        return returnValue
      })
      .filter((entry) => {
        if (filter.length === 0) return true
        if (entry.name === undefined) return false

        return entry.name.value.toLowerCase().includes(filter)
      })
  }, [entityCache, hiddenNodes, filter])

  const pageCount = useMemo(() => {
    return Math.ceil(nodeEntries.length / 10)
  }, [nodeEntries])

  return (
    <TuringDialog
      isOpen={props.open}
      onClose={() => {
        setPage(0)
        props.onClose()
      }}
      title="Hidden nodes"
      icon="eye-open"
    >
      <DialogBody>
        <div className="flex h-full flex-col">
          <TuringInput
            onChange={(e) => {
              setPage(0)
              setFilter(e.target.value.toLowerCase())
            }}
            placeholder="Search nodes"
            className="mb-2"
          />
          <div
            onScroll={(e) => {
              if (!e.target) return

              const target = e.target as HTMLDivElement
              const scroll = target.scrollHeight - target.scrollTop
              const threshold = target.offsetHeight * 0.05
              const atBottom = scroll - threshold < target.offsetHeight
              if (atBottom && page < pageCount) {
                setPage((state) => state + 1)
              }
            }}
            className="app-node-card-list h-full overflow-y-scroll"
          >
            {nodeEntries.slice(0, (page + 1) * 10).map((n) => (
              <NodeCard key={n.node.id} node={n.node} name={n.name} />
            ))}
          </div>
        </div>
      </DialogBody>
      <DialogFooter
        actions={<TuringButton intent="primary" text="Close" outlined onClick={props.onClose} />}
      />
    </TuringDialog>
  )
}
