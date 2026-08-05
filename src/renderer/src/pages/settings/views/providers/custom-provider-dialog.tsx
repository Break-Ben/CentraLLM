import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChatProvider } from '@shared/chat'
import { usePreferencesStore } from '@/stores/preferences-store'
import { useCustomProvidersStore } from '@/stores/custom-providers-store'
import { useShownProviders } from '@/hooks/use-providers'
import { cn } from '@/lib/utils'

interface CustomProviderDialogProps {
  open: boolean
  provider: ChatProvider | null
  onClose: () => void
}

const EMPTY_FORM = {
  name: '',
  newChatUrl: '',
  chatUrlPrefix: '',
  titleSuffix: '',
  chatIdExclusionRegex: ''
}

export function CustomProviderDialog({ open, provider, onClose }: CustomProviderDialogProps): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{provider ? 'Edit Provider' : 'Add Custom Provider'}</DialogTitle>
        </DialogHeader>
        {open && <ProviderFormContent provider={provider} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function ProviderFormContent({ provider, onClose }: Omit<CustomProviderDialogProps, 'open'>): React.JSX.Element {
  const shownProviderIds = usePreferencesStore((state) => state.shownProviderIds)
  const { set: setPreference } = usePreferencesStore((state) => state.actions)
  const customProvidersActions = useCustomProvidersStore((state) => state.actions)
  const shownProviders = useShownProviders()

  const [hasTitleSuffix, setHasTitleSuffix] = useState(() => provider?.titleSuffix !== undefined)

  const [form, setForm] = useState(() =>
    provider
      ? {
          name: provider.name,
          newChatUrl: provider.newChatUrl,
          chatUrlPrefix: provider.chatUrlPrefix,
          titleSuffix: provider.titleSuffix ?? '',
          chatIdExclusionRegex: provider.chatIdExclusionRegex ?? ''
        }
      : EMPTY_FORM
  )

  const handleChange = (field: keyof typeof EMPTY_FORM, value: string): void => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const isRegexValid = isValidRegex(form.chatIdExclusionRegex)
  const isValid = form.name.trim() && form.newChatUrl.trim() && form.chatUrlPrefix.trim() && isRegexValid

  const handleSave = async (): Promise<void> => {
    if (!isValid) {
      return
    }

    const data = {
      name: form.name.trim(),
      newChatUrl: form.newChatUrl.trim(),
      chatUrlPrefix: form.chatUrlPrefix.trim(),
      titleSuffix: hasTitleSuffix ? form.titleSuffix.trim() : undefined,
      chatIdExclusionRegex: form.chatIdExclusionRegex.trim() || undefined
    }

    if (provider) {
      await customProvidersActions.update(provider.id, data)
    } else {
      const created = await customProvidersActions.create(data)
      if (created) {
        void setPreference('shownProviderIds', [...shownProviderIds, created.id])
      }
    }
    onClose()
  }

  const handleDelete = async (): Promise<void> => {
    if (!provider) {
      return
    }
    await customProvidersActions.remove(provider.id)
    void setPreference(
      'shownProviderIds',
      shownProviderIds.filter((id) => id !== provider.id)
    )
    onClose()
  }

  const disableDelete = shownProviders.length === 1 && shownProviders[0].id === provider?.id

  return (
    <>
      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={form.name} onChange={(event) => handleChange('name', event.target.value)} placeholder="My LLM" />
        </div>
        <div className="space-y-1.5">
          <Label>New Chat URL</Label>
          <Input value={form.newChatUrl} onChange={(event) => handleChange('newChatUrl', event.target.value)} placeholder="https://example.com/new" />
        </div>
        <div className="space-y-1.5">
          <Label>Chat URL Prefix</Label>
          <Input value={form.chatUrlPrefix} onChange={(event) => handleChange('chatUrlPrefix', event.target.value)} placeholder="https://example.com/chat/" />
          <p className="text-xs text-muted-foreground">Used to identify existing chat links belonging to this provider.</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox id="hasTitleSuffix" checked={hasTitleSuffix} onCheckedChange={(checked) => setHasTitleSuffix(checked)} />
            <Label htmlFor="hasTitleSuffix" className="cursor-pointer text-sm">
              Retrieve chat names from site title
            </Label>
          </div>
          {hasTitleSuffix && (
            <div className="space-y-1.5 pt-1">
              <Label>
                Title Suffix <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input value={form.titleSuffix} onChange={(event) => handleChange('titleSuffix', event.target.value)} placeholder=" - My LLM" />
              <p className="text-xs text-muted-foreground">Text appended to the browser tab title when interacting with this provider.</p>
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>
            Chat ID Exclusion Regex <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input value={form.chatIdExclusionRegex} onChange={(event) => handleChange('chatIdExclusionRegex', event.target.value)} placeholder="^WEB:" className={cn(!isRegexValid && 'border-destructive focus-visible:ring-destructive')} />
          {!isRegexValid ? <p className="text-xs text-destructive">Invalid regular expression pattern.</p> : <p className="text-xs text-muted-foreground">Regex pattern for excluding invalid chat IDs that match the chat URL prefix.</p>}
        </div>
      </div>
      <div className="flex items-center justify-between pt-2">
        {provider ? (
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={disableDelete}>
            Delete
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!isValid}>
            {provider ? 'Save' : 'Add'}
          </Button>
        </div>
      </div>
    </>
  )
}

function isValidRegex(pattern: string): boolean {
  if (!pattern.trim()) {
    return true
  }
  try {
    new RegExp(pattern)
    return true
  } catch {
    return false
  }
}
