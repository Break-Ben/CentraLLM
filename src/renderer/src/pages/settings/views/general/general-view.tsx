import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SettingsOption } from '@/pages/settings/settings-option'
import { SettingsSection } from '@/pages/settings/settings-section'
import { usePreferencesStore } from '@/stores/preferences-store'
import { CloseBehaviour } from '@shared/preferences'

const CLOSE_OPTIONS: { value: CloseBehaviour; label: string }[] = [
  { value: 'close', label: 'Close' },
  { value: 'minimise-to-tray', label: 'Minimise to tray' }
]

export function GeneralView(): React.JSX.Element {
  const closeBehaviour = usePreferencesStore((state) => state.closeBehaviour)
  const { set } = usePreferencesStore((state) => state.actions)

  return (
    <SettingsSection title="General">
      <SettingsOption label="Close behaviour">
        <Select items={CLOSE_OPTIONS} value={closeBehaviour} onValueChange={(value) => set('closeBehaviour', value as CloseBehaviour)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLOSE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingsOption>
    </SettingsSection>
  )
}
