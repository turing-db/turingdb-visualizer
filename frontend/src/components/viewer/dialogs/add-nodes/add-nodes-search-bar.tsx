import { TuringSearchBar } from '@/components/turing-bar/turing-search-bar'
import { type FC, useCallback, useMemo, useRef } from 'react'
import { useNodeChips } from './use-searched-node-names'

import type { ChipData } from '@/components/turing-bar/chip'
import { NODE_DISPLAY_NAMES } from '@/utils/nodes'
import type { SelectChipFunction } from '@/components/turing-bar/use-selected-chips'
import type { FilterType } from './use-filters'
import { useAppStore } from '@/stores'
import useGraphInfo from '@/hooks/use-graph-info'

interface ChipInfo {
  text: string
  value?: string
}

interface AddNodesSearchBarProps {
  setFilters: (filters: FilterType) => void
}

export const AddNodesSearchBar: FC<AddNodesSearchBarProps> = (props) => {
  const graphName = useAppStore((state) => state.graphName)
  const graph = useGraphInfo(graphName)
  const { nodeChips, searchedName, setSearchedName, loadingChips } = useNodeChips()
  const { setFilters } = props

  const labelMenuItems = useMemo<ChipInfo[]>(() => {
    if (!graph.info) return []

    const labelsChips = graph.info.labels.map((label) => ({
      text: label,
      value: undefined,
    }))

    return labelsChips
  }, [graph.info])

  const propertyMenuItems = useMemo<ChipInfo[]>(() => {
    if (!graph.info) return []

    const propertiesChips = graph.info.propTypes.map((prop) => ({
      text: prop,
      value: undefined,
    }))

    return propertiesChips
  }, [graph.info])

  const onChipChange = useCallback(
    (chips: Map<string, ChipData>) => {
      const chipArray = [...chips.values()]
      const labelFilters = chipArray.filter((chip) => chip.icon === 'tag').map((chip) => chip.text)

      const propertyFilters = new Map<string, string>(
        chipArray.filter((chip) => chip.icon !== 'tag').map((chip) => [chip.text, chip.value ?? ''])
      )

      setSearchedName('')
      setFilters({ labelFilters, propertyFilters })
    },
    [setFilters, setSearchedName]
  )

  const chips = useMemo(() => {
    return [
      ...labelMenuItems
        .filter((chip) => chip.text.toLowerCase().includes(searchedName))
        .map<ChipData>((chip) => ({ ...chip, icon: 'tag' })),

      ...propertyMenuItems
        .filter((chip) => chip.text.toLowerCase().includes(searchedName))
        .map<ChipData>((chip) => ({ ...chip, icon: 'property', takesInput: true })),

      ...nodeChips.map<ChipData>((chip) => ({ ...chip, icon: 'graph', takesInput: true })),
    ]
  }, [nodeChips, searchedName, labelMenuItems, propertyMenuItems])

  const defaultPropertyType = useMemo(() => {
    return NODE_DISPLAY_NAMES.find((ndn) => graph.info?.propTypes.some((prop) => prop === ndn))
  }, [graph.info?.propTypes])

  const selectChipRef = useRef<SelectChipFunction>(() => {})

  return (
    <TuringSearchBar
      chips={chips}
      onChange={(e) => {
        const v = e.target.value.toLowerCase()
        setSearchedName(v)
      }}
      onChipChange={onChipChange}
      selectChipRef={selectChipRef}
      onAcceptInput={(v) => {
        if (defaultPropertyType === undefined) return

        selectChipRef.current(defaultPropertyType, {
          text: defaultPropertyType,
          value: v,
          icon: 'property',
          takesInput: true,
        })
      }}
      loading={loadingChips}
    />
  )
}
