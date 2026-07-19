import { PreferenceCategory } from '@shared/preferences'

export type Page = { type: 'home' } | { type: 'chat-list'; folderId: number | null } | { type: 'chat'; chatId: number | null; folderId: number | null } | { type: 'search' } | { type: 'settings'; category: PreferenceCategory }
