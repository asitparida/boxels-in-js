import { useRef, useEffect, type CSSProperties } from 'react'
import {
  Boxels as BoxelsCore,
  type BoxelsOptions,
  type BoxelStyle,
  type BoxelEvent,
  type AddBoxOptions,
  type AddSphereOptions,
  type AddLineOptions,
} from '../lib/index'

export interface BoxelsProps {
  boxes?: AddBoxOptions[]
  spheres?: AddSphereOptions[]
  lines?: AddLineOptions[]
  style?: BoxelStyle
  gap?: number
  boxelSize?: number
  edgeWidth?: number
  edgeColor?: string
  camera?: BoxelsOptions['camera']
  orbit?: boolean
  zoom?: boolean
  onBoxelClick?: (e: BoxelEvent) => void
  onBoxelHover?: (e: BoxelEvent) => void
  onBoxelPointerDown?: (e: BoxelEvent) => void
  className?: string
  containerStyle?: CSSProperties
}

export function Boxels({
  boxes = [],
  spheres = [],
  lines = [],
  style,
  gap = 0,
  boxelSize = 50,
  edgeWidth = 1,
  edgeColor = '#333',
  camera,
  orbit = true,
  zoom = true,
  onBoxelClick,
  onBoxelHover,
  onBoxelPointerDown,
  className,
  containerStyle,
}: BoxelsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<BoxelsCore | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const b = new BoxelsCore({
      renderer: 'dom',
      boxelSize,
      gap,
      edgeWidth,
      edgeColor,
      camera,
      orbit,
      zoom,
      style,
    })

    b.mount(containerRef.current)
    instanceRef.current = b

    return () => {
      b.unmount()
      instanceRef.current = null
    }
  }, [orbit, zoom, camera?.distance, camera?.rotation?.[0], camera?.rotation?.[1], boxelSize, gap, edgeWidth, edgeColor, style])

  useEffect(() => {
    const b = instanceRef.current
    if (!b) return

    b.clear()
    for (const box of boxes) {
      b.addBox(box)
    }
    for (const sphere of spheres) {
      b.addSphere(sphere)
    }
    for (const line of lines) {
      b.addLine(line)
    }
  }, [boxes, spheres, lines])

  useEffect(() => {
    const b = instanceRef.current
    if (!b) return

    const clickHandler = onBoxelClick as ((e: BoxelEvent | Event) => void) | undefined
    const hoverHandler = onBoxelHover as ((e: BoxelEvent | Event) => void) | undefined
    const pointerHandler = onBoxelPointerDown as ((e: BoxelEvent | Event) => void) | undefined

    if (clickHandler) b.on('boxel:click', clickHandler)
    if (hoverHandler) b.on('boxel:hover', hoverHandler)
    if (pointerHandler) b.on('boxel:pointerdown', pointerHandler)

    return () => {
      if (clickHandler) b.off('boxel:click', clickHandler)
      if (hoverHandler) b.off('boxel:hover', hoverHandler)
      if (pointerHandler) b.off('boxel:pointerdown', pointerHandler)
    }
  }, [onBoxelClick, onBoxelHover, onBoxelPointerDown])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '400px',
        ...containerStyle,
      }}
    />
  )
}
