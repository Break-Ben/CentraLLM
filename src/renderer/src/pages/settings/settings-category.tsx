import { Button } from '@/components/ui/button'
import { SettingOption } from '@/pages/settings/settings-option'
import { SettingsSection } from '@/pages/settings/settings-section'
import { ThemeSelector } from '@/pages/settings/theme-selector'
import { PreferenceCategory } from '@shared/preferences'

interface SettingsCategoryProps {
  category: PreferenceCategory
}

export function SettingsCategory({ category }: SettingsCategoryProps): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      {category === 'general' && <GeneralSettings />}
      {category === 'appearance' && <AppearanceSettings />}
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
