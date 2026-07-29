import { useNavigationStore } from '@/stores/navigation-store'
import { CATEGORY_LABELS, PreferenceCategory } from '@shared/preferences'
import { SettingsCategoryButton } from '@/pages/settings/settings-category-button'

import { AppearanceView } from '@/pages/settings/views/appearance/appearance-view'
import { GeneralView } from '@/pages/settings/views/general/general-view'
import { ProvidersView } from '@/pages/settings/views/providers/providers-view'
import { ShortcutsView } from '@/pages/settings/views/shortcuts/shortcuts-view'
import { AboutView } from '@/pages/settings/views/about/about-view'

const CATEGORY_VIEWS: Record<PreferenceCategory, React.ComponentType> = {
  general: GeneralView,
  appearance: AppearanceView,
  providers: ProvidersView,
  shortcuts: ShortcutsView,
  about: AboutView
}

export function SettingsPage(): React.JSX.Element {
  const page = useNavigationStore((state) => state.page)
  const setPage = useNavigationStore((state) => state.actions.setPage)

  if (page.type !== 'settings') {
    return <></>
  }

  const ActiveCategoryView = CATEGORY_VIEWS[page.category]

  return (
    <div className="flex size-full gap-10 overflow-hidden px-8">
      <div className="w-56 shrink-0 overflow-y-auto scrollbar-none pt-9 pb-8 space-y-1">
        {(Object.keys(CATEGORY_LABELS) as PreferenceCategory[]).map((category) => (
          <SettingsCategoryButton key={category} category={category} isActive={page.category === category} onClick={() => setPage({ type: 'settings', category })} />
        ))}
      </div>

      <div className="min-w-0 flex-1 overflow-y-auto scrollbar-none py-8">
        <div className="mx-auto w-full max-w-2xl space-y-8">
          <ActiveCategoryView />
        </div>
      </div>
    </div>
  )
}
