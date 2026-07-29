import { useEffect, useState } from 'react'
import { Heart, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingsOption } from '@/pages/settings/settings-option'
import { SettingsSection } from '@/pages/settings/settings-section'
import { AppInfo } from '@shared/app-info'

export function AboutView(): React.JSX.Element {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)

  useEffect(() => {
    window.api.appInfo.get().then(setAppInfo).catch(console.error)
  }, [])

  return (
    <>
      <SettingsSection title="About">
        <SettingsOption label="App Version">
          <span className="text-sm font-medium text-muted-foreground">{appInfo?.version ?? '...'}</span>
        </SettingsOption>
        <SettingsOption label="Operating System">
          <span className="text-sm font-medium text-muted-foreground">{appInfo?.osVersion ?? '...'}</span>
        </SettingsOption>
      </SettingsSection>

      <SettingsSection title="Support">
        <SettingsOption label="Support Development" description="If you find CentraLLM useful, consider supporting its development!">
          <Button variant="default" onClick={() => void window.open('https://ko-fi.com/break_ben')}>
            <Heart className="text-red-500 fill-red-500" />
            <span>Support</span>
            <ExternalLink className="size-3.5 ml-0.5" />
          </Button>
        </SettingsOption>
      </SettingsSection>
    </>
  )
}
