import { ChatProviderId } from '@shared/chat'

const DATE_TIME_FORMAT = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export type PreferenceCategory = 'general' | 'appearance' | 'providers'

export const CATEGORY_LABELS: Record<PreferenceCategory, string> = {
  general: 'General',
  appearance: 'Appearance',
  providers: 'Providers'
}

export interface Preferences {
  theme: 'system' | 'light' | 'dark'
  shownProviderIds: ChatProviderId[]
}

export const DEFAULTS: Preferences = {
  theme: 'system',
  shownProviderIds: ['chatgpt', 'claude', 'gemini']
}

export function formatDate(date: Date | number): string {
  return DATE_TIME_FORMAT.format(typeof date === 'number' ? new Date(date) : date)
}
