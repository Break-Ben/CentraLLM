import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { ChatRecord } from '@shared/chat'
import { ViewBounds } from '@shared/layout'
import { AppState } from '@shared/app-state'
import { Preferences } from '@shared/preferences'

const api = {
  chats: {
    list: () => ipcRenderer.invoke('chats:list'),
    getActive: () => ipcRenderer.invoke('chats:active'),
    open: (chatId: number) => ipcRenderer.invoke('chats:open', chatId),
    new: (providerId: string) => ipcRenderer.invoke('chats:new', providerId),
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
  layout: {
    setWebviewBounds: (bounds: ViewBounds) => ipcRenderer.send('view:set-bounds', bounds),
    setWebviewVisible: (visible: boolean) => ipcRenderer.send('view:set-visible', visible)
  },
  appState: {
    getAll: (): Promise<AppState> => ipcRenderer.invoke('appState:getAll'),
    set: <K extends keyof AppState>(key: K, value: AppState[K]): Promise<void> => ipcRenderer.invoke('appState:set', key, value)
  },
  preferences: {
    getAll: (): Promise<Preferences> => ipcRenderer.invoke('preferences:getAll'),
    set: <K extends keyof Preferences>(key: K, value: Preferences[K]): Promise<void> => ipcRenderer.invoke('preferences:set', key, value)
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
