import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import Database from 'better-sqlite3'
import { electronApp, is } from '@electron-toolkit/utils'
import icon from '@resources/icon.png?asset'
import { ChatController } from '@main/controllers/chat-controller'
import { ChatRepository } from '@main/repos/chat-repo'
import { FolderRepository } from '@main/repos/folder-repo'
import { AppStateRepository } from '@main/repos/app-state-repo'
import { PreferencesRepository } from '@main/repos/preferences-repo'
import { ChatProviderId } from '@shared/chat'
import { AppState } from '@shared/app-state'
import { Preferences } from '@shared/preferences'
import { Page } from '@shared/navigation'
import { NavigationController } from '@main/controllers/navigation-controller'

let mainWindow: BrowserWindow | null = null
let navigationController: NavigationController | null = null
let chatController: ChatController | null = null

let db: Database.Database | null = null
let chatRepo: ChatRepository | null = null
let folderRepo: FolderRepository | null = null
let appStateRepo: AppStateRepository | null = null
let preferencesRepo: PreferencesRepository | null = null

function createWindow(): void {
  if (!chatRepo || !folderRepo) {
    throw new Error('Chat/folder repository is not initialised')
  }

  mainWindow = new BrowserWindow({
    width: 1500,
    height: 1000,
    show: false,
    backgroundColor: '#00000000',
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  navigationController = new NavigationController(mainWindow, folderRepo)
  chatController = new ChatController(mainWindow, chatRepo, navigationController)

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    chatController?.destroy()
    mainWindow = null
    chatController = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  chatController.start().catch((err) => {
    console.error('Failed to start chat controller:', err)
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.break.centrallm')

  db = new Database(join(app.getPath('userData'), 'centrallm.db'))
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  chatRepo = new ChatRepository(db)
  folderRepo = new FolderRepository(db)
  appStateRepo = new AppStateRepository(db)
  preferencesRepo = new PreferencesRepository(db)

  // Navigation
  ipcMain.on('navigation:page-changed', (_event, page: Page) => {
    navigationController?.setPage(page)
  })

  // Layout
  ipcMain.on('view:set-bounds', (_event, bounds) => {
    chatController?.setBounds(bounds)
  })
  ipcMain.on('view:set-visible', (_event, visible: boolean) => {
    chatController?.setVisible(visible)
  })

  // App State
  ipcMain.handle('appState:get-all', () => appStateRepo?.getAll() ?? {})
  ipcMain.handle('appState:set', (_event, key: keyof AppState, value: AppState[typeof key]) => appStateRepo?.set(key, value))

  // Preferences
  ipcMain.handle('preferences:get-all', () => preferencesRepo?.getAll() ?? {})
  ipcMain.handle('preferences:set', (_event, key: keyof Preferences, value: Preferences[typeof key]) => preferencesRepo?.set(key, value))

  // Chats
  ipcMain.handle('chats:list', () => chatRepo?.listChats() ?? [])
  ipcMain.handle('chats:active', () => chatController?.getActiveChatId() ?? null)
  ipcMain.handle('chats:open', async (_event, chatId: number) => {
    await chatController?.openChat(chatId)
  })
  ipcMain.handle('chats:new', async (_event, providerId: ChatProviderId, folderId: number | null = null) => {
    await chatController?.openNewChat(providerId, folderId)
  })
  ipcMain.handle('chats:remove', (_event, chatId: number) => {
    chatController?.closeChatIfActive(chatId)
    chatRepo?.removeChat(chatId)
    emitChatsChanged()
  })
  ipcMain.handle('chats:move-to-folder', (_event, chatId: number, folderId: number | null) => {
    chatRepo?.moveToFolder(chatId, folderId)
    emitChatsChanged()
  })
  ipcMain.handle('chats:move-before', (_event, chatId: number, beforeChatId: number) => {
    chatRepo?.moveBefore(chatId, beforeChatId)
    emitChatsChanged()
  })
  ipcMain.handle('chats:move-after', (_event, chatId: number, afterChatId: number) => {
    chatRepo?.moveAfter(chatId, afterChatId)
    emitChatsChanged()
  })

  // Folders
  ipcMain.handle('folders:list', () => folderRepo?.listFolders() ?? [])
  ipcMain.handle('folders:create', (_event, name: string | null, parentFolderId: number | null) => {
    const folder = folderRepo?.createFolder(name ?? null, parentFolderId ?? null) ?? null
    emitFoldersChanged()
    return folder
  })
  ipcMain.handle('folders:delete', (_event, folderId: number) => {
    folderRepo?.deleteFolder(folderId)
    emitChatsChanged()
    emitFoldersChanged()
  })
  ipcMain.handle('folders:rename', (_event, folderId: number, name: string) => {
    const folder = folderRepo?.renameFolder(folderId, name) ?? null
    emitFoldersChanged()
    return folder
  })
  ipcMain.handle('folders:move-to-folder', (_event, folderId: number, parentFolderId: number | null) => {
    const folder = folderRepo?.moveToFolder(folderId, parentFolderId) ?? null
    emitFoldersChanged()
    return folder
  })
  ipcMain.handle('folders:move-before', (_event, folderId: number, beforeFolderId: number) => {
    folderRepo?.moveBefore(folderId, beforeFolderId)
    emitFoldersChanged()
  })
  ipcMain.handle('folders:move-after', (_event, folderId: number, afterFolderId: number) => {
    folderRepo?.moveAfter(folderId, afterFolderId)
    emitFoldersChanged()
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('before-quit', () => {
  db?.close()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

function emitChatsChanged(): void {
  mainWindow?.webContents.send('chats:changed', chatRepo?.listChats() ?? [])
}

function emitFoldersChanged(): void {
  mainWindow?.webContents.send('folders:changed', folderRepo?.listFolders() ?? [])
}
