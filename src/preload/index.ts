import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { ChatProvider, ChatProviderId, ChatRecord } from '@shared/chat'
import { FolderRecord } from '@shared/folder'
import { ViewBounds } from '@shared/layout'
import { AppState } from '@shared/app-state'
import { Preferences } from '@shared/preferences'
import { KeyEvent } from '@shared/shortcuts'
import { Page } from '@shared/navigation'
import { AppInfo } from '@shared/app-info'

const api = {
  appInfo: {
    get: (): Promise<AppInfo> => ipcRenderer.invoke('app:get-info')
  },
  navigation: {
    pageChanged: (page: Page) => ipcRenderer.send('navigation:page-changed', page),
    onNavigate: (callback: (page: Page) => void) => {
      const listener = (_event: IpcRendererEvent, page: Page) => callback(page)
      ipcRenderer.on('navigation:navigate', listener)
      return () => ipcRenderer.removeListener('navigation:navigate', listener)
    }
  },
  layout: {
    setWebviewBounds: (bounds: ViewBounds) => ipcRenderer.send('view:set-bounds', bounds),
    setWebviewVisible: (visible: boolean) => ipcRenderer.send('view:set-visible', visible)
  },
  shortcuts: {
    setRecording: (recording: boolean) => ipcRenderer.send('shortcuts:set-recording', recording),
    onKeyEvent: (callback: (input: KeyEvent) => void) => {
      const listener = (_event: IpcRendererEvent, input: KeyEvent) => callback(input)
      ipcRenderer.on('shortcuts:key-event', listener)
      return () => ipcRenderer.removeListener('shortcuts:key-event', listener)
    }
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
    togglePin: (chatId: number) => ipcRenderer.invoke('chats:toggle-pin', chatId),
    moveToFolder: (chatId: number, folderId: number | null) => ipcRenderer.invoke('chats:move-to-folder', chatId, folderId),
    moveBefore: (chatId: number, beforeChatId: number) => ipcRenderer.invoke('chats:move-before', chatId, beforeChatId),
    moveAfter: (chatId: number, afterChatId: number) => ipcRenderer.invoke('chats:move-after', chatId, afterChatId),
    onChanged: (callback: (chats: ChatRecord[]) => void) => {
      const listener = (_event: IpcRendererEvent, chats: ChatRecord[]) => callback(chats)
      ipcRenderer.on('chats:changed', listener)
      return () => ipcRenderer.removeListener('chats:changed', listener)
    },
    onActiveChanged: (callback: (chatId: number | null, folderId: number | null) => void) => {
      const listener = (_event: IpcRendererEvent, chatId: number | null, folderId: number | null) => callback(chatId, folderId)
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
  },
  customProviders: {
    list: (): Promise<ChatProvider[]> => ipcRenderer.invoke('customProviders:list'),
    create: (data: Omit<ChatProvider, 'id'>): Promise<ChatProvider | null> => ipcRenderer.invoke('customProviders:create', data),
    update: (id: string, data: Omit<ChatProvider, 'id'>): Promise<ChatProvider | null> => ipcRenderer.invoke('customProviders:update', id, data),
    remove: (id: string): Promise<void> => ipcRenderer.invoke('customProviders:remove', id)
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
