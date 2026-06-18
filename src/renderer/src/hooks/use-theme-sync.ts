import { useEffect } from 'react'
import { usePreferencesStore } from '@/stores/preferences-store'

export function useThemeSync() {
  const theme = usePreferencesStore((state) => state.theme)

  useEffect(() => {
    const root = document.documentElement
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    root.classList.toggle('dark', isDark)
  }, [theme])
}
