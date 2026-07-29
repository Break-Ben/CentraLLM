import { ChatProviderId } from '@shared/chat'
import { Keybindings } from '@shared/shortcuts'

const DATE_TIME_FORMAT = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export type PreferenceCategory = 'general' | 'appearance' | 'providers' | 'shortcuts' | 'about'

export const CATEGORY_LABELS: Record<PreferenceCategory, string> = {
  general: 'General',
  appearance: 'Appearance',
  providers: 'Providers',
  shortcuts: 'Shortcuts',
  about: 'About'
}

export interface Preferences {
  theme: 'system' | 'light' | 'dark'
  shownProviderIds: ChatProviderId[]
  keybindings: Keybindings
}

export const DEFAULTS: Preferences = {
  theme: 'system',
  shownProviderIds: ['chatgpt', 'claude', 'gemini'],
  keybindings: {
    newChat: 'Ctrl+T',
    reloadChat: 'Ctrl+R',
    openSettings: 'Ctrl+,',
    openChatList: 'Ctrl+E',
    openSearch: 'Ctrl+K'
  }
}

export function formatDate(date: Date | number): string {
  return DATE_TIME_FORMAT.format(typeof date === 'number' ? new Date(date) : date)
}
