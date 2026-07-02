import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { ChatProviderId, ChatRecord } from '@shared/chat'
import { FolderRecord } from '@shared/folder'
import { ViewBounds } from '@shared/layout'
import { AppState } from '@shared/app-state'
import { Preferences } from '@shared/preferences'
import { Page } from '@shared/navigation'

const api = {
  navigation: {
    pageChanged: (page: Page) => ipcRenderer.send('navigation:page-changed', page)
  },
  layout: {
    setWebviewBounds: (bounds: ViewBounds) => ipcRenderer.send('view:set-bounds', bounds),
    setWebviewVisible: (visible: boolean) => ipcRenderer.send('view:set-visible', visible)
  },
  appState: {
    getAll: (): Promise<AppState> => ipcRenderer.invoke('appState:get-all'),
    set: <K extends keyof AppState>(key: K, value: AppState[K]): Promise<void> => ipcRenderer.invoke('appState:set', key, value)
  },
  preferences: {
    getAll: (): Promise<Preferences> => ipcRenderer.invoke('preferences:get-all'),
    set: <K extends keyof Preferences>(key: K, value: Preferences[K]): Promise<void> => ipcRenderer.invoke('preferences:set', key, value)
  },
  chats: {
    list: () => ipcRenderer.invoke('chats:list'),
    getActive: () => ipcRenderer.invoke('chats:active'),
    open: (chatId: number) => ipcRenderer.invoke('chats:open', chatId),
    new: (providerId: ChatProviderId, folderId: number | null) => ipcRenderer.invoke('chats:new', providerId, folderId),
    remove: (chatId: number) => ipcRenderer.invoke('chats:remove', chatId),
    moveToFolder: (chatId: number, folderId: number | null) => ipcRenderer.invoke('chats:move-to-folder', chatId, folderId),
    moveBefore: (chatId: number, beforeChatId: number) => ipcRenderer.invoke('chats:move-before', chatId, beforeChatId),
    moveAfter: (chatId: number, afterChatId: number) => ipcRenderer.invoke('chats:move-after', chatId, afterChatId),
    onChanged: (callback: (chats: ChatRecord[]) => void) => {
      const listener = (_event: IpcRendererEvent, chats: ChatRecord[]) => callback(chats)
      ipcRenderer.on('chats:changed', listener)
      return () => ipcRenderer.removeListener('chats:changed', listener)
    },
    onActiveChanged: (callback: (chatId: number | null) => void) => {
      const listener = (_event: IpcRendererEvent, chatId: number | null) => callback(chatId)
      ipcRenderer.on('chats:active-changed', listener)
      return () => ipcRenderer.removeListener('chats:active-changed', listener)
    }
  },
  folders: {
    list: () => ipcRenderer.invoke('folders:list'),
    create: (name?: string | null, parentFolderId?: number | null) => ipcRenderer.invoke('folders:create', name ?? null, parentFolderId ?? null),
    delete: (folderId: number) => ipcRenderer.invoke('folders:delete', folderId),
    rename: (folderId: number, name: string) => ipcRenderer.invoke('folders:rename', folderId, name),
    moveToFolder: (folderId: number, parentFolderId: number | null) => ipcRenderer.invoke('folders:move-to-folder', folderId, parentFolderId),
    moveBefore: (folderId: number, beforeFolderId: number) => ipcRenderer.invoke('folders:move-before', folderId, beforeFolderId),
    moveAfter: (folderId: number, afterFolderId: number) => ipcRenderer.invoke('folders:move-after', folderId, afterFolderId),
    onChanged: (callback: (folders: FolderRecord[]) => void) => {
      const listener = (_event: IpcRendererEvent, folders: FolderRecord[]) => callback(folders)
      ipcRenderer.on('folders:changed', listener)
      return () => ipcRenderer.removeListener('folders:changed', listener)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
