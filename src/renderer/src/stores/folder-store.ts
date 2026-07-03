import { create } from 'zustand'
import { FolderRecord } from '@shared/folder'

type FolderStore = {
  folders: FolderRecord[]
  folderParentMap: Map<number, number | null>
  actions: {
    init: () => () => void
    moveToFolder: (folderId: number, parentFolderId: number | null) => Promise<void>
    moveBefore: (folderId: number, beforeFolderId: number) => Promise<void>
    moveAfter: (folderId: number, afterFolderId: number) => Promise<void>
    isDescendant: (ancestorId: number, folderId: number) => boolean
  }
}

export const useFolderStore = create<FolderStore>((set, get) => ({
  folders: [],
  folderParentMap: new Map(),
  actions: {
    init: () => {
      let cancelled = false

      void window.api.folders.list().then((items) => {
        if (!cancelled) {
          set({ folders: items, folderParentMap: buildParentMap(items) })
        }
      })

      const disposeFolders = window.api.folders.onChanged((items) => {
        set({ folders: items, folderParentMap: buildParentMap(items) })
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
    },
    isDescendant: (ancestorId, folderId) => {
      const { folderParentMap } = get()
      let current = folderParentMap.get(folderId) ?? null
      while (current !== null) {
        if (current === ancestorId) {
          return true
        }
        current = folderParentMap.get(current) ?? null
      }
      return false
    }
  }
}))

const buildParentMap = (folders: FolderRecord[]): Map<number, number | null> => new Map(folders.map((folder) => [folder.id, folder.parentFolderId]))
