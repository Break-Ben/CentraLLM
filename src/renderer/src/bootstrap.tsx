import { useAppStateStore } from '@/stores/app-state-store'
import { usePreferencesStore } from '@/stores/preferences-store'
import { useCustomProvidersStore } from '@/stores/custom-providers-store'

export async function bootstrap() {
  await Promise.all([useAppStateStore.getState().actions.init(), usePreferencesStore.getState().actions.init(), useCustomProvidersStore.getState().actions.init()])
}
