import { useRef, useEffect, useCallback, useState } from 'react'
import { Boxels, type TextureName } from 'boxels'
import type { ControlsState } from './ControlsPanel'

const positionMap: Record<string, { top: string; left: string }> = {
  'top-center':    { top: '25%', left: '50%' },
  'center-left':   { top: '50%', left: '25%' },
  'center':        { top: '50%', left: '50%' },
  'center-right':  { top: '50%', left: '75%' },
  'bottom-center': { top: '75%', left: '50%' },
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
      instanceRef.current.stopSpin()
      instanceRef.current.unmount()
    }

    // Construct with structural options only
    const b = new Boxels({
      boxelSize: controls.boxelSize,
      gap: controls.gap,
      edgeWidth: controls.edgeWidth,
      camera: { rotation: [-25, 35] },
      showBackfaces: controls.backfaces,
      zoom: false,
    })

    // Geometry
    b.addBox({ position: [0, 0, 0], size: [controls.sizeX, controls.sizeY, controls.sizeZ] })

    // Mount
    b.mount(containerRef.current)

    // Texture via API
    b.setTexture(controls.texture as TextureName, controls.hue, controls.opacity / 100)

    // Restore rotation
    b.updateTransform(rotRef.current.rotX, rotRef.current.rotY)

    // Position
    const pos = positionMap[controls.positionPreset] ?? positionMap['center']
    const world = b.getWorldContainer()
    if (world) {
      world.style.top = pos.top
      world.style.left = pos.left
    }

    // Custom post-mount (image mapping etc)
    if (afterMount) afterMount(b)

    // Image from controls
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
        console.log(`Clicked ${face} face at [${boxel.join(', ')}]`)
      })
    }

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
        instanceRef.current.stopSpin()
        instanceRef.current.unmount()
        instanceRef.current = null
      }
    }
  }, [rebuild])

  return { instanceRef, rebuildCount }
}
