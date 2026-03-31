import { useRef, useEffect, useState, useCallback } from 'react'
import { Boxels, type FaceName } from 'boxels'
import { type ControlsState } from './ControlsPanel'
import { type ExamplePageProps } from './ExamplePage'

import landscapeUrl from '../assets/landscape.jpg'
import iconX from '../assets/icon-x.svg'
import iconInstagram from '../assets/icon-instagram.svg'
import iconGithub from '../assets/icon-github.svg'
import iconLinkedin from '../assets/icon-linkedin.svg'
import iconYoutube from '../assets/icon-youtube.svg'
import iconTiktok from '../assets/icon-tiktok.svg'

type Mode = 'landscape' | 'icons'

const FACE_ICONS: Partial<Record<FaceName, string>> = {
  front: iconX,
  back: iconGithub,
  left: iconInstagram,
  right: iconLinkedin,
  top: iconYoutube,
  bottom: iconTiktok,
}

type Props = Pick<ExamplePageProps, 'controls' | 'onControlsChange' | 'explodeTrigger' | 'collapseTrigger'>

function buildStyle(controls: ControlsState) {
  const { preset, hue, sizeX: w, sizeY: h, sizeZ: d } = controls
  if (preset === 'none') return { default: { fill: '#1a1a2e', stroke: '#333' } } as import('boxels').BoxelStyle

  switch (preset) {
    case 'xray': {
      const cx = w / 2, cy = h / 2, cz = d / 2
      const maxDist = Math.sqrt(cx * cx + cy * cy + cz * cz)
      return {
        default: (x: number, y: number, z: number) => {
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2)
          const opacity = 0.1 + (dist / Math.max(maxDist, 1)) * 0.6
          return { fill: `oklch(0.7 0.12 ${hue})`, stroke: `oklch(0.5 0.12 ${hue})`, opacity }
        },
      }
    }
    default:
      return Boxels.presets[preset as keyof typeof Boxels.presets]?.(w, h, d)
  }
}

export function ImageExample({ controls }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<Boxels | null>(null)
  const [mode, setMode] = useState<Mode>('landscape')
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

    // Apply images after mount
    if (mode === 'landscape') {
      b.mapImage(landscapeUrl)
    } else {
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
            {mode === 'landscape'
              ? 'Landscape distributed across all faces'
              : 'Different icon per face'}
          </span>
          <div className="mode-btns">
            <button
              className={`toggle-btn ${mode === 'landscape' ? 'active' : ''}`}
              onClick={() => setMode('landscape')}
            >
              Landscape
            </button>
            <button
              className={`toggle-btn ${mode === 'icons' ? 'active' : ''}`}
              onClick={() => setMode('icons')}
            >
              Icons
            </button>
          </div>
        </div>
        <div ref={containerRef} className="scene-container" />
      </div>
    </div>
  )
}
