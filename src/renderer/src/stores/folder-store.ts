import { create } from 'zustand'
import { FolderRecord } from '@shared/folder'

type FolderStore = {
  folders: FolderRecord[]
  actions: {
    init: () => () => void
    moveToFolder: (folderId: number, parentFolderId: number | null) => Promise<void>
    moveBefore: (folderId: number, beforeFolderId: number) => Promise<void>
    moveAfter: (folderId: number, afterFolderId: number) => Promise<void>
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
    moveToFolder: async (folderId, parentFolderId) => {
      await window.api.folders.moveToFolder(folderId, parentFolderId)
    },
    moveBefore: async (folderId, beforeFolderId) => {
      await window.api.folders.moveBefore(folderId, beforeFolderId)
    },
    moveAfter: async (folderId, afterFolderId) => {
      await window.api.folders.moveAfter(folderId, afterFolderId)
    }
  }
}))
