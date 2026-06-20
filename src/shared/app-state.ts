import { ChatProviderId } from '@shared/chat'

export interface AppState {
  lastUsedProviderId: ChatProviderId
  expandedFolderIds: number[]
}

export const DEFAULTS: AppState = {
  lastUsedProviderId: 'chatgpt',
  expandedFolderIds: []
}
