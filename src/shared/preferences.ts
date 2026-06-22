const DATE_TIME_FORMAT = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export interface Preferences {
  theme: 'system' | 'light' | 'dark'
}

export const DEFAULTS: Preferences = {
  theme: 'system'
}

export function formatDate(date: Date | number): string {
  return DATE_TIME_FORMAT.format(typeof date === 'number' ? new Date(date) : date)
}
