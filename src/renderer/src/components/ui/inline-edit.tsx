import { useEffect, useRef, useState, KeyboardEvent } from 'react'

interface InlineEditProps extends Omit<React.ComponentProps<'input'>, 'value'> {
  initialValue: string
  onSave: (next: string) => Promise<void> | void
  onClose: () => void
}

export function InlineEdit({ initialValue, onSave, onClose, ...props }: InlineEditProps) {
  const [draft, setDraft] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const isSavingRef = useRef(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
    return () => cancelAnimationFrame(id)
  }, [])

  const commit = async () => {
    if (isSavingRef.current) {
      return
    }

    const next = draft.trim()
    if (!next || next === initialValue.trim()) {
      onClose()
      return
    }

    isSavingRef.current = true
    try {
      await onSave(next)
      onClose()
    } catch {
      onClose()
    } finally {
      isSavingRef.current = false
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <span>
      <input
        {...props}
        className="bg-transparent outline-none"
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={onKeyDown}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      />
    </span>
  )
}
