const DATE_TIME_FORMAT = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export type PreferenceCategory = 'general' | 'appearance'

export const CATEGORY_LABELS: Record<PreferenceCategory, string> = {
  general: 'General',
  appearance: 'Appearance'
}

export interface Preferences {
  theme: 'system' | 'light' | 'dark'
}

export const DEFAULTS: Preferences = {
  theme: 'system'
}

export function formatDate(date: Date | number): string {
  return DATE_TIME_FORMAT.format(typeof date === 'number' ? new Date(date) : date)
}
