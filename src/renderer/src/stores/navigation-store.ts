import { Page } from '@shared/navigation'
import { create } from 'zustand'

type NavigationStore = {
  page: Page
  actions: {
    init: () => () => void
    setPage: (page: Page) => void
  }
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  page: { type: 'home' },
  actions: {
    init: () => {
      const disposeNavigate = window.api.navigation.onNavigate((page) => {
        set({ page })
      })
      return () => {
        disposeNavigate()
      }
    },
    setPage: (page) => {
      set({ page })
      window.api.navigation.pageChanged(page)
    }
  }
}))
