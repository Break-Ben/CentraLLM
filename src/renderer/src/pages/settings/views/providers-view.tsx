import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingsSection } from '@/pages/settings/settings-section'
import { usePreferencesStore } from '@/stores/preferences-store'
import { ChatProviderId } from '@shared/chat'
import { ChatProviderLogo } from '@/components/chat-provider-icon'
import { useShownProviders, useHiddenProviders } from '@/hooks/use-providers'

export function ProvidersView(): React.JSX.Element {
  const shownProviderIds = usePreferencesStore((state) => state.shownProviderIds)
  const { set } = usePreferencesStore((state) => state.actions)
  const shownProviders = useShownProviders()
  const hiddenProviders = useHiddenProviders()

  const showProvider = (providerId: ChatProviderId): void => {
    void set('shownProviderIds', [...shownProviderIds, providerId])
  }

  const hideProvider = (providerId: ChatProviderId): void => {
    void set(
      'shownProviderIds',
      shownProviderIds.filter((id) => id !== providerId)
    )
  }

  return (
    <>
      <SettingsSection title="Shown Providers">
        {shownProviders.map((provider) => (
          <div key={provider.id} className="flex items-center justify-between text-sm px-4 py-2">
            <div className="flex items-center gap-2">
              <ChatProviderLogo providerId={provider.id} />
              <span>{provider.name}</span>
            </div>
            <Button variant="ghost" size="icon" className="size-7" disabled={shownProviders.length === 1} onClick={() => hideProvider(provider.id)}>
              <Minus className="size-4" />
            </Button>
          </div>
        ))}
      </SettingsSection>

      {hiddenProviders.length > 0 && (
        <SettingsSection title="Hidden Providers">
          {hiddenProviders.map((provider) => (
            <div key={provider.id} className="flex items-center justify-between text-sm px-4 py-2">
              <div className="flex items-center gap-2">
                <ChatProviderLogo providerId={provider.id} />
                <span>{provider.name}</span>
              </div>
              <Button variant="ghost" size="icon" className="size-7" onClick={() => showProvider(provider.id)}>
                <Plus className="size-4" />
              </Button>
            </div>
          ))}
        </SettingsSection>
      )}
    </>
  )
}
