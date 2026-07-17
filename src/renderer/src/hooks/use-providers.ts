import { usePreferencesStore } from '@/stores/preferences-store'
import { CHAT_PROVIDERS, ChatProvider } from '@shared/chat'

function sortedByName(providers: ChatProvider[]): ChatProvider[] {
  return [...providers].sort((a, b) => a.name.localeCompare(b.name))
}

export function useShownProviders(): ChatProvider[] {
  const shownProviderIds = usePreferencesStore((state) => state.shownProviderIds)
  return sortedByName(CHAT_PROVIDERS.filter((provider) => shownProviderIds.includes(provider.id)))
}

export function useHiddenProviders(): ChatProvider[] {
  const shownProviderIds = usePreferencesStore((state) => state.shownProviderIds)
  return sortedByName(CHAT_PROVIDERS.filter((provider) => !shownProviderIds.includes(provider.id)))
}
