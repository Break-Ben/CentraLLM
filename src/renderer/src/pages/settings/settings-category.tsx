import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingOption } from '@/pages/settings/settings-option'
import { SettingsSection } from '@/pages/settings/settings-section'
import { ThemeSelector } from '@/pages/settings/theme-selector'
import { PreferenceCategory } from '@shared/preferences'
import { usePreferencesStore } from '@/stores/preferences-store'
import { ChatProviderId } from '@shared/chat'
import { ChatProviderLogo } from '@/components/chat-provider-icon'
import { useShownProviders, useHiddenProviders } from '@/hooks/use-providers'

interface SettingsCategoryProps {
  category: PreferenceCategory
}

export function SettingsCategory({ category }: SettingsCategoryProps): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      {category === 'general' && <GeneralSettings />}
      {category === 'appearance' && <AppearanceSettings />}
      {category === 'providers' && <ProvidersSettings />}
    </div>
  )
}

function GeneralSettings(): React.JSX.Element {
  return (
    <SettingsSection title="General">
      <SettingOption label="Dummy option" description="Placeholder for future general preferences">
        <Button variant="outline" disabled>
          Coming soon
        </Button>
      </SettingOption>
    </SettingsSection>
  )
}

function AppearanceSettings(): React.JSX.Element {
  return (
    <SettingsSection title="Appearance">
      <SettingOption label="Theme" description="Choose your preferred colour scheme">
        <ThemeSelector />
      </SettingOption>
    </SettingsSection>
  )
}

function ProvidersSettings(): React.JSX.Element {
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
