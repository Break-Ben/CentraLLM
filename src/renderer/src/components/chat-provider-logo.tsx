import { ComponentType, SVGProps } from 'react'
import { BotMessageSquare } from 'lucide-react'
import { BuiltInChatProviderId, ChatProviderId } from '@shared/chat'

import ChatGPTLogo from '@/assets/provider-logos/chatgpt.svg?react'
import ClaudeLogo from '@/assets/provider-logos/claude.svg?react'
import CopilotLogo from '@/assets/provider-logos/copilot.svg?react'
import DeepSeekLogo from '@/assets/provider-logos/deepseek.svg?react'
import GeminiLogo from '@/assets/provider-logos/gemini.svg?react'
import GrokLogo from '@/assets/provider-logos/grok.svg?react'
import KimiLogo from '@/assets/provider-logos/kimi.svg?react'
import LongcatLogo from '@/assets/provider-logos/longcat.svg?react'
import MetaLogo from '@/assets/provider-logos/meta.svg?react'
import MiniMaxLogo from '@/assets/provider-logos/minimax.svg?react'
import MistralLogo from '@/assets/provider-logos/mistral.svg?react'
import NotebookLMLogo from '@/assets/provider-logos/notebooklm.svg?react'
import PerplexityLogo from '@/assets/provider-logos/perplexity.svg?react'
import QwenLogo from '@/assets/provider-logos/qwen.svg?react'
import ZaiLogo from '@/assets/provider-logos/zai.svg?react'

const ICON_MAP: Record<BuiltInChatProviderId, ComponentType<SVGProps<SVGSVGElement>>> = {
  chatgpt: ChatGPTLogo,
  claude: ClaudeLogo,
  copilot: CopilotLogo,
  deepseek: DeepSeekLogo,
  gemini: GeminiLogo,
  grok: GrokLogo,
  kimi: KimiLogo,
  longcat: LongcatLogo,
  meta: MetaLogo,
  minimax: MiniMaxLogo,
  mistral: MistralLogo,
  notebooklm: NotebookLMLogo,
  perplexity: PerplexityLogo,
  qwen: QwenLogo,
  zai: ZaiLogo
}

interface ChatProviderLogoProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  providerId: ChatProviderId
  size?: number | string
}

export function ChatProviderLogo({ providerId, size = 16, ...props }: ChatProviderLogoProps): React.JSX.Element {
  const IconComponent = ICON_MAP[providerId as BuiltInChatProviderId] ?? BotMessageSquare
  return <IconComponent {...props} width={size} height={size} />
}
