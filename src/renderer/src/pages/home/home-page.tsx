import CentraLLMLogo from '@/assets/logo.svg?react'
import { ProviderList } from '@/pages/home/provider-list'

export function HomePage(): React.JSX.Element {
  return (
    <div className="flex items-center p-4 h-full w-full overflow-y-auto scrollbar-none">
      <div className="flex flex-col items-center gap-8 my-auto w-full">
        <div className="flex flex-col items-center gap-4">
          <CentraLLMLogo className="h-16 w-16" />
          <h1 className="text-4xl font-bold tracking-tight">CentraLLM</h1>
        </div>
        <ProviderList />
      </div>
    </div>
  )
}
