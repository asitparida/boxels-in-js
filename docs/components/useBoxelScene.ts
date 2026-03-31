import { useRef, useEffect, useCallback, useState } from 'react'
import { Boxels } from 'boxels'
import type { ControlsState } from './ControlsPanel'
import { buildStyle } from './ExamplePage'

function createLabel(text: string, color: string, x: number, y: number): HTMLDivElement {
  const label = document.createElement('div')
  label.className = 'axis-label'
  label.textContent = text
  label.style.position = 'absolute'
  label.style.color = color
  label.style.fontSize = '16px'
  label.style.fontFamily = "'Geist Mono', monospace"
  label.style.fontWeight = '700'
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
  const zColor = 'rgba(100, 255, 160, 0.6)'

  // X axis — Left / Right
  const xLine = document.createElement('div')
  xLine.style.position = 'absolute'
  xLine.style.width = `${halfLen * 2}px`
  xLine.style.height = '2px'
  xLine.style.background = `linear-gradient(90deg, transparent, ${xColor} 10%, ${xColor} 90%, transparent)`
  xLine.style.transform = `translate3d(${-halfLen}px, 0px, 2px)`
  group.appendChild(xLine)
  group.appendChild(createLabel('L', xColor, -halfLen - 22, -10))
  group.appendChild(createLabel('R', xColor, halfLen + 8, -10))

  // Y axis — Top / Bottom
  const yLine = document.createElement('div')
  yLine.style.position = 'absolute'
  yLine.style.width = '2px'
  yLine.style.height = `${halfLen * 2}px`
  yLine.style.background = `linear-gradient(180deg, transparent, ${yColor} 10%, ${yColor} 90%, transparent)`
  yLine.style.transform = `translate3d(0px, ${-halfLen}px, 2px)`
  group.appendChild(yLine)
  group.appendChild(createLabel('T', yColor, -10, -halfLen - 26))
  group.appendChild(createLabel('B', yColor, -10, halfLen + 8))

  // Z axis — Front / Back (rotated into the Z plane)
  const zLine = document.createElement('div')
  zLine.style.position = 'absolute'
  zLine.style.width = `${halfLen * 2}px`
  zLine.style.height = '2px'
  zLine.style.background = `linear-gradient(90deg, transparent, ${zColor} 10%, ${zColor} 90%, transparent)`
  zLine.style.transform = `rotateY(90deg) translate3d(${-halfLen}px, 0px, 0px)`
  group.appendChild(zLine)

  // F label (front = +Z direction)
  const fLabel = createLabel('F', zColor, 0, -10)
  fLabel.style.transform = `translate3d(0px, -10px, ${halfLen + 12}px)`
  group.appendChild(fLabel)

  // Bk label (back = -Z direction)
  const bkLabel = createLabel('Bk', zColor, 0, -10)
  bkLabel.style.transform = `translate3d(0px, -10px, ${-halfLen - 22}px)`
  group.appendChild(bkLabel)

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

export function useBoxelScene(
  containerRef: React.RefObject<HTMLDivElement | null>,
  controls: ControlsState,
  afterMount?: (b: Boxels) => void,
) {
  const instanceRef = useRef<Boxels | null>(null)
  const rotRef = useRef({ rotX: -25, rotY: 35 })
  const [rebuildCount, setRebuildCount] = useState(0)

  const rebuild = useCallback(() => {
    if (!containerRef.current) return

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

    b.addBox({ position: [0, 0, 0], size: [controls.sizeX, controls.sizeY, controls.sizeZ] })
    b.mount(containerRef.current)
    b.updateTransform(rotRef.current.rotX, rotRef.current.rotY)

    if (afterMount) afterMount(b)

    instanceRef.current = b
    setRebuildCount((n) => n + 1)
  }, [controls, afterMount, containerRef])

  // Mount/unmount
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

  // Axis lines
  useEffect(() => {
    const b = instanceRef.current
    if (!b) return
    const world = b.getWorldContainer()
    if (!world) return

    world.querySelectorAll('.axis-line').forEach((el) => el.remove())
    if (!controls.showAxis) return

    const maxDim = Math.max(controls.sizeX, controls.sizeY, controls.sizeZ)
    const halfLen = maxDim * (controls.boxelSize + controls.gap) * 0.8
    world.appendChild(createLocalAxes(halfLen))

    return () => {
      world.querySelectorAll('.axis-line').forEach((el) => el.remove())
    }
  }, [controls.showAxis, controls.sizeX, controls.sizeY, controls.sizeZ, controls.boxelSize, controls.gap, rebuildCount])

  // Spin
  useEffect(() => {
    if (!controls.spinX && !controls.spinY) return
    const b = instanceRef.current
    if (!b) return
    const speed = controls.spinSpeed * 0.3
    let rafId: number
    const tick = () => {
      const cur = b.getRotation()
      let rx = cur.rotX, ry = cur.rotY
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

  // Wheel → boxelSize
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [containerRef])

  return { instanceRef, rebuildCount }
}
