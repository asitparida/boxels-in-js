import { useRef, useEffect, useState } from 'react'
import { Boxels, type FaceName } from 'boxels'

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

export function ImageExample() {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<Boxels | null>(null)
  const [mode, setMode] = useState<Mode>('landscape')

  useEffect(() => {
    if (!containerRef.current) return

    const b = new Boxels({
      boxelSize: 80,
      gap: 2,
      edgeWidth: 1,
      camera: { rotation: [-25, 35] },
      style: { default: { fill: '#1a1a2e', stroke: '#333' } },
    })

    b.addBox({ position: [0, 0, 0], size: [3, 3, 3] })
    b.mount(containerRef.current)

    if (mode === 'landscape') {
      b.mapImage(landscapeUrl)
    } else {
      // Map a different icon to each face
      for (const [face, iconUrl] of Object.entries(FACE_ICONS)) {
        b.mapImage(iconUrl, face as FaceName)
      }
    }

    instanceRef.current = b

    return () => {
      b.unmount()
      instanceRef.current = null
    }
  }, [mode])

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
