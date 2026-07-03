import { Moon, Sun, Monitor, Check } from 'lucide-react'
import { usePreferencesStore } from '@/stores/preferences-store'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const themeConfig = {
  system: { label: 'System', icon: Monitor },
  dark: { label: 'Dark', icon: Moon },
  light: { label: 'Light', icon: Sun }
} as const

export function ThemeSelector() {
  const theme = usePreferencesStore((state) => state.theme)
  const { set } = usePreferencesStore((state) => state.actions)

  const CurrentIcon = themeConfig[theme].icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="outline" className="flex items-center gap-2">
          <CurrentIcon className="h-4 w-4" />
          <span>{themeConfig[theme].label}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {(Object.keys(themeConfig) as (keyof typeof themeConfig)[]).map((key) => {
          const ItemIcon = themeConfig[key].icon

          return (
            <DropdownMenuItem key={key} onClick={() => set('theme', key)} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ItemIcon className="h-4 w-4" />
                <span>{themeConfig[key].label}</span>
              </div>

              {theme === key && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
