import { useRef, useEffect, useCallback, useState } from 'react'
import { Boxels, type BoxelStyle } from 'boxels'
import { type ControlsState } from './ControlsPanel'
import { CodeBlock } from './CodeBlock'

function buildStyle(controls: ControlsState): BoxelStyle | undefined {
  const { preset, hue, sizeX: w, sizeY: h, sizeZ: d } = controls
  if (preset === 'none') return undefined

  // For presets that support hue shifting, inject the hue value
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
      // For presets that don't use hue (rubik, heerich, wireframe, marble), use as-is
      return Boxels.presets[preset as keyof typeof Boxels.presets](w, h, d)
  }
}

export interface ExamplePageProps {
  title: string
  description: string
  code: string
  controls: ControlsState
  explodeTrigger: number
  collapseTrigger: number
  setup?: (b: Boxels, state: ControlsState) => void
}

export function ExamplePage({
  title, description, code, controls, explodeTrigger, collapseTrigger, setup,
}: ExamplePageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<Boxels | null>(null)
  const lastExplode = useRef(0)
  const lastCollapse = useRef(0)
  const [showCode, setShowCode] = useState(false)

  const rebuild = useCallback(() => {
    if (!containerRef.current) return

    if (instanceRef.current) {
      instanceRef.current.unmount()
    }

    const style = buildStyle(controls)

    const b = new Boxels({
      voxelSize: controls.boxelSize,
      gap: controls.gap,
      edgeWidth: controls.edgeWidth,
      camera: { rotation: [-25, 35] },
      style,
    })

    if (setup) {
      setup(b, controls)
    } else {
      b.addBox({ position: [0, 0, 0], size: [controls.sizeX, controls.sizeY, controls.sizeZ] })
    }

    b.mount(containerRef.current)
    instanceRef.current = b
  }, [controls, setup])

  useEffect(() => {
    rebuild()
    return () => {
      if (instanceRef.current) {
        instanceRef.current.unmount()
        instanceRef.current = null
      }
    }
  }, [rebuild])

  useEffect(() => {
    if (explodeTrigger > lastExplode.current) {
      instanceRef.current?.explode({ factor: 2.2, duration: 800 })
    }
    lastExplode.current = explodeTrigger
  }, [explodeTrigger])

  useEffect(() => {
    if (collapseTrigger > lastCollapse.current) {
      instanceRef.current?.collapse()
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
