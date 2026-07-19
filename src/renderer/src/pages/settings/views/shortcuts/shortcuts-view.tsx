import { useCallback, useEffect, useState } from 'react'
import { eventToAccelerator, hasModifier, isModifierOnly, SHORTCUT_DESCRIPTIONS, SHORTCUT_LABELS, ShortcutAction, Keybindings } from '@shared/shortcuts'
import { usePreferencesStore } from '@/stores/preferences-store'
import { Button } from '@/components/ui/button'
import { SettingsOption } from '@/pages/settings/settings-option'
import { SettingsSection } from '@/pages/settings/settings-section'

export function ShortcutsView(): React.JSX.Element {
  const keybindings = usePreferencesStore((state) => state.keybindings)
  const setPreference = usePreferencesStore((state) => state.actions.set)
  const [recording, setRecording] = useState<ShortcutAction | null>(null)

  const stopRecording = useCallback(() => {
    setRecording(null)
    window.api.shortcuts.setRecording(false)
  }, [])

  const startRecording = useCallback((action: ShortcutAction) => {
    setRecording(action)
    window.api.shortcuts.setRecording(true)
  }, [])

  useEffect(() => {
    if (!recording) {
      return
    }

    return window.api.shortcuts.onKeyEvent((event) => {
      if (event.key === 'escape' && !hasModifier(event)) {
        stopRecording()
        return
      }

      if (isModifierOnly(event) || !hasModifier(event)) {
        return
      }

      const newKeybinding = eventToAccelerator(event)
      void setPreference('keybindings', { ...keybindings, [recording]: newKeybinding } as Keybindings)
      stopRecording()
    })
  }, [recording, keybindings, setPreference, stopRecording])

  useEffect(() => {
    if (!recording) {
      return
    }
    const handleMouseDown = () => stopRecording()
    window.addEventListener('mousedown', handleMouseDown)
    return () => window.removeEventListener('mousedown', handleMouseDown)
  }, [recording, stopRecording])

  useEffect(() => {
    return () => window.api.shortcuts.setRecording(false)
  }, [])

  return (
    <SettingsSection title="Keyboard Shortcuts">
      {(Object.keys(SHORTCUT_LABELS) as ShortcutAction[]).map((action) => (
        <SettingsOption key={action} label={SHORTCUT_LABELS[action]} description={SHORTCUT_DESCRIPTIONS[action]}>
          <Button
            variant={recording === action ? 'secondary' : 'outline'}
            size="sm"
            className="ml-4 min-w-24 font-mono"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={() => (recording === action ? stopRecording() : startRecording(action))}
          >
            {recording === action ? 'Press keys…' : keybindings[action]}
          </Button>
        </SettingsOption>
      ))}
    </SettingsSection>
  )
}
