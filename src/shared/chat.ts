export type BuiltInChatProviderId = 'chatgpt' | 'claude' | 'copilot' | 'deepseek' | 'gemini' | 'grok' | 'kimi' | 'longcat' | 'meta' | 'minimax' | 'mistral' | 'notebooklm' | 'perplexity' | 'qwen' | 'zai'

export type ChatProviderId = BuiltInChatProviderId | string

export type ChatProvider = {
  id: ChatProviderId
  name: string
  newChatUrl: string
  chatUrlPrefix: string
  titleSuffix?: string
  chatIdExclusionRegex?: string
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

export const IGNORED_CHAT_IDS = new Set<string>(['new', 'new-chat', 'create', 'creating'])

export const CHAT_PROVIDERS = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    newChatUrl: 'https://chatgpt.com',
    chatUrlPrefix: 'https://chatgpt.com/c/',
    titleSuffix: '',
    chatIdExclusionRegex: '^WEB:'
  },
  {
    id: 'claude',
    name: 'Claude',
    newChatUrl: 'https://claude.ai/new',
    chatUrlPrefix: 'https://claude.ai/chat/',
    titleSuffix: ' - Claude'
  },
  {
    id: 'copilot',
    name: 'Copilot',
    newChatUrl: 'https://copilot.microsoft.com',
    chatUrlPrefix: 'https://copilot.microsoft.com/chats/'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    newChatUrl: 'https://chat.deepseek.com',
    chatUrlPrefix: 'https://chat.deepseek.com/a/chat/s/',
    titleSuffix: ' - DeepSeek'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    newChatUrl: 'https://gemini.google.com/app',
    chatUrlPrefix: 'https://gemini.google.com/app/',
    titleSuffix: ' - Google Gemini'
  },
  {
    id: 'grok',
    name: 'Grok',
    newChatUrl: 'https://grok.com',
    chatUrlPrefix: 'https://grok.com/c/',
    titleSuffix: ' - Grok'
  },
  {
    id: 'kimi',
    name: 'Kimi',
    newChatUrl: 'https://www.kimi.com',
    chatUrlPrefix: 'https://www.kimi.com/chat/',
    titleSuffix: ' - Kimi'
  },
  {
    id: 'longcat',
    name: 'Longcat',
    newChatUrl: 'https://longcat.chat',
    chatUrlPrefix: 'https://longcat.chat/c/'
  },
  {
    id: 'meta',
    name: 'Meta',
    newChatUrl: 'https://meta.ai',
    chatUrlPrefix: 'https://meta.ai/prompt/'
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    newChatUrl: 'https://agent.minimax.io',
    chatUrlPrefix: 'https://agent.minimax.io/mavis?id='
  },
  {
    id: 'mistral',
    name: 'Mistral Vibe',
    newChatUrl: 'https://chat.mistral.ai/chat',
    chatUrlPrefix: 'https://chat.mistral.ai/chat/',
    titleSuffix: ''
  },
  {
    id: 'notebooklm',
    name: 'Notebook',
    newChatUrl: 'https://notebook.google.com',
    chatUrlPrefix: 'https://notebook.google.com/notebook/',
    titleSuffix: ''
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    newChatUrl: 'https://www.perplexity.ai',
    chatUrlPrefix: 'https://www.perplexity.ai/search/',
    titleSuffix: ''
  },
  {
    id: 'qwen',
    name: 'Qwen',
    newChatUrl: 'https://chat.qwen.ai',
    chatUrlPrefix: 'https://chat.qwen.ai/c/'
  },
  {
    id: 'zai',
    name: 'Z.ai',
    newChatUrl: 'https://chat.z.ai',
    chatUrlPrefix: 'https://chat.z.ai/c/'
  }
] as const

const CHAT_PROVIDERS_MAP = new Map<string, ChatProvider>(CHAT_PROVIDERS.map((provider) => [provider.id, provider as ChatProvider]))

export function getBuiltInProvider(id: ChatProviderId): ChatProvider | undefined {
  return CHAT_PROVIDERS_MAP.get(id)
}
