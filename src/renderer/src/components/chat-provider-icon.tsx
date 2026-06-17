import { ComponentType, SVGProps } from 'react'
import { ChatProviderId } from '@shared/chat'

import ChatGPTLogo from '@/assets/provider-logos/chatgpt.svg?react'
import GeminiLogo from '@/assets/provider-logos/gemini.svg?react'
import ClaudeLogo from '@/assets/provider-logos/claude.svg?react'

const ICON_MAP: Record<ChatProviderId, ComponentType<SVGProps<SVGSVGElement>>> = {
  chatgpt: ChatGPTLogo,
  gemini: GeminiLogo,
  claude: ClaudeLogo
}

interface ChatProviderIconProps extends SVGProps<SVGSVGElement> {
  providerId: ChatProviderId
}

export function ChatProviderIcon({ providerId, ...props }: ChatProviderIconProps) {
  const IconComponent = ICON_MAP[providerId]
  return <IconComponent {...props} />
}
