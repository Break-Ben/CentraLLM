import { useCustomProvidersStore } from '@/stores/custom-providers-store'
import { usePreferencesStore } from '@/stores/preferences-store'
import { CHAT_PROVIDERS, ChatProvider } from '@shared/chat'

export function useShownProviders(): ChatProvider[] {
  const shownProviderIds = usePreferencesStore((state) => state.shownProviderIds)
  const allProviders = useAllProviders()
  return sortedByName(allProviders.filter((provider) => shownProviderIds.includes(provider.id)))
}

export function useHiddenProviders(): ChatProvider[] {
  const shownProviderIds = usePreferencesStore((state) => state.shownProviderIds)
  const allProviders = useAllProviders()
  return sortedByName(allProviders.filter((provider) => !shownProviderIds.includes(provider.id)))
}

function useAllProviders(): ChatProvider[] {
  const customProviders = useCustomProvidersStore((state) => state.customProviders)
  return [...CHAT_PROVIDERS, ...customProviders]
}

function sortedByName(providers: ChatProvider[]): ChatProvider[] {
  return [...providers].sort((a, b) => a.name.localeCompare(b.name))
}
