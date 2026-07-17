interface SettingOptionProps {
  label: string
  description?: string
  children: React.ReactNode
}

export function SettingsOption({ label, description, children }: SettingOptionProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-8 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
