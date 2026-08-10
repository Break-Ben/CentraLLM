import os from 'os'
import { app, shell, BrowserWindow, ipcMain, nativeTheme, Input, Tray, Menu } from 'electron'
import { join } from 'path'
import Database from 'better-sqlite3'
import { electronApp, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '@resources/icon.png?asset'
import { ChatController } from '@main/controllers/chat-controller'
import { ChatRepository } from '@main/repos/chat-repo'
import { FolderRepository } from '@main/repos/folder-repo'
import { AppStateRepository } from '@main/repos/app-state-repo'
import { PreferencesRepository } from '@main/repos/preferences-repo'
import { CustomProviderRepository } from '@main/repos/custom-provider-repo'
import { ChatProvider, ChatProviderId } from '@shared/chat'
import { AppState } from '@shared/app-state'
import { Preferences } from '@shared/preferences'
import { eventToAccelerator, isModifierOnly, ShortcutAction } from '@shared/shortcuts'
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
let customProviderRepo: CustomProviderRepository | null = null

let tray: Tray | null = null
let isQuitting = false
let isRecordingShortcut = false

app.setName('CentraLLM')

if (is.dev) {
  app.setPath('userData', join(app.getPath('appData'), `${app.name}-dev`))
}

function createWindow(): void {
  if (!chatRepo || !folderRepo || !customProviderRepo) {
    throw new Error('Repositories are not initialised')
  }

  const getTitleBarOptions = () => ({
    color: nativeTheme.shouldUseDarkColors ? '#171717' : '#fafafa',
    symbolColor: nativeTheme.shouldUseDarkColors ? '#ffffff' : '#000000',
    height: 39
  })

  mainWindow = new BrowserWindow({
    title: 'CentraLLM',
    width: 1500,
    height: 1000,
    show: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: getTitleBarOptions(),
    backgroundColor: '#00000000',
    autoHideMenuBar: true,
    ...(process.platform === 'linux' || is.dev ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.setMinimumSize(200, 200)

  nativeTheme.on('updated', () => mainWindow?.setTitleBarOverlay(getTitleBarOptions()))

  navigationController = new NavigationController(mainWindow, folderRepo)
  chatController = new ChatController(mainWindow, chatRepo, navigationController, customProviderRepo)

  mainWindow.webContents.on('before-input-event', handleInputEvent)
  chatController.onBeforeViewInput(handleInputEvent)

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    if (!is.dev) {
      void autoUpdater.checkForUpdatesAndNotify()
    }
  })

  mainWindow.on('focus', () => {
    chatController?.focusView()
  })

  mainWindow.on('close', (event) => {
    if (!isQuitting && preferencesRepo?.getAll().closeBehaviour === 'minimise-to-tray') {
      event.preventDefault()
      mainWindow?.hide()
      getOrCreateTray()
    }
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

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  db = new Database(join(app.getPath('userData'), 'centrallm.db'))
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  folderRepo = new FolderRepository(db)
  chatRepo = new ChatRepository(db)
  appStateRepo = new AppStateRepository(db)
  preferencesRepo = new PreferencesRepository(db)
  customProviderRepo = new CustomProviderRepository(db)

  nativeTheme.themeSource = preferencesRepo.getAll().theme

  // App Info
  ipcMain.handle('app:get-info', () => {
    const osNames = { win32: 'Windows', darwin: 'macOS', linux: 'Linux' }
    const osName = osNames[process.platform] || os.type()

    return {
      version: `CentraLLM ${app.getVersion()}`,
      osVersion: `${osName} ${os.release()} (${os.arch()})`
    }
  })

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

  // Shortcuts
  ipcMain.on('shortcuts:set-recording', (_event, recording: boolean) => {
    isRecordingShortcut = recording
  })

  // App State
  ipcMain.handle('appState:get-all', () => appStateRepo?.getAll() ?? {})
  ipcMain.handle('appState:set', (_event, key: keyof AppState, value: AppState[typeof key]) => appStateRepo?.set(key, value))

  // Preferences
  ipcMain.handle('preferences:get-all', () => preferencesRepo?.getAll() ?? {})
  ipcMain.handle('preferences:set', (_event, key: keyof Preferences, value: Preferences[typeof key]) => {
    if (key === 'theme') {
      nativeTheme.themeSource = value as Preferences['theme']
    }
    if (key === 'closeBehaviour' && value !== 'minimise-to-tray') {
      tray?.destroy()
      tray = null
    }
    return preferencesRepo?.set(key, value)
  })

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
  ipcMain.handle('chats:toggle-pin', (_event, chatId: number) => {
    chatRepo?.togglePin(chatId)
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

  // Custom Providers
  ipcMain.handle('customProviders:list', () => customProviderRepo?.list() ?? [])
  ipcMain.handle('customProviders:create', (_event, data: Omit<ChatProvider, 'id'>) => customProviderRepo?.create(data) ?? null)
  ipcMain.handle('customProviders:update', (_event, id: string, data: Omit<ChatProvider, 'id'>) => customProviderRepo?.update(id, data) ?? null)
  ipcMain.handle('customProviders:remove', (_event, id: string) => {
    if (chatRepo && chatController) {
      const chats = chatRepo.listChats()
      for (const chat of chats) {
        if (chat.providerId === id) {
          chatController.closeChatIfActive(chat.id)
          chatRepo.removeChat(chat.id)
        }
      }
      emitChatsChanged()
    }
    customProviderRepo?.remove(id)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('before-quit', () => {
  isQuitting = true
  tray?.destroy()
  tray = null
  db?.close()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

function handleInputEvent(event: { preventDefault(): void }, input: Input): void {
  if (input.type !== 'keyDown') {
    return
  }

  if (!preferencesRepo) {
    throw new Error('Repositories are not initialised')
  }

  if (isRecordingShortcut) {
    if (!isModifierOnly(input)) {
      event.preventDefault()
      mainWindow?.webContents.send('shortcuts:key-event', input)
    }
    return
  }

  if (isModifierOnly(input)) {
    return
  }

  const accelerator = eventToAccelerator(input)
  const keybindings = preferencesRepo.getAll().keybindings
  const action = (Object.entries(keybindings) as [ShortcutAction, string][]).find(([, keybinding]) => keybinding === accelerator)?.[0]

  if (action) {
    event.preventDefault()
    handleShortcutAction(action)
  }
}

function handleShortcutAction(action: ShortcutAction): void {
  switch (action) {
    case 'newChat': {
      if (!appStateRepo) {
        throw new Error('Repositories are not initialised')
      }
      const providerId = appStateRepo.getAll().lastUsedProviderId
      void chatController?.openNewChat(providerId).then(() => {
        navigationController?.navigateTo({ type: 'chat', chatId: null, folderId: null })
      })
      break
    }
    case 'reloadChat': {
      chatController?.reloadView()
      break
    }
    case 'openSearch': {
      navigationController?.navigateTo({ type: 'search' })
      break
    }
    case 'openSettings': {
      navigationController?.navigateTo({ type: 'settings', category: 'general' })
      break
    }
    case 'openChatList': {
      navigationController?.navigateTo({ type: 'chat-list', folderId: null })
      break
    }
  }
}

function getOrCreateTray(): Tray {
  if (!tray) {
    tray = new Tray(icon)
    tray.setToolTip('CentraLLM')
    tray.setContextMenu(Menu.buildFromTemplate([{ label: 'Show', click: showWindow }, { type: 'separator' }, { label: 'Quit', click: () => app.quit() }]))
    tray.on('click', showWindow)
  }
  return tray
}

function showWindow(): void {
  if (!mainWindow) {
    return
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }
  mainWindow.show()
  mainWindow.focus()
}

function emitChatsChanged(): void {
  mainWindow?.webContents.send('chats:changed', chatRepo?.listChats() ?? [])
}

function emitFoldersChanged(): void {
  mainWindow?.webContents.send('folders:changed', folderRepo?.listFolders() ?? [])
}
