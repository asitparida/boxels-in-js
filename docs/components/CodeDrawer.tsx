import { useState, useRef, useCallback } from 'react'
import { CodeBlock } from './CodeBlock'

interface Props {
  code: string
  visible: boolean
}

export function CodeDrawer({ code, visible }: Props) {
  const [height, setHeight] = useState(280)
  const dragging = useRef(false)
  const dragStartY = useRef(0)
  const dragStartH = useRef(0)

  const onDragStart = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    dragStartY.current = e.clientY
    dragStartH.current = height
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [height])

  const onDragMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const delta = dragStartY.current - e.clientY
    const maxH = window.innerHeight * 0.4
    setHeight(Math.max(280, Math.min(maxH, dragStartH.current + delta)))
  }, [])

  const onDragEnd = useCallback(() => {
    dragging.current = false
  }, [])

  if (!visible) return null

  return (
    <div className="code-drawer" style={{ height }}>
      <div
        className="code-drag-handle"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
      />
      <CodeBlock code={code} />
    </div>
  )
}
