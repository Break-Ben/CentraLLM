export type ChatProviderId = 'chatgpt' | 'gemini' | 'claude'

export type ChatProvider = {
  id: ChatProviderId
  name: string
  newChatUrl: string
  chatUrlPrefix: string
  chatUrlTemplate: string
  titleSuffix: string
}

export type ChatRecord = {
  id: number
  providerId: ChatProviderId
  chatId: string
  title: string
  lastOpenedAt: number | null
}

export type ChatLocation = Pick<ChatRecord, 'providerId' | 'chatId'>

export const CHAT_PROVIDERS = new Map<ChatProviderId, ChatProvider>([
  [
    'chatgpt',
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      newChatUrl: 'https://chatgpt.com',
      chatUrlPrefix: 'https://chatgpt.com/c/',
      chatUrlTemplate: 'https://chatgpt.com/c/{{chatId}}',
      titleSuffix: ''
    }
  ],
  [
    'gemini',
    {
      id: 'gemini',
      name: 'Gemini',
      newChatUrl: 'https://gemini.google.com/app',
      chatUrlPrefix: 'https://gemini.google.com/app/',
      chatUrlTemplate: 'https://gemini.google.com/app/{{chatId}}',
      titleSuffix: ' - Google Gemini'
    }
  ],
  [
    'claude',
    {
      id: 'claude',
      name: 'Claude',
      newChatUrl: 'https://claude.ai/new',
      chatUrlPrefix: 'https://claude.ai/chat/',
      chatUrlTemplate: 'https://claude.ai/chat/{{chatId}}',
      titleSuffix: ' - Claude'
    }
  ]
])
export const CHAT_PROVIDER_LIST = [...CHAT_PROVIDERS.values()]

export function getChatProvider(providerId: ChatProviderId): ChatProvider {
  const provider = CHAT_PROVIDERS.get(providerId)
  if (!provider) {
    throw new Error(`Unknown chat provider: ${providerId}`)
  }

  return provider
}

export function extractChatLocation(rawUrl: string): ChatLocation | null {
  try {
    const url = new URL(rawUrl)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null
    }

    const href = url.href
    for (const provider of CHAT_PROVIDER_LIST) {
      if (!href.startsWith(provider.chatUrlPrefix)) {
        continue
      }

      const chatId = href.slice(provider.chatUrlPrefix.length).split('/')[0]?.split('?')[0]?.trim()
      if (!chatId) {
        continue
      }

      return {
        providerId: provider.id,
        chatId
      }
    }

    return null
  } catch {
    return null
  }
}

export function getChatUrl(chatLocation: ChatLocation): string {
  const provider = getChatProvider(chatLocation.providerId)
  return provider.chatUrlTemplate.replace('{{chatId}}', chatLocation.chatId)
}

export function getNewChatUrl(providerId: ChatProviderId): string {
  return getChatProvider(providerId).newChatUrl
}

export function cleanChatTitle(title: string, providerId: ChatProviderId): string {
  const provider = getChatProvider(providerId)
  const cleanedTitle = title.trim()

  if (provider.titleSuffix && cleanedTitle.endsWith(provider.titleSuffix)) {
    return cleanedTitle.slice(0, -provider.titleSuffix.length).trim()
  }

  return cleanedTitle
}

export function getChatDisplayName(chat: ChatRecord): string {
  if (chat.title) {
    return chat.title
  }

  const provider = CHAT_PROVIDERS.get(chat.providerId)
  const providerName = provider?.name ?? chat.providerId
  return `${providerName} Chat`
}
