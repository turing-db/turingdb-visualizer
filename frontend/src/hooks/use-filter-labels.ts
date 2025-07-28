import type { TuringMultiSelectItem } from '@/components/base/turing-multi-select-item'
import { listLabels } from '@/api'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { ListLabelsResponse } from '@/api/responses'
import useGraphInfo from './use-graph-info'
import { useAppStore } from '@/stores'

interface LabelMultiSelectItems {
  selected: TuringMultiSelectItem[]
  notselected: TuringMultiSelectItem[]
}

const defaultLabels: ListLabelsResponse = { labels: [], nodeCounts: [] }
const defaultFilteredLabels: LabelMultiSelectItems = { selected: [], notselected: [] }

export const useFilterLabels = () => {
  const [filteredLabels, setFilteredLabels] = useState<LabelMultiSelectItems>(defaultFilteredLabels)
  const graphName = useAppStore((state) => state.graphName)
  const graph = useGraphInfo(graphName)

  const { data: labels } = useQuery({
    queryKey: ['list-labels', graph.info, graph.info?.name, filteredLabels.selected],
    queryFn: () => {
      if (!graph.info) return defaultLabels
      return listLabels({
        graph: graph.info.name,
        currentLabels: filteredLabels.selected.map((l) => l.name),
      })
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  useEffect(() => {
    if (!labels) return

    setFilteredLabels((state) => ({
      selected: state.selected,
      notselected: labels.labels
        .map((l, i) => ({
          name: l,
          key: labels.nodeCounts[i].toString(),
        }))
        .filter((_, i) => labels.nodeCounts[i] !== 0),
    }))
  }, [labels])

  return {
    labels: filteredLabels,
    remove: (label: TuringMultiSelectItem) => {
      const newSelectedLabels = filteredLabels.selected.filter((l) => l.name !== label.name)
      setFilteredLabels((state) => ({
        selected: newSelectedLabels,
        notselected: state.notselected.concat([label]),
      }))
    },
    add: (label: TuringMultiSelectItem) => {
      const newSelectedLabels = filteredLabels.selected.concat([label])
      setFilteredLabels((state) => ({
        selected: newSelectedLabels,
        notselected: state.notselected.filter((l) => l.name !== label.name),
      }))
    },
    clear: () => {
      setFilteredLabels({ selected: [], notselected: [] })
    },
  }
}

export type FilterLabelStorage = ReturnType<typeof useFilterLabels>
