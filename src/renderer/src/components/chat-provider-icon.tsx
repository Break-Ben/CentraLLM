import { ComponentType, SVGProps } from 'react'
import { ChatProviderId } from '@shared/chat'

import ChatGPTLogo from '@/assets/provider-logos/chatgpt.svg?react'
import ClaudeLogo from '@/assets/provider-logos/claude.svg?react'
import DeepSeekLogo from '@/assets/provider-logos/deepseek.svg?react'
import GeminiLogo from '@/assets/provider-logos/gemini.svg?react'
import GrokLogo from '@/assets/provider-logos/grok.svg?react'
import KimiLogo from '@/assets/provider-logos/kimi.svg?react'
import MistralLogo from '@/assets/provider-logos/mistral.svg?react'
import PerplexityLogo from '@/assets/provider-logos/perplexity.svg?react'

const ICON_MAP: Record<ChatProviderId, ComponentType<SVGProps<SVGSVGElement>>> = {
  chatgpt: ChatGPTLogo,
  claude: ClaudeLogo,
  deepseek: DeepSeekLogo,
  gemini: GeminiLogo,
  grok: GrokLogo,
  kimi: KimiLogo,
  mistral: MistralLogo,
  perplexity: PerplexityLogo
}

interface ChatProviderLogoProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  providerId: ChatProviderId
  size?: number | string
}

export function ChatProviderLogo({ providerId, size = 16, ...props }: ChatProviderLogoProps) {
  const IconComponent = ICON_MAP[providerId]
  return <IconComponent {...props} width={size} height={size} />
}
