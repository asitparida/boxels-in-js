import { useRef, useEffect, useCallback, useState } from 'react'
import { Boxels } from 'boxels'
import type { ControlsState } from './ControlsPanel'
import { buildStyle } from './ExamplePage'

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

  // Spin
  useEffect(() => {
    if (!controls.spinX && !controls.spinY) return
    const b = instanceRef.current
    if (!b) return
    const speed = controls.spinSpeed * 0.5
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

  return { instanceRef, rebuildCount }
}
