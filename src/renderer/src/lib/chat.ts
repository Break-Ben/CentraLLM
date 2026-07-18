import { useCustomProvidersStore } from '@/stores/custom-providers-store'
import { ChatProvider, ChatProviderId, ChatRecord, getBuiltInProvider } from '@shared/chat'

export function getChatDisplayName(chat: ChatRecord): string {
  if (chat.title) {
    return chat.title
  }
  try {
    return `${getChatProvider(chat.providerId).name} Chat`
  } catch {
    return `${chat.providerId} Chat`
  }
}

export function getChatProvider(providerId: ChatProviderId): ChatProvider {
  const builtIn = getBuiltInProvider(providerId)
  if (builtIn) {
    return builtIn
  }
  const custom = getCustomProviders().find((provider) => provider.id === providerId)
  if (custom) {
    return custom
  }
  throw new Error(`Unknown chat provider: ${providerId}`)
}

function getCustomProviders(): ChatProvider[] {
  return useCustomProvidersStore.getState().customProviders
}
