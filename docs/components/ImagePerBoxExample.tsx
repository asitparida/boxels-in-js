import { useRef, useEffect, useCallback, useState } from 'react'
import { Boxels, type FaceName } from 'boxels'
import { type ControlsState } from './ControlsPanel'
import { type ExamplePageProps, buildStyle } from './ExamplePage'

const ALL_FACES: FaceName[] = ['front', 'back', 'left', 'right', 'top', 'bottom']

const FACE_COLORS: Record<FaceName, string> = {
  front:  '#e74c3c',
  back:   '#3498db',
  left:   '#2ecc71',
  right:  '#f39c12',
  top:    '#9b59b6',
  bottom: '#1abc9c',
}

// Generate a numbered tile image for a specific cell
function renderCellTile(
  face: FaceName,
  col: number,
  row: number,
  cols: number,
  rows: number,
  size: number,
): string {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Background with face color
  const baseColor = FACE_COLORS[face]
  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, size, size)

  // Slight variation per cell
  const hueShift = (col * 30 + row * 50) % 60 - 30
  ctx.fillStyle = `hsla(${hueShift}, 40%, 50%, 0.3)`
  ctx.fillRect(0, 0, size, size)

  // Cell label
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = `bold ${Math.round(size * 0.2)}px "Geist Mono", monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const label = `${face[0].toUpperCase()}${col},${row}`
  ctx.fillText(label, size / 2, size / 2)

  // Subtle border
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, size - 2, size - 2)

  return canvas.toDataURL()
}

type Props = Pick<ExamplePageProps, 'controls' | 'onControlsChange' | 'explodeTrigger' | 'collapseTrigger'>

export function ImagePerBoxExample({ controls }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<Boxels | null>(null)
  const rotRef = useRef({ rotX: -25, rotY: 35 })

  const rebuild = useCallback(() => {
    if (!containerRef.current) return

    if (instanceRef.current) {
      const rot = instanceRef.current.getRotation()
      rotRef.current.rotX = rot.rotX
      rotRef.current.rotY = rot.rotY
      instanceRef.current.unmount()
    }

    const { sizeX, sizeY, sizeZ } = controls
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

    b.addBox({ position: [0, 0, 0], size: [sizeX, sizeY, sizeZ] })
    b.mount(containerRef.current)
    b.updateTransform(rotRef.current.rotX, rotRef.current.rotY)

    // Apply unique image to every individual face cell
    const world = b.getWorldContainer()
    if (world) {
      const faceEls = world.querySelectorAll<HTMLElement>('[data-face]')
      faceEls.forEach((faceEl) => {
        const face = faceEl.dataset.face as FaceName
        const boxelEl = faceEl.closest('[data-boxel]') as HTMLElement
        if (!boxelEl) return
        const [x, y, z] = boxelEl.dataset.boxel!.split(',').map(Number)

        // Determine which grid cell this face occupies
        let col = 0, row = 0, cols = 1, rows = 1
        switch (face) {
          case 'front':  col = x; row = sizeY - 1 - y; cols = sizeX; rows = sizeY; break
          case 'back':   col = sizeX - 1 - x; row = sizeY - 1 - y; cols = sizeX; rows = sizeY; break
          case 'left':   col = z; row = sizeY - 1 - y; cols = sizeZ; rows = sizeY; break
          case 'right':  col = sizeZ - 1 - z; row = sizeY - 1 - y; cols = sizeZ; rows = sizeY; break
          case 'top':    col = x; row = z; cols = sizeX; rows = sizeZ; break
          case 'bottom': col = x; row = sizeZ - 1 - z; cols = sizeX; rows = sizeZ; break
        }

        const tile = renderCellTile(face, col, row, cols, rows, 128)
        faceEl.style.backgroundImage = `url(${tile})`
        faceEl.style.backgroundSize = 'cover'
        faceEl.style.backgroundPosition = 'center'
      })
    }

    instanceRef.current = b
  }, [controls])

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

  const { sizeX, sizeY, sizeZ } = controls
  const totalCells = (sizeX * sizeY * 2) + (sizeX * sizeZ * 2) + (sizeY * sizeZ * 2)

  return (
    <div className="example-page">
      <div className="scene-area">
        <div className="scene-header">
          <span className="scene-title">Per Cell</span>
          <span className="scene-desc">
            {totalCells} unique images — one per exposed face cell
          </span>
        </div>
        <div ref={containerRef} className="scene-container" />
      </div>
    </div>
  )
}
