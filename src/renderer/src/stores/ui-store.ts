import { create } from 'zustand'

type UiStore = {
  editingFolderId: number | null
  actions: {
    startFolderRename: (folderId: number) => void
    stopFolderRename: () => void
  }
}

export const useUiStore = create<UiStore>((set) => ({
  editingFolderId: null,
  actions: {
    startFolderRename: (folderId) => {
      set({ editingFolderId: folderId })
    },
    stopFolderRename: () => {
      set({ editingFolderId: null })
    }
  }
}))
