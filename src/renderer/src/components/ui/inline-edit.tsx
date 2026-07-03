import { useEffect, useRef, useState, KeyboardEvent } from 'react'

interface InlineEditProps extends Omit<React.ComponentProps<'input'>, 'value'> {
  value: string
  isEditing: boolean
  onSave: (next: string) => Promise<void> | void
  onClose: () => void
}

export function InlineEdit({ value, isEditing, onSave, onClose, ...props }: InlineEditProps) {
  const [draft, setDraft] = useState(value)
  const [prevIsEditing, setPrevIsEditing] = useState(isEditing)
  const inputRef = useRef<HTMLInputElement>(null)
  const isSavingRef = useRef(false)

  if (isEditing !== prevIsEditing) {
    setPrevIsEditing(isEditing)
    setDraft(value)
  }

  useEffect(() => {
    if (!isEditing) {
      return
    }

    const id = requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
    return () => cancelAnimationFrame(id)
  }, [isEditing])

  const commit = async () => {
    if (isSavingRef.current) {
      return
    }

    const next = draft.trim()
    if (!next || next === value.trim()) {
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

  if (!isEditing) {
    return <span>{value}</span>
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
