import { Input } from 'electron'

export type ShortcutAction = 'newChat' | 'reloadChat' | 'openSettings' | 'openSearch' | 'openChatList'
export type Keybindings = Record<ShortcutAction, string>

export const SHORTCUT_LABELS: Record<ShortcutAction, string> = {
  newChat: 'New Chat',
  reloadChat: 'Reload Chat',
  openSettings: 'Open Settings',
  openSearch: 'Open Search',
  openChatList: 'Open Chats'
}
export const SHORTCUT_DESCRIPTIONS: Partial<Record<ShortcutAction, string>> = {
  newChat: 'Opens a new chat with the default provider',
  openChatList: 'Opens the full-screen chat list page'
}

export type KeyEvent = Pick<Input, 'key' | 'control' | 'shift' | 'alt' | 'meta'>

export function eventToAccelerator(event: KeyEvent): string {
  const parts: string[] = []
  if (event.control) {
    parts.push('Ctrl')
  }
  if (event.shift) {
    parts.push('Shift')
  }
  if (event.alt) {
    parts.push('Alt')
  }
  if (event.meta) {
    parts.push('Meta')
  }
  parts.push(event.key.length === 1 ? event.key.toUpperCase() : event.key)
  return parts.join('+')
}

export function hasModifier(event: KeyEvent): boolean {
  return event.control || event.shift || event.alt || event.meta
}

export function isModifierOnly(event: KeyEvent): boolean {
  return ['control', 'shift', 'alt', 'meta'].includes(event.key.toLowerCase())
}
