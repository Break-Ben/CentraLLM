export type BuiltInChatProviderId = 'chatgpt' | 'claude' | 'deepseek' | 'gemini' | 'grok' | 'kimi' | 'mistral' | 'perplexity'
export type ChatProviderId = BuiltInChatProviderId | string

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
  lastOpenedAt: number
  folderId: number | null
  customOrder: number
  pinned: boolean
}

export type ChatLocation = Pick<ChatRecord, 'providerId' | 'chatId'>

export const CHAT_PROVIDERS = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    newChatUrl: 'https://chatgpt.com',
    chatUrlPrefix: 'https://chatgpt.com/c/',
    chatUrlTemplate: 'https://chatgpt.com/c/{{chatId}}',
    titleSuffix: ''
  },
  {
    id: 'claude',
    name: 'Claude',
    newChatUrl: 'https://claude.ai/new',
    chatUrlPrefix: 'https://claude.ai/chat/',
    chatUrlTemplate: 'https://claude.ai/chat/{{chatId}}',
    titleSuffix: ' - Claude'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    newChatUrl: 'https://chat.deepseek.com',
    chatUrlPrefix: 'https://chat.deepseek.com/a/chat/s/',
    chatUrlTemplate: 'https://chat.deepseek.com/a/chat/s/{{chatId}}',
    titleSuffix: ' - DeepSeek'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    newChatUrl: 'https://gemini.google.com/app',
    chatUrlPrefix: 'https://gemini.google.com/app/',
    chatUrlTemplate: 'https://gemini.google.com/app/{{chatId}}',
    titleSuffix: ' - Google Gemini'
  },
  {
    id: 'grok',
    name: 'Grok',
    newChatUrl: 'https://grok.com',
    chatUrlPrefix: 'https://grok.com/c/',
    chatUrlTemplate: 'https://grok.com/c/{{chatId}}',
    titleSuffix: ' - Grok'
  },
  {
    id: 'kimi',
    name: 'Kimi',
    newChatUrl: 'https://www.kimi.com',
    chatUrlPrefix: 'https://www.kimi.com/chat/',
    chatUrlTemplate: 'https://www.kimi.com/chat/{{chatId}}',
    titleSuffix: ' - Kimi'
  },
  {
    id: 'mistral',
    name: 'Mistral Vibe',
    newChatUrl: 'https://chat.mistral.ai/chat',
    chatUrlPrefix: 'https://chat.mistral.ai/chat/',
    chatUrlTemplate: 'https://chat.mistral.ai/chat/{{chatId}}',
    titleSuffix: ''
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    newChatUrl: 'https://www.perplexity.ai',
    chatUrlPrefix: 'https://www.perplexity.ai/search/',
    chatUrlTemplate: 'https://www.perplexity.ai/search/{{chatId}}',
    titleSuffix: ''
  }
] as const

const CHAT_PROVIDERS_MAP = new Map<string, ChatProvider>(CHAT_PROVIDERS.map((provider) => [provider.id, provider as ChatProvider]))

export function getBuiltInProvider(id: ChatProviderId): ChatProvider | undefined {
  return CHAT_PROVIDERS_MAP.get(id)
}
