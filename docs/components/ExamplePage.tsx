import { useRef, useEffect, useCallback, useState } from 'react'
import { Boxels, type BoxelStyle } from 'boxels'
import { type ControlsState } from './ControlsPanel'
import { CodeBlock } from './CodeBlock'

export function buildStyle(controls: ControlsState): BoxelStyle | undefined {
  const { preset, hue, opacity: opPct, sizeX: w, sizeY: h, sizeZ: d } = controls
  const op = opPct / 100
  if (preset === 'none') return { default: { opacity: op } }

  switch (preset) {
    case 'xray': {
      const cx = w / 2, cy = h / 2, cz = d / 2
      const maxDist = Math.sqrt(cx * cx + cy * cy + cz * cz)
      return {
        default: (x: number, y: number, z: number) => {
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2)
          const distOp = 0.1 + (dist / Math.max(maxDist, 1)) * 0.6
          return {
            fill: `oklch(0.7 0.12 ${hue})`,
            stroke: `oklch(0.5 0.12 ${hue})`,
            opacity: distOp * op,
          }
        },
      }
    }
    case 'glass':
      return {
        default: {
          fill: `oklch(0.8 0.06 ${hue} / ${0.15 * op})`,
          stroke: `oklch(0.5 0.08 ${hue} / ${0.4 * op})`,
          opacity: op,
          backdropFilter: `blur(${Math.round(4 * op)}px)`,
        },
      }
    case 'neon':
      return {
        default: {
          fill: `rgba(10, 10, 15, ${0.9 * op})`,
          stroke: `oklch(0.8 0.2 ${hue})`,
          opacity: op,
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
            opacity: op,
          }
        },
      }
    default: {
      const base = Boxels.presets[preset as keyof typeof Boxels.presets](w, h, d)
      if (base.default && typeof base.default !== 'function') {
        base.default = { ...base.default, opacity: op }
      }
      return base
    }
  }
}

function createLabel(text: string, color: string, x: number, y: number): HTMLDivElement {
  const label = document.createElement('div')
  label.className = 'axis-label'
  label.textContent = text
  label.style.position = 'absolute'
  label.style.color = color
  label.style.fontSize = '16px'
  label.style.fontFamily = "'Geist Mono', monospace"
  label.style.fontWeight = '700'
  // Push forward on Z so it renders in front of cube faces
  label.style.transform = `translate3d(${x}px, ${y}px, 2px)`
  label.style.pointerEvents = 'none'
  label.style.textShadow = `0 0 16px ${color}, 0 2px 8px rgba(0,0,0,0.9)`
  label.style.whiteSpace = 'nowrap'
  return label
}

function createLocalAxes(halfLen: number): HTMLDivElement {
  const group = document.createElement('div')
  group.className = 'axis-line'
  group.style.position = 'absolute'
  group.style.transformStyle = 'preserve-3d'
  group.style.pointerEvents = 'none'

  const xColor = 'rgba(255, 100, 100, 0.6)'
  const yColor = 'rgba(100, 180, 255, 0.6)'

  // ── Left-Right axis (X) ──
  // Push slightly forward on Z so it's always visible
  const xLine = document.createElement('div')
  xLine.style.position = 'absolute'
  xLine.style.width = `${halfLen * 2}px`
  xLine.style.height = '2px'
  xLine.style.background = `linear-gradient(90deg, transparent, ${xColor} 10%, ${xColor} 90%, transparent)`
  xLine.style.transform = `translate3d(${-halfLen}px, 0px, 2px)`
  group.appendChild(xLine)

  group.appendChild(createLabel('L', xColor, -halfLen - 22, -10))
  group.appendChild(createLabel('R', xColor, halfLen + 8, -10))

  // ── Top-Bottom axis (Y) ──
  // In CSS, negative Y = up (which is "top" in world space)
  const yLine = document.createElement('div')
  yLine.style.position = 'absolute'
  yLine.style.width = '2px'
  yLine.style.height = `${halfLen * 2}px`
  yLine.style.background = `linear-gradient(180deg, transparent, ${yColor} 10%, ${yColor} 90%, transparent)`
  yLine.style.transform = `translate3d(0px, ${-halfLen}px, 2px)`
  group.appendChild(yLine)

  group.appendChild(createLabel('T', yColor, -10, -halfLen - 26))
  group.appendChild(createLabel('B', yColor, -10, halfLen + 8))

  // Center dot
  const dot = document.createElement('div')
  dot.style.position = 'absolute'
  dot.style.width = '8px'
  dot.style.height = '8px'
  dot.style.borderRadius = '50%'
  dot.style.background = 'rgba(255,255,255,0.7)'
  dot.style.boxShadow = '0 0 12px rgba(255,255,255,0.5)'
  dot.style.transform = 'translate3d(-4px, -4px, 2px)'
  group.appendChild(dot)

  return group
}

function generateCode(controls: ControlsState): string {
  const presetLine = controls.preset !== 'none'
    ? `\n  style: Boxels.presets.${controls.preset}(${controls.sizeX}, ${controls.sizeY}, ${controls.sizeZ}),`
    : ''
  const backfaceLine = controls.backfaces ? '\n  showBackfaces: true,' : ''

  return `import { Boxels } from 'boxels'

const b = new Boxels({
  boxelSize: ${controls.boxelSize},
  gap: ${controls.gap},
  edgeWidth: ${controls.edgeWidth},
  camera: { rotation: [-25, 35] },${presetLine}${backfaceLine}
})

b.addBox({ position: [0, 0, 0], size: [${controls.sizeX}, ${controls.sizeY}, ${controls.sizeZ}] })
b.mount(document.getElementById('scene'))`
}

export interface ExamplePageProps {
  title: string
  description: string
  code?: string
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
  const rotRef = useRef({ rotX: -25, rotY: 35 })
  const [rebuildCount, setRebuildCount] = useState(0)

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
      boxelSize: controls.boxelSize,
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
    setRebuildCount((n) => n + 1)
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

  // Apply image to faces via library API
  useEffect(() => {
    const b = instanceRef.current
    if (!b) return
    if (!controls.imageDataUrl) {
      b.clearImage()
      return
    }
    const targetFace = controls.imageFace === 'all' ? undefined : controls.imageFace
    b.mapImage(controls.imageDataUrl, targetFace as import('boxels').FaceName | undefined)
  }, [controls.imageDataUrl, controls.imageFace, rebuildCount])

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

  // Local axes — rotate with the cube, labeled T/B/L/R
  useEffect(() => {
    const b = instanceRef.current
    if (!b) return
    const world = b.getWorldContainer()
    if (!world) return

    // Remove existing axes
    world.querySelectorAll('.axis-line').forEach((el) => el.remove())

    if (!controls.showAxis) return

    // Half the extent of the grid, plus some padding
    const maxDim = Math.max(controls.sizeX, controls.sizeY, controls.sizeZ)
    const halfLen = maxDim * (controls.boxelSize + controls.gap) * 0.8

    // Add to worldEl — this rotates with the scene so the labels
    // track the cube's top/bottom/left/right orientation
    world.appendChild(createLocalAxes(halfLen))

    return () => {
      world.querySelectorAll('.axis-line').forEach((el) => el.remove())
    }
  }, [controls.showAxis, controls.sizeX, controls.sizeY, controls.sizeZ, controls.boxelSize, controls.gap, rebuildCount])

  useEffect(() => {
    if (explodeTrigger > lastExplode.current) {
      instanceRef.current?.animateGap({ from: controls.gap, to: 10, duration: 800 })
    }
    lastExplode.current = explodeTrigger
  }, [explodeTrigger])

  // Auto-rotate — reads current rotation each frame so orbit drag composes with spin
  useEffect(() => {
    if (!controls.spinX && !controls.spinY) return
    const b = instanceRef.current
    if (!b) return

    const speed = controls.spinSpeed * 0.3
    let rafId: number

    const tick = () => {
      // Read the latest angles (includes any orbit drag changes since last frame)
      const current = b.getRotation()
      let rx = current.rotX
      let ry = current.rotY
      if (controls.spinX) rx += speed * controls.spinXDir
      if (controls.spinY) ry += speed * controls.spinYDir
      b.updateTransform(rx, ry)
      rotRef.current.rotX = rx
      rotRef.current.rotY = ry
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

  const dynamicCode = code ?? generateCode(controls)

  return (
    <div className="example-page">
      <div className="scene-area">
        <div className="scene-header">
          <span className="scene-title">{title}</span>
          <span className="scene-desc">{description}</span>
        </div>
        <div ref={containerRef} className="scene-container" />
      </div>
      <div className="code-drawer">
        <CodeBlock code={dynamicCode} />
      </div>
    </div>
  )
}
