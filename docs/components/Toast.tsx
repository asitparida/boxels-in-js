import { useState, useRef, useCallback } from 'react'

export function useToast() {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const show = useCallback((msg: string) => {
    setMessage(msg)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMessage(null), 3000)
  }, [])

  const dismiss = useCallback(() => setMessage(null), [])

  return { message, show, dismiss }
}

export function Toast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  if (!message) return null
  return (
    <div className="boxel-toast">
      <span>{message}</span>
      <button onClick={onDismiss}>&times;</button>
    </div>
  )
}
