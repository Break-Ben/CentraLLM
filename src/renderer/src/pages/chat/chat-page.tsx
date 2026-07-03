import { useLayoutEffect, useRef } from 'react'

export function ChatPage(): React.JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) {
      return
    }

    const sync = () => {
      const rect = host.getBoundingClientRect()
      window.api.layout.setWebviewBounds({
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      })
    }
    sync()
    const resizeObserver = new ResizeObserver(sync)
    resizeObserver.observe(host)
    window.api.layout.setWebviewVisible(true)

    return () => {
      resizeObserver.disconnect()
      window.api.layout.setWebviewVisible(false)
    }
  }, [])

  return <div ref={hostRef} className="flex-1" />
}
