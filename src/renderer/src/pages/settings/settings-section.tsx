import { Card } from '@/components/ui/card'

interface SettingsSectionProps {
  title: string
  children: React.ReactNode
}

export function SettingsSection({ title, children }: SettingsSectionProps): React.JSX.Element {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-sm font-medium text-muted-foreground">{title}</h2>
      <Card className="divide-y p-0 gap-0">{children}</Card>
    </section>
  )
}
