import { create } from 'zustand'

export type Page = { type: 'home' } | { type: 'chat'; id: number | null } | { type: 'settings' }

type NavigationStore = {
  page: Page
  actions: {
    setPage: (page: Page) => void
  }
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  page: { type: 'home' },
  actions: {
    setPage: (page) => set({ page })
  }
}))
