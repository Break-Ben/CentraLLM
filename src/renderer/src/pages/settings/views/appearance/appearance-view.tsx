import { SettingsOption } from '@/pages/settings/settings-option'
import { SettingsSection } from '@/pages/settings/settings-section'
import { ThemeSelector } from '@/pages/settings/views/appearance/theme-selector'

export function AppearanceView(): React.JSX.Element {
  return (
    <SettingsSection title="Appearance">
      <SettingsOption label="Theme" description="Choose your preferred colour scheme">
        <ThemeSelector />
      </SettingsOption>
    </SettingsSection>
  )
}
