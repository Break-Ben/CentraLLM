import { useState } from 'react'
import { Minus, Plus, Pencil, FileX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingsSection } from '@/pages/settings/settings-section'
import { usePreferencesStore } from '@/stores/preferences-store'
import { useCustomProvidersStore } from '@/stores/custom-providers-store'
import { useAppStateStore } from '@/stores/app-state-store'
import { ChatProvider, ChatProviderId } from '@shared/chat'
import { ChatProviderLogo } from '@/components/chat-provider-logo'
import { useShownProviders, useHiddenProviders } from '@/hooks/use-providers'
import { CustomProviderDialog } from '@/pages/settings/views/providers/custom-provider-dialog'

export function ProvidersView(): React.JSX.Element {
  const shownProviderIds = usePreferencesStore((state) => state.shownProviderIds)
  const { set: setPreference } = usePreferencesStore((state) => state.actions)

  const lastUsedProviderId = useAppStateStore((state) => state.lastUsedProviderId)
  const { set: setAppState } = useAppStateStore((state) => state.actions)

  const customProviders = useCustomProvidersStore((state) => state.customProviders)
  const shownProviders = useShownProviders()
  const hiddenProviders = useHiddenProviders()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<ChatProvider | null>(null)

  const isCustom = (id: ChatProviderId): boolean => customProviders.some((provider) => provider.id === id)

  const showProvider = (providerId: ChatProviderId): void => {
    void setPreference('shownProviderIds', [...shownProviderIds, providerId])
  }

  const hideProvider = (providerId: ChatProviderId): void => {
    void setPreference(
      'shownProviderIds',
      shownProviderIds.filter((id) => id !== providerId)
    )

    if (lastUsedProviderId === providerId) {
      const remainingShown = shownProviders.filter((provider) => provider.id !== providerId)
      const fallbackId = remainingShown[0]?.id
      if (fallbackId) {
        void setAppState('lastUsedProviderId', fallbackId)
      }
    }
  }

  const openDialog = (provider: ChatProvider | null): void => {
    setEditingProvider(provider)
    setDialogOpen(true)
  }

  const closeDialog = (): void => {
    setDialogOpen(false)
    setEditingProvider(null)
  }

  return (
    <>
      <SettingsSection title="Shown Providers">
        {shownProviders.map((provider) => (
          <ProviderRow
            key={provider.id}
            provider={provider}
            isCustom={isCustom(provider.id)}
            onEdit={() => openDialog(provider)}
            action={
              <Button variant="ghost" size="icon" className="size-7" disabled={shownProviders.length === 1} onClick={() => hideProvider(provider.id)}>
                <Minus className="size-4" />
              </Button>
            }
          />
        ))}
      </SettingsSection>

      {hiddenProviders.length > 0 && (
        <SettingsSection title="Hidden Providers">
          {hiddenProviders.map((provider) => (
            <ProviderRow
              key={provider.id}
              provider={provider}
              isCustom={isCustom(provider.id)}
              onEdit={() => openDialog(provider)}
              action={
                <Button variant="ghost" size="icon" className="size-7" onClick={() => showProvider(provider.id)}>
                  <Plus className="size-4" />
                </Button>
              }
            />
          ))}
        </SettingsSection>
      )}

      <Button variant="outline" onClick={() => openDialog(null)}>
        <Plus className="size-4" />
        Add Custom Provider
      </Button>

      <CustomProviderDialog open={dialogOpen} provider={editingProvider} onClose={closeDialog} />
    </>
  )
}

interface ProviderRowProps {
  provider: ChatProvider
  isCustom: boolean
  onEdit: () => void
  action: React.ReactNode
}

function ProviderRow({ provider, isCustom, onEdit, action }: ProviderRowProps): React.JSX.Element {
  const titlesDisabled = provider.titleSuffix === undefined

  return (
    <div className="flex items-center justify-between text-sm px-4 py-2">
      <div className="flex items-center gap-2">
        <ChatProviderLogo providerId={provider.id} />
        <span>{provider.name}</span>
        {titlesDisabled && (
          <span className="inline-flex cursor-help" title="Chat names for this provider are not saved in CentraLLM">
            <FileX className="size-3.5 text-muted-foreground" />
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {isCustom && (
          <Button variant="ghost" size="icon" className="size-7" onClick={onEdit}>
            <Pencil className="size-4" />
          </Button>
        )}
        {action}
      </div>
    </div>
  )
}
