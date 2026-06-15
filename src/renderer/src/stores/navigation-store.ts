import { create } from 'zustand'

export type Page = { type: 'home' } | { type: 'chat'; id: number | null } | { type: 'settings' }

type NavigationStore = {
  page: Page
  setPage: (page: Page) => void
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  page: { type: 'home' },
  setPage: (page) => set({ page })
}))
