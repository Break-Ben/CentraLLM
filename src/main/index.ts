import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '@resources/icon.png?asset'
import { ChatController } from '@main/chat-controller'
import { ChatRepository } from '@main/chat-db'
import { ChatProviderId } from '@shared/chat'

let mainWindow: BrowserWindow | null = null
let chatRepository: ChatRepository | null = null
let chatController: ChatController | null = null

function createWindow(): void {
  if (!chatRepository) {
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

  chatController = new ChatController(mainWindow, chatRepository)

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

  chatRepository = new ChatRepository()

  ipcMain.handle('chats:list', () => chatRepository?.listChats() ?? [])
  ipcMain.handle('chats:active', () => chatController?.getActiveChatId() ?? null)
  ipcMain.handle('chats:open', async (_event, chatId: number) => {
    await chatController?.openChat(chatId)
  })
  ipcMain.handle('chats:new', async (_event, providerId: ChatProviderId) => {
    await chatController?.openNewChat(providerId)
  })

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
  chatRepository?.close()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
