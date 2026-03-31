import { useRef, useEffect, useCallback, useState } from 'react'
import { Boxels, type BoxelStyle } from 'boxels'
import { type ControlsState } from './ControlsPanel'
import { CodeBlock } from './CodeBlock'

function buildStyle(controls: ControlsState): BoxelStyle | undefined {
  const { preset, hue, sizeX: w, sizeY: h, sizeZ: d } = controls
  if (preset === 'none') return undefined

  switch (preset) {
    case 'xray': {
      const cx = w / 2, cy = h / 2, cz = d / 2
      const maxDist = Math.sqrt(cx * cx + cy * cy + cz * cz)
      return {
        default: (x: number, y: number, z: number) => {
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2)
          const opacity = 0.1 + (dist / Math.max(maxDist, 1)) * 0.6
          return {
            fill: `oklch(0.7 0.12 ${hue})`,
            stroke: `oklch(0.5 0.12 ${hue})`,
            opacity,
          }
        },
      }
    }
    case 'glass':
      return {
        default: {
          fill: `oklch(0.8 0.06 ${hue} / 0.15)`,
          stroke: `oklch(0.5 0.08 ${hue} / 0.4)`,
          opacity: 0.8,
          backdropFilter: 'blur(4px)',
        },
      }
    case 'neon':
      return {
        default: {
          fill: 'rgba(10, 10, 15, 0.9)',
          stroke: `oklch(0.8 0.2 ${hue})`,
          opacity: 1,
        },
      }
    case 'gradient':
      return {
        default: (x: number, y: number, z: number) => {
          const h2 = (hue + (x / Math.max(w, 1)) * 120) % 360
          const lightness = 0.4 + (y / Math.max(h, 1)) * 0.4
          const chroma = 0.1 + (z / Math.max(d, 1)) * 0.1
          return {
            fill: `oklch(${lightness} ${chroma} ${h2})`,
            stroke: `oklch(${lightness - 0.1} ${chroma} ${h2})`,
          }
        },
      }
    default:
      return Boxels.presets[preset as keyof typeof Boxels.presets](w, h, d)
  }
}

function createAxisLine(axis: 'x' | 'y', length: number, color: string): HTMLDivElement {
  const line = document.createElement('div')
  line.className = `axis-line axis-${axis}`
  line.style.position = 'absolute'
  line.style.transformStyle = 'preserve-3d'
  line.style.pointerEvents = 'none'

  if (axis === 'x') {
    // Horizontal line (left-right) — this is the axis you rotate AROUND for X spin
    line.style.width = `${length}px`
    line.style.height = '2px'
    line.style.background = `linear-gradient(90deg, transparent, ${color} 20%, ${color} 80%, transparent)`
    line.style.transform = `translate3d(${-length / 2}px, 0, 0)`
  } else {
    // Vertical line (up-down) — this is the axis you rotate AROUND for Y spin
    line.style.width = '2px'
    line.style.height = `${length}px`
    line.style.background = `linear-gradient(180deg, transparent, ${color} 20%, ${color} 80%, transparent)`
    line.style.transform = `translate3d(0, ${-length / 2}px, 0)`
  }

  // Add small sphere marker at center
  const dot = document.createElement('div')
  dot.style.position = 'absolute'
  dot.style.width = '6px'
  dot.style.height = '6px'
  dot.style.borderRadius = '50%'
  dot.style.background = color
  dot.style.boxShadow = `0 0 8px ${color}`
  if (axis === 'x') {
    dot.style.left = '50%'
    dot.style.top = '50%'
    dot.style.transform = 'translate(-50%, -50%)'
  } else {
    dot.style.left = '50%'
    dot.style.top = '50%'
    dot.style.transform = 'translate(-50%, -50%)'
  }
  line.appendChild(dot)

  return line
}

export interface ExamplePageProps {
  title: string
  description: string
  code: string
  controls: ControlsState
  onControlsChange: (controls: ControlsState) => void
  explodeTrigger: number
  collapseTrigger: number
  setup?: (b: Boxels, state: ControlsState) => void
}

export function ExamplePage({
  title, description, code, controls, onControlsChange, explodeTrigger, collapseTrigger, setup,
}: ExamplePageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<Boxels | null>(null)
  const lastExplode = useRef(0)
  const lastCollapse = useRef(0)
  const [showCode, setShowCode] = useState(false)
  const rotRef = useRef({ rotX: -25, rotY: 35 })

  const rebuild = useCallback(() => {
    if (!containerRef.current) return

    // Save current rotation before destroying
    if (instanceRef.current) {
      const rot = instanceRef.current.getRotation()
      rotRef.current.rotX = rot.rotX
      rotRef.current.rotY = rot.rotY
      instanceRef.current.unmount()
    }

    const style = buildStyle(controls)

    const b = new Boxels({
      voxelSize: controls.boxelSize,
      gap: controls.gap,
      edgeWidth: controls.edgeWidth,
      camera: { rotation: [-25, 35] },
      style,
      showBackfaces: controls.backfaces,
      zoom: false,
    })

    if (setup) {
      setup(b, controls)
    } else {
      b.addBox({ position: [0, 0, 0], size: [controls.sizeX, controls.sizeY, controls.sizeZ] })
    }

    b.mount(containerRef.current)
    // Restore rotation
    b.updateTransform(rotRef.current.rotX, rotRef.current.rotY)
    instanceRef.current = b
  }, [controls, setup])

  useEffect(() => {
    rebuild()
    return () => {
      if (instanceRef.current) {
        const rot = instanceRef.current.getRotation()
        rotRef.current.rotX = rot.rotX
        rotRef.current.rotY = rot.rotY
        instanceRef.current.unmount()
        instanceRef.current = null
      }
    }
  }, [rebuild])

  // Mouse wheel controls boxel size
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -5 : 5
      const newSize = Math.max(10, Math.min(200, controls.boxelSize + delta))
      if (newSize !== controls.boxelSize) {
        onControlsChange({ ...controls, boxelSize: newSize })
      }
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [controls, onControlsChange])

  // Axis lines — show when spin is active
  useEffect(() => {
    const b = instanceRef.current
    if (!b) return
    const world = b.getWorldContainer()
    if (!world) return

    // Remove existing axis lines
    world.querySelectorAll('.axis-line').forEach((el) => el.remove())

    const axisLength = Math.max(controls.sizeX, controls.sizeY, controls.sizeZ) * (controls.boxelSize + controls.gap) * 1.8

    if (controls.spinX) {
      world.appendChild(createAxisLine('x', axisLength, 'rgba(255, 100, 100, 0.6)'))
    }
    if (controls.spinY) {
      world.appendChild(createAxisLine('y', axisLength, 'rgba(100, 180, 255, 0.6)'))
    }

    return () => {
      world.querySelectorAll('.axis-line').forEach((el) => el.remove())
    }
  }, [controls.spinX, controls.spinY, controls.sizeX, controls.sizeY, controls.sizeZ, controls.boxelSize, controls.gap])

  useEffect(() => {
    if (explodeTrigger > lastExplode.current) {
      instanceRef.current?.animateGap({ from: controls.gap, to: 10, duration: 800 })
    }
    lastExplode.current = explodeTrigger
  }, [explodeTrigger])

  // Auto-rotate — continues from last known rotation
  useEffect(() => {
    if (!controls.spinX && !controls.spinY) return
    const b = instanceRef.current
    if (!b) return

    const current = b.getRotation()
    rotRef.current.rotX = current.rotX
    rotRef.current.rotY = current.rotY

    const speed = controls.spinSpeed * 0.3
    let rafId: number

    const tick = () => {
      if (controls.spinX) rotRef.current.rotX += speed * controls.spinXDir
      if (controls.spinY) rotRef.current.rotY += speed * controls.spinYDir
      b.updateTransform(rotRef.current.rotX, rotRef.current.rotY)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafId)
  }, [controls.spinX, controls.spinY, controls.spinXDir, controls.spinYDir, controls.spinSpeed])

  useEffect(() => {
    if (collapseTrigger > lastCollapse.current) {
      instanceRef.current?.animateGap({ from: 10, to: 0, duration: 800 })
    }
    lastCollapse.current = collapseTrigger
  }, [collapseTrigger])

  return (
    <div className="example-page">
      <div className="scene-area">
        <div className="scene-header">
          <span className="scene-title">{title}</span>
          <span className="scene-desc">{description}</span>
          <button
            className="code-toggle"
            onClick={() => setShowCode(!showCode)}
          >
            {showCode ? 'Hide code' : 'Show code'}
          </button>
        </div>
        <div ref={containerRef} className="scene-container" />
      </div>
      {showCode && (
        <div className="code-drawer">
          <CodeBlock code={code} />
        </div>
      )}
    </div>
  )
}
