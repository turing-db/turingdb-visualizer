import { TuringSearchBar } from '@/components/turing-bar/turing-search-bar'
import { type FC, useCallback, useEffect, useMemo, useRef } from 'react'
import { useNodeChips } from './use-searched-node-names'

import type { ChipData } from '@/components/turing-bar/chip'
import {
  type SelectChipFunction,
  useSelectedChips,
} from '@/components/turing-bar/use-selected-chips'
import useGraphInfo from '@/hooks/use-graph-info'
import { useAppStore } from '@/stores'
import { NODE_DISPLAY_NAMES } from '@/utils/nodes'
import type { FilterType } from './use-filters'

interface ChipInfo {
  text: string
  value?: string
}

interface AddNodesSearchBarProps {
  setFilters: (filters: FilterType) => void
  open?: boolean
  initialSearchTerm?: string
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

  // Seed the default name-property chip with the initial term when the dialog
  // opens with one (e.g. via the toolbar's "More results" action). We reset
  // prior chips first so the dialog starts in a predictable state.
  useEffect(() => {
    if (!props.open) return
    if (!props.initialSearchTerm || !defaultPropertyType) return
    const { unselectAllChips, selectChip } = useSelectedChips.getState()
    unselectAllChips()
    selectChip(defaultPropertyType, {
      text: defaultPropertyType,
      value: props.initialSearchTerm,
      icon: 'property',
      takesInput: true,
    })
  }, [props.open, props.initialSearchTerm, defaultPropertyType])

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
