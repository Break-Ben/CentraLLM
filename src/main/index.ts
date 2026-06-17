import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import Database from 'better-sqlite3'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '@resources/icon.png?asset'
import { ChatController } from '@main/controllers/chat-controller'
import { ChatRepository } from '@main/repos/chat-repo'
import { AppStateRepository } from '@main/repos/app-state-repo'
import { PreferencesRepository } from '@main/repos/preferences-repo'
import { ChatProviderId } from '@shared/chat'
import { AppState } from '@shared/app-state'
import { Preferences } from '@shared/preferences'

let mainWindow: BrowserWindow | null = null
let chatController: ChatController | null = null

let db: Database.Database | null = null
let chatRepo: ChatRepository | null = null
let appStateRepo: AppStateRepository | null = null
let preferencesRepo: PreferencesRepository | null = null

function createWindow(): void {
  if (!chatRepo) {
    throw new Error('Chat repository is not initialised')
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

  chatController = new ChatController(mainWindow, chatRepo)

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
  chatRepo = new ChatRepository(db)
  appStateRepo = new AppStateRepository(db)
  preferencesRepo = new PreferencesRepository(db)

  ipcMain.handle('chats:list', () => chatRepo?.listChats() ?? [])
  ipcMain.handle('chats:active', () => chatController?.getActiveChatId() ?? null)
  ipcMain.handle('chats:open', async (_event, chatId: number) => {
    await chatController?.openChat(chatId)
  })
  ipcMain.handle('chats:new', async (_event, providerId: ChatProviderId) => {
    await chatController?.openNewChat(providerId)
  })

  ipcMain.handle('appState:getAll', () => appStateRepo?.getAll() ?? {})
  ipcMain.handle('appState:set', (_event, key: keyof AppState, value: AppState[typeof key]) => appStateRepo?.set(key, value))

  ipcMain.handle('preferences:getAll', () => preferencesRepo?.getAll() ?? {})
  ipcMain.handle('preferences:set', (_event, key: keyof Preferences, value: Preferences[typeof key]) => preferencesRepo?.set(key, value))

  ipcMain.on('view:set-bounds', (_event, bounds) => {
    chatController?.setBounds(bounds)
  })
  ipcMain.on('view:set-visible', (_event, visible: boolean) => {
    chatController?.setVisible(visible)
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
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
