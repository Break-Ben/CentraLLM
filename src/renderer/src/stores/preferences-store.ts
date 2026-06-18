import { create } from 'zustand'
import { DEFAULTS, Preferences } from '@shared/preferences'

type PreferencesStore = Preferences & {
  actions: {
    init: () => Promise<void>
    set: <K extends keyof Preferences>(key: K, value: Preferences[K]) => Promise<void>
  }
}

export const usePreferencesStore = create<PreferencesStore>((set) => ({
  ...DEFAULTS,
  actions: {
    init: async () => {
      const preferences = await window.api.preferences.getAll()
      set(preferences)
    },
    set: async (key, value) => {
      set({ [key]: value } as Partial<PreferencesStore>)
      await window.api.preferences.set(key, value)
    }
  }
}))
