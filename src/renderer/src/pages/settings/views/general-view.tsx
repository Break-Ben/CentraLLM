import { Button } from '@/components/ui/button'
import { SettingsOption } from '@/pages/settings/settings-option'
import { SettingsSection } from '@/pages/settings/settings-section'

export function GeneralView(): React.JSX.Element {
  return (
    <SettingsSection title="General">
      <SettingsOption label="Dummy option" description="Placeholder for future general preferences">
        <Button variant="outline" disabled>
          Coming soon
        </Button>
      </SettingsOption>
    </SettingsSection>
  )
}
