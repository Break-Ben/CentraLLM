import { ThemeSelector } from '@/pages/settings/theme-selector'

export function SettingsPage(): React.JSX.Element {
  return (
    <div className="p-4">
      <h1>Settings</h1>
      <ThemeSelector />
    </div>
  )
}
