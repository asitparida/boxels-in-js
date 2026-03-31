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
  // Texture
  lines.push(`b.setTexture('${controls.texture}', ${controls.hue}, ${(controls.opacity / 100).toFixed(2)})`)
  // Position
  if (controls.positionPreset !== 'center') {
    lines.push(`b.setPosition({ x: '${positionMap[controls.positionPreset]?.left ?? '50%'}', y: '${positionMap[controls.positionPreset]?.top ?? '50%'}' })`)
  }
  // Image
  if (controls.imageDataUrl) {
    if (controls.imageFace === 'all') {
      lines.push(`b.mapImage('image.jpg')`)
    } else {
      lines.push(`b.mapImage('image.jpg', '${controls.imageFace}')`)
    }
  }
  // Axes
  if (controls.showAxis) lines.push(`b.showAxes()`)
  // Spin
  if (controls.spinX || controls.spinY) {
    const opts: string[] = []
    if (controls.spinX) opts.push(`x: true`)
    if (controls.spinY) opts.push(`y: true`)
    if (controls.spinX && controls.spinXDir === -1) opts.push(`xDir: -1`)
    if (controls.spinY && controls.spinYDir === -1) opts.push(`yDir: -1`)
    if (controls.spinSpeed !== 1) opts.push(`speed: ${controls.spinSpeed}`)
    lines.push(`b.startSpin({ ${opts.join(', ')} })`)
  }
  // Click
  if (controls.clickEnabled) {
    lines.push(`b.enableClick(({ boxel, face }) => {`)
    lines.push(`  console.log(\`Clicked \${face} face at [\${boxel}]\`)`)
    lines.push(`})`)
  }
  if (extra) { lines.push(''); lines.push(extra) }
  return lines.join('\n')
}

const positionMap: Record<string, { top: string; left: string }> = {
  'top-center':    { top: '25%', left: '50%' },
  'center-left':   { top: '50%', left: '25%' },
  'center':        { top: '50%', left: '50%' },
  'center-right':  { top: '50%', left: '75%' },
  'bottom-center': { top: '75%', left: '50%' },
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
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  const rebuild = useCallback(() => {
    if (!containerRef.current) return

    if (instanceRef.current) {
      const rot = instanceRef.current.getRotation()
      rotRef.current.rotX = rot.rotX
      rotRef.current.rotY = rot.rotY
      instanceRef.current.stopSpin()
      instanceRef.current.unmount()
    }

    // Construct with only structural options — no style
    const b = new Boxels({
      boxelSize: controls.boxelSize,
      gap: controls.gap,
      edgeWidth: controls.edgeWidth,
      camera: { rotation: [-25, 35] },
      showBackfaces: controls.backfaces,
      zoom: false,
    })

    // Geometry
    if (setup) {
      setup(b, controls)
    } else {
      b.addBox({ position: [0, 0, 0], size: [controls.sizeX, controls.sizeY, controls.sizeZ] })
    }

    // Mount
    b.mount(containerRef.current)

    // Texture via API (unless setup handles its own style)
    if (!setup) {
      b.setTexture(controls.texture as TextureName, controls.hue, controls.opacity / 100)
    }

    // Restore rotation
    b.updateTransform(rotRef.current.rotX, rotRef.current.rotY)

    // Position via API
    const pos = positionMap[controls.positionPreset] ?? positionMap['center']
    const world = b.getWorldContainer()
    if (world) {
      world.style.top = pos.top
      world.style.left = pos.left
    }

    // Image via API
    if (controls.imageDataUrl) {
      const targetFace = controls.imageFace === 'all' ? undefined : controls.imageFace
      b.mapImage(controls.imageDataUrl, targetFace as import('boxels').FaceName | undefined)
    }

    // Axes via API
    if (controls.showAxis) b.showAxes()

    // Spin via API (only if click is not enabled)
    if ((controls.spinX || controls.spinY) && !controls.clickEnabled) {
      b.startSpin({
        x: controls.spinX,
        y: controls.spinY,
        xDir: controls.spinXDir,
        yDir: controls.spinYDir,
        speed: controls.spinSpeed,
      })
    }

    // Click via API
    if (controls.clickEnabled) {
      b.enableClick(({ boxel, face }) => {
        const msg = `Clicked ${face} face at [${boxel.join(', ')}]`
        setToast(msg)
        clearTimeout(toastTimer.current)
        toastTimer.current = setTimeout(() => setToast(null), 3000)
      })
    }

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
        instanceRef.current.stopSpin()
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

  useEffect(() => {
    if (explodeTrigger > lastExplode.current) {
      instanceRef.current?.animateGap({ from: controls.gap, to: 10, duration: 800 })
    }
    lastExplode.current = explodeTrigger
  }, [explodeTrigger])

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
      {toast && (
        <div className="boxel-toast">
          <span>{toast}</span>
          <button onClick={() => setToast(null)}>&times;</button>
        </div>
      )}
    </div>
  )
}
