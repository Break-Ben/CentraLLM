import { ChatProviderId } from '@shared/chat'

export type SortingOrder = 'alphabetical' | 'last_opened' | 'custom'

export const SORTING_OPTIONS: { value: SortingOrder; label: string }[] = [
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'last_opened', label: 'Last Opened' },
  { value: 'custom', label: 'Custom' }
] as const

export interface AppState {
  lastUsedProviderId: ChatProviderId
  sortingOrder: SortingOrder
  expandedFolderIds: number[]
}

export const DEFAULTS: AppState = {
  lastUsedProviderId: 'chatgpt',
  sortingOrder: 'alphabetical',
  expandedFolderIds: []
}
