import { Bot, LucideIcon, Palette, Settings2, Keyboard, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CATEGORY_LABELS, PreferenceCategory } from '@shared/preferences'

const NAV_ICONS: Record<PreferenceCategory, LucideIcon> = {
  general: Settings2,
  appearance: Palette,
  providers: Bot,
  shortcuts: Keyboard,
  about: Info
}

interface SettingsCategoryButtonProps {
  category: PreferenceCategory
  isActive: boolean
  onClick: () => void
}

export function SettingsCategoryButton({ category, isActive, onClick }: SettingsCategoryButtonProps): React.JSX.Element {
  const Icon = NAV_ICONS[category]

  return (
    <Button variant={isActive ? 'secondary' : 'ghost'} className="w-full justify-start gap-2 px-3" onClick={onClick}>
      <Icon className="size-4" />
      <span>{CATEGORY_LABELS[category]}</span>
    </Button>
  )
}
