import { useRef, useEffect, useState, useCallback } from 'react'
import { type FaceName } from 'boxels'
import { type ExamplePageProps } from './ExamplePage'
import { useBoxelScene } from './useBoxelScene'

import iconX from '../assets/icon-x.svg'
import iconInstagram from '../assets/icon-instagram.svg'
import iconGithub from '../assets/icon-github.svg'
import iconLinkedin from '../assets/icon-linkedin.svg'
import iconYoutube from '../assets/icon-youtube.svg'
import iconTiktok from '../assets/icon-tiktok.svg'

const FACE_ICONS: Record<FaceName, { icon: string; bg: string }> = {
  front:  { icon: iconX,         bg: '#000000' },
  back:   { icon: iconGithub,    bg: '#24292e' },
  left:   { icon: iconInstagram, bg: '#E4405F' },
  right:  { icon: iconLinkedin,  bg: '#0A66C2' },
  top:    { icon: iconYoutube,   bg: '#FF0000' },
  bottom: { icon: iconTiktok,    bg: '#010101' },
}

function renderIconToDataUrl(svgUrl: string, bgColor: string, size: number): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, size, size)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const pad = size * 0.25
      ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2)
      resolve(canvas.toDataURL())
    }
    img.onerror = () => resolve(canvas.toDataURL())
    img.src = svgUrl
  })
}

type Props = Pick<ExamplePageProps, 'controls' | 'onControlsChange' | 'explodeTrigger' | 'collapseTrigger'>

export function ImagePerFaceExample({ controls }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [iconCache, setIconCache] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    const renderAll = async () => {
      const cache: Record<string, string> = {}
      for (const [face, { icon, bg }] of Object.entries(FACE_ICONS)) {
        cache[face] = await renderIconToDataUrl(icon, bg, 256)
      }
      setIconCache(cache)
    }
    renderAll()
  }, [])

  const afterMount = useCallback((b: import('boxels').Boxels) => {
    if (!iconCache) return
    for (const [face, dataUrl] of Object.entries(iconCache)) {
      b.mapImage(dataUrl, face as FaceName)
    }
  }, [iconCache])

  useBoxelScene(containerRef, controls, afterMount)

  return (
    <div className="example-page">
      <div className="scene-area">
        <div className="scene-header">
          <span className="scene-title">Per Face</span>
          <span className="scene-desc">Different icon on each face — X, GitHub, Instagram, LinkedIn, YouTube, TikTok</span>
        </div>
        <div ref={containerRef} className="scene-container" />
      </div>
    </div>
  )
}
