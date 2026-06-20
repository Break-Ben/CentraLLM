import { create } from 'zustand'
import { FolderRecord } from '@shared/folder'

type FolderStore = {
  folders: FolderRecord[]
  actions: {
    init: () => () => void
    setFolders: (folders: FolderRecord[]) => void
  }
}

export const useFolderStore = create<FolderStore>((set) => ({
  folders: [],
  actions: {
    init: () => {
      let cancelled = false

      void window.api.folders.list().then((items) => {
        if (!cancelled) {
          set({ folders: items })
        }
      })

      const disposeFolders = window.api.folders.onChanged((items) => {
        set({ folders: items })
      })

      return () => {
        cancelled = true
        disposeFolders()
      }
    },
    setFolders: (folders) => set({ folders })
  }
}))
