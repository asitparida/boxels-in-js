import { useRef, useEffect, useState, useCallback } from 'react'
import { Boxels, type FaceName } from 'boxels'
import { type ControlsState } from './ControlsPanel'
import { type ExamplePageProps, buildStyle } from './ExamplePage'

import landscapeUrl from '../assets/landscape.jpg'
import iconX from '../assets/icon-x.svg'
import iconInstagram from '../assets/icon-instagram.svg'
import iconGithub from '../assets/icon-github.svg'
import iconLinkedin from '../assets/icon-linkedin.svg'
import iconYoutube from '../assets/icon-youtube.svg'
import iconTiktok from '../assets/icon-tiktok.svg'

type Mode = 'across' | 'per-face'

const FACE_ICONS: Partial<Record<FaceName, string>> = {
  front: iconX,
  back: iconGithub,
  left: iconInstagram,
  right: iconLinkedin,
  top: iconYoutube,
  bottom: iconTiktok,
}

type Props = Pick<ExamplePageProps, 'controls' | 'onControlsChange' | 'explodeTrigger' | 'collapseTrigger'>

export function ImageExample({ controls }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<Boxels | null>(null)
  const [mode, setMode] = useState<Mode>('across')
  const rotRef = useRef({ rotX: -25, rotY: 35 })

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

    if (mode === 'across') {
      // One image sliced across all exposed faces
      b.mapImage(landscapeUrl)
    } else {
      // Different image per face type
      for (const [face, iconUrl] of Object.entries(FACE_ICONS)) {
        b.mapImage(iconUrl, face as FaceName)
      }
    }

    instanceRef.current = b
  }, [controls, mode])

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

    const current = b.getRotation()
    rotRef.current.rotX = current.rotX
    rotRef.current.rotY = current.rotY
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

  return (
    <div className="example-page">
      <div className="scene-area">
        <div className="scene-header">
          <span className="scene-title">Image Mapping</span>
          <span className="scene-desc">
            {mode === 'across'
              ? 'One image sliced across all faces'
              : 'Different image per face'}
          </span>
          <div className="mode-btns">
            <button
              className={`toggle-btn ${mode === 'across' ? 'active' : ''}`}
              onClick={() => setMode('across')}
            >
              Across
            </button>
            <button
              className={`toggle-btn ${mode === 'per-face' ? 'active' : ''}`}
              onClick={() => setMode('per-face')}
            >
              Per Face
            </button>
          </div>
        </div>
        <div ref={containerRef} className="scene-container" />
      </div>
    </div>
  )
}
