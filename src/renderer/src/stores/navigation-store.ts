import { Page } from '@shared/navigation'
import { create } from 'zustand'

type NavigationStore = {
  page: Page
  actions: {
    setPage: (page: Page) => void
  }
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  page: { type: 'home' },
  actions: {
    setPage: (page) => {
      set({ page })
      window.api.navigation.pageChanged(page)
    }
  }
}))
