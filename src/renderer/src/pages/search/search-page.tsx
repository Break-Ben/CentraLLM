import { useMemo, useState } from 'react'
import { Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useChatStore } from '@/stores/chat-store'
import { useFolderStore } from '@/stores/folder-store'
import { useNavigationStore } from '@/stores/navigation-store'
import { getChatDisplayName, getChatProvider } from '@/lib/chat'
import { ChatRecord } from '@shared/chat'
import { FolderRecord } from '@shared/folder'
import { ChatProviderLogo } from '@/components/chat-provider-logo'

type SearchResult = { type: 'chat'; item: ChatRecord; score: number; label: string } | { type: 'folder'; item: FolderRecord; score: number; label: string }

export function SearchPage(): React.JSX.Element {
  const chats = useChatStore((state) => state.chats)
  const folders = useFolderStore((state) => state.folders)
  const { openChat } = useChatStore((state) => state.actions)
  const { setPage } = useNavigationStore((state) => state.actions)

  const [query, setQuery] = useState('')

  const results = useMemo<SearchResult[]>(() => {
    return [...chats.map((chat) => ({ type: 'chat' as const, item: chat, label: getChatDisplayName(chat) })), ...folders.map((folder) => ({ type: 'folder' as const, item: folder, label: folder.name }))]
      .map((result) => ({ ...result, score: query ? matchScore(result.label, query) : 1 }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
  }, [chats, folders, query])

  const handleChatClick = (chat: ChatRecord): void => {
    void openChat(chat.id)
    setPage({ type: 'chat', chatId: chat.id, folderId: chat.folderId })
  }

  const handleFolderClick = (folder: FolderRecord): void => {
    setPage({ type: 'chat-list', folderId: folder.id })
  }

  return (
    <div className="flex size-full justify-center overflow-y-auto p-4 scrollbar-none">
      <div className="flex size-full max-w-2xl flex-col gap-3">
        <Input autoFocus placeholder="Search chats and folders…" value={query} onChange={(event) => setQuery(event.target.value)} />

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-none">
          {results.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{query ? 'No results found' : 'No chats or folders yet'}</p>
          ) : (
            results.map((result) =>
              result.type === 'chat' ? (
                <Button key={`chat-${result.item.id}`} variant="ghost" className="w-full justify-start" onClick={() => handleChatClick(result.item)}>
                  <ChatProviderLogo providerId={result.item.providerId} />
                  <span className="flex-1 truncate text-left">{result.label}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{getChatProvider(result.item.providerId).name}</span>
                </Button>
              ) : (
                <Button key={`folder-${result.item.id}`} variant="ghost" className="w-full justify-start" onClick={() => handleFolderClick(result.item)}>
                  <Folder className="size-4 shrink-0" />
                  <span className="flex-1 truncate text-left">{result.label}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">Folder</span>
                </Button>
              )
            )
          )}
        </div>
      </div>
    </div>
  )
}

function matchScore(name: string, query: string): number {
  const lowerName = name.toLowerCase()
  const lowerQuery = query.toLowerCase()
  if (lowerName === lowerQuery) {
    return 3
  }
  if (lowerName.startsWith(lowerQuery)) {
    return 2
  }
  if (lowerName.includes(lowerQuery)) {
    return 1
  }
  return 0
}
