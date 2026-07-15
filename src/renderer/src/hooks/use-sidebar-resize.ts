import * as React from 'react'

export const MIN_SIDEBAR_WIDTH = 200
export const MAX_SIDEBAR_WIDTH = 600

export interface UseSidebarResizeProps {
  side?: 'left' | 'right'
  currentWidth: number
  onWidthChange: (width: number) => void
  onResizeEnd?: (width: number) => void
  onCollapse?: () => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  sidebarRef: React.RefObject<HTMLDivElement | null>
}

export function useSidebarResize({ side = 'left', currentWidth, onWidthChange, onResizeEnd, onCollapse, isOpen, onOpenChange, sidebarRef }: UseSidebarResizeProps) {
  const [isResizing, setIsResizing] = React.useState(false)
  const startOriginRef = React.useRef(0)
  const dragWidthRef = React.useRef(currentWidth)

  const handleMouseDown = React.useCallback(
    (event: React.MouseEvent) => {
      if (event.button !== 0) {
        return
      }
      event.preventDefault()
      setIsResizing(true)

      const rect = sidebarRef.current?.getBoundingClientRect()
      if (rect) {
        startOriginRef.current = side === 'left' ? rect.left : rect.right
      }
      dragWidthRef.current = currentWidth
      onWidthChange(currentWidth)
    },
    [currentWidth, side, onWidthChange, sidebarRef]
  )

  React.useEffect(() => {
    if (!isResizing) {
      return
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      onResizeEnd?.(dragWidthRef.current)
    }

    const handleMouseMove = (event: MouseEvent) => {
      let newWidth = side === 'left' ? event.clientX - startOriginRef.current : startOriginRef.current - event.clientX

      if (!isOpen) {
        if (newWidth >= MIN_SIDEBAR_WIDTH / 2) {
          onOpenChange(true)
        } else {
          return
        }
      } else {
        if (newWidth < MIN_SIDEBAR_WIDTH / 2) {
          onOpenChange(false)
          onCollapse?.()
          return
        }
      }

      newWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, newWidth))
      dragWidthRef.current = newWidth
      onWidthChange(newWidth)
    }

    document.body.style.cursor = side === 'left' ? 'w-resize' : 'e-resize'
    document.body.style.userSelect = 'none'

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, side, onWidthChange, onResizeEnd, onCollapse, isOpen, onOpenChange])

  return {
    isResizing,
    handleMouseDown
  }
}
