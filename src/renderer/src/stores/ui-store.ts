import { create } from 'zustand'

export type EditingElement = { type: string; id?: number }

type UiStore = {
  editingElement: EditingElement | null
  actions: {
    startEditing: (element: EditingElement) => void
    stopEditing: () => void
  }
}

export const useUiStore = create<UiStore>((set) => ({
  editingElement: null,
  actions: {
    startEditing: (element) => {
      set({ editingElement: element })
    },
    stopEditing: () => {
      set({ editingElement: null })
    }
  }
}))
