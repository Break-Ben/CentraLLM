import { create } from 'zustand'
import { DEFAULTS, type AppState } from '@shared/app-state'

type AppStateStore = AppState & {
  actions: {
    init: () => Promise<void>
    set: <K extends keyof AppState>(key: K, value: AppState[K]) => Promise<void>
  }
}

export const useAppStateStore = create<AppStateStore>((set) => ({
  ...DEFAULTS,
  actions: {
    init: async () => {
      const appState = await window.api.appState.getAll()
      set(appState)
    },
    set: async (key, value) => {
      set({ [key]: value } as Partial<AppStateStore>)
      await window.api.appState.set(key, value)
    }
  }
}))
