import { useRef, useEffect, useCallback, useState } from 'react'
import { Boxels, type FaceName } from 'boxels'
import { type ControlsState } from './ControlsPanel'
import { type ExamplePageProps, buildStyle } from './ExamplePage'

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
  const instanceRef = useRef<Boxels | null>(null)
  const rotRef = useRef({ rotX: -25, rotY: 35 })
  // Pre-render icons to data URLs once, then reuse
  const [iconCache, setIconCache] = useState<Record<string, string> | null>(null)

  // Pre-render all icons on first mount
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

  const rebuild = useCallback(() => {
    if (!containerRef.current || !iconCache) return

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

    // Apply cached icons to faces
    for (const [face, dataUrl] of Object.entries(iconCache)) {
      b.mapImage(dataUrl, face as FaceName)
    }

    instanceRef.current = b
  }, [controls, iconCache])

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
