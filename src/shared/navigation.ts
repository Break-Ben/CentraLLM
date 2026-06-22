export type Page = { type: 'home' } | { type: 'chat-list'; folderId: number | null } | { type: 'chat'; id: number | null } | { type: 'settings' }
