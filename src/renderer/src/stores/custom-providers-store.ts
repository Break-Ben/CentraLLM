import { create } from 'zustand'
import { CHAT_PROVIDERS, ChatProvider } from '@shared/chat'
import { usePreferencesStore } from '@/stores/preferences-store'
import { useAppStateStore } from '@/stores/app-state-store'

type CustomProvidersStore = {
  customProviders: ChatProvider[]
  actions: {
    init: () => Promise<void>
    create: (data: Omit<ChatProvider, 'id'>) => Promise<ChatProvider | null>
    update: (id: string, data: Omit<ChatProvider, 'id'>) => Promise<void>
    remove: (id: string) => Promise<void>
  }
}

export const useCustomProvidersStore = create<CustomProvidersStore>((set, get) => ({
  customProviders: [],
  actions: {
    init: async () => {
      const customProviders = await window.api.customProviders.list()
      set({ customProviders })
    },
    create: async (data) => {
      const provider = await window.api.customProviders.create(data)
      if (provider) {
        set((state) => ({ customProviders: [...state.customProviders, provider] }))
      }
      return provider
    },
    update: async (id, data) => {
      const provider = await window.api.customProviders.update(id, data)
      if (provider) {
        set((state) => ({ customProviders: state.customProviders.map((existingProvider) => (existingProvider.id === id ? provider : existingProvider)) }))
      }
    },
    remove: async (id) => {
      await window.api.customProviders.remove(id)

      const nextCustomProviders = get().customProviders.filter((provider) => provider.id !== id)
      const appStateStore = useAppStateStore.getState()

      if (appStateStore.lastUsedProviderId === id) {
        const preferencesStore = usePreferencesStore.getState()
        const allProviders = [...CHAT_PROVIDERS, ...nextCustomProviders]
        const shownProviders = allProviders.filter((provider) => preferencesStore.shownProviderIds.includes(provider.id)).sort((a, b) => a.name.localeCompare(b.name))
        const fallbackId = shownProviders[0]?.id || CHAT_PROVIDERS[0]?.id
        if (fallbackId) {
          appStateStore.actions.set('lastUsedProviderId', fallbackId)
        }
      }

      set({ customProviders: nextCustomProviders })
    }
  }
}))
