import type { ChipData } from './chip'
import { create } from 'zustand'

export type SelectChipFunction = (key: string, chip: ChipData) => void

type SelectedChipsStore = {
  selectedChips: Map<string, ChipData>
  unselectChip: (key: string) => void
  selectChip: SelectChipFunction
  unselectAllChips: () => void
  updateChipValue: (key: string, value: string) => void
}

export const useSelectedChips = create<SelectedChipsStore>((set) => ({
  selectedChips: new Map(),

  unselectChip: (key: string) =>
    set((state) => {
      const newState = new Map(state.selectedChips)
      newState.delete(key)
      return { selectedChips: newState }
    }),

  selectChip: (key: string, chip: ChipData) =>
    set((state) => ({ selectedChips: new Map(state.selectedChips.set(key, chip)) })),

  unselectAllChips: () => set(() => ({ selectedChips: new Map() })),

  updateChipValue: (key: string, value: string) =>
    set((state) => {
      const newState = new Map(state.selectedChips)
      const data = newState.get(key)
      if (!data) return state
      data.value = value
      return { selectedChips: newState }
    }),
}))
