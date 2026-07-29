import CentraLLMLogo from '@/assets/full-logo.png'
import { ProviderList } from '@/pages/home/provider-list'

export function HomePage(): React.JSX.Element {
  return (
    <div className="flex items-center p-4 h-full w-full overflow-y-auto scrollbar-none">
      <div className="flex flex-col items-center gap-8 my-auto w-full">
        <img src={CentraLLMLogo} alt="Word Art" className="h-16 w-auto" />
        <ProviderList />
      </div>
    </div>
  )
}
