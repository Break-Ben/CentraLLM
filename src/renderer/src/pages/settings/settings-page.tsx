import { SettingOption } from '@/pages/settings/settings-option'
import { SettingsSection } from '@/pages/settings/settings-section'
import { ThemeSelector } from '@/pages/settings/theme-selector'

export function SettingsPage(): React.JSX.Element {
  return (
    <div className="mx-auto h-full w-full max-w-2xl overflow-y-auto scrollbar-none space-y-8 p-8">
      <SettingsSection title="Appearance">
        <SettingOption label="Theme" description="Choose your preferred colour scheme">
          <ThemeSelector />
        </SettingOption>
      </SettingsSection>
    </div>
  )
}
