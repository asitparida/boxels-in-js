import { useRef, useEffect, useCallback, useState } from 'react'
import { Boxels, type BoxelStyle, type TextureName } from 'boxels'
import { createTextureStyle } from '../../src/lib/core/textures'
import { type ControlsState } from './ControlsPanel'
import { CodeDrawer } from './CodeDrawer'

export function buildStyle(controls: ControlsState): BoxelStyle {
  const { texture, hue, opacity: opPct, sizeX: w, sizeY: h, sizeZ: d } = controls
  return createTextureStyle(texture as TextureName, hue, opPct / 100, w, h, d)
}

export function generateCode(controls: ControlsState, extra?: string): string {
  const lines: string[] = []
  lines.push(`import { Boxels } from 'boxels'`)
  lines.push('')
  lines.push(`const b = new Boxels({`)
  lines.push(`  boxelSize: ${controls.boxelSize},`)
  lines.push(`  gap: ${controls.gap},`)
  lines.push(`  edgeWidth: ${controls.edgeWidth},`)
  lines.push(`  camera: { rotation: [-25, 35] },`)
  if (controls.backfaces) lines.push(`  showBackfaces: true,`)
  lines.push(`})`)
  lines.push('')
  lines.push(`b.addBox({ position: [0, 0, 0], size: [${controls.sizeX}, ${controls.sizeY}, ${controls.sizeZ}] })`)
  lines.push(`b.mount(document.getElementById('scene'))`)
  lines.push(`b.setTexture('${controls.texture}', ${controls.hue}, ${(controls.opacity / 100).toFixed(2)})`)
  if (controls.showAxis) lines.push(`b.showAxes()`)
  if (controls.spinX || controls.spinY) {
    const opts: string[] = []
    if (controls.spinX) opts.push(`x: true`)
    if (controls.spinY) opts.push(`y: true`)
    if (controls.spinX && controls.spinXDir === -1) opts.push(`xDir: -1`)
    if (controls.spinY && controls.spinYDir === -1) opts.push(`yDir: -1`)
    if (controls.spinSpeed !== 1) opts.push(`speed: ${controls.spinSpeed}`)
    lines.push(`b.startSpin({ ${opts.join(', ')} })`)
  }
  if (extra) { lines.push(''); lines.push(extra) }
  return lines.join('\n')
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
  const [showCode, setShowCode] = useState(true)
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
      style: setup ? undefined : style,
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

  // Position preset
  useEffect(() => {
    const b = instanceRef.current
    if (!b) return
    const world = b.getWorldContainer()
    if (!world) return
    const map: Record<string, { top: string; left: string }> = {
      'top-left': { top: '25%', left: '25%' }, 'top-center': { top: '25%', left: '50%' }, 'top-right': { top: '25%', left: '75%' },
      'center-left': { top: '50%', left: '25%' }, 'center': { top: '50%', left: '50%' }, 'center-right': { top: '50%', left: '75%' },
      'bottom-left': { top: '75%', left: '25%' }, 'bottom-center': { top: '75%', left: '50%' }, 'bottom-right': { top: '75%', left: '75%' },
    }
    const pos = map[controls.positionPreset] ?? map['center']
    world.style.top = pos.top
    world.style.left = pos.left
  }, [controls.positionPreset, rebuildCount])

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
  // Axes via library API
  useEffect(() => {
    const b = instanceRef.current
    if (!b) return
    if (controls.showAxis) {
      b.showAxes()
    } else {
      b.hideAxes()
    }
    return () => b.hideAxes()
  }, [controls.showAxis, rebuildCount])

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
          <button
            className="code-toggle"
            onClick={() => setShowCode(!showCode)}
          >
            {showCode ? 'Hide code' : 'Show code'}
          </button>
        </div>
        <div ref={containerRef} className="scene-container" />
      </div>
      <CodeDrawer code={dynamicCode} visible={showCode} />
    </div>
  )
}
