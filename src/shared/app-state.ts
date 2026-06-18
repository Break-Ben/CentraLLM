import { ChatProviderId } from '@shared/chat'

export interface AppState {
  lastUsedProviderId: ChatProviderId
}

export const DEFAULTS: AppState = {
  lastUsedProviderId: 'chatgpt'
}
