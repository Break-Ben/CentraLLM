import { useEffect, useState } from 'react'
import { Heart, ExternalLink, Code, Globe } from 'lucide-react'
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

      <SettingsSection title="Links">
        <SettingsOption label="Official Website">
          <Button variant="outline" onClick={() => void window.open('https://centrallm.com')}>
            <Globe />
            <span>Website</span>
            <ExternalLink className="size-3.5 opacity-90" />
          </Button>
        </SettingsOption>
        <SettingsOption label="GitHub Repository">
          <Button variant="outline" onClick={() => void window.open('https://github.com/Break-Ben/CentraLLM')}>
            <Code />
            <span>GitHub</span>
            <ExternalLink className="size-3.5 opacity-90" />
          </Button>
        </SettingsOption>
        <SettingsOption label="Support Development" description="If you find CentraLLM useful, consider supporting its development!">
          <Button variant="default" onClick={() => void window.open('https://ko-fi.com/Break_Ben')}>
            <Heart className="text-red-500 fill-red-500" />
            <span>Support</span>
            <ExternalLink className="size-3.5 opacity-90" />
          </Button>
        </SettingsOption>
      </SettingsSection>
    </>
  )
}
