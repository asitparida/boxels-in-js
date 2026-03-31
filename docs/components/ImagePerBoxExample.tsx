import { useRef, useEffect, useState, useCallback } from 'react'
import { type FaceName } from 'boxels'
import { type ExamplePageProps, generateCode } from './ExamplePage'
import { CodeDrawer } from './CodeDrawer'
import { useBoxelScene } from './useBoxelScene'

// Import all icons
import iconX from '../assets/icon-x.svg'
import iconInstagram from '../assets/icon-instagram.svg'
import iconGithub from '../assets/icon-github.svg'
import iconLinkedin from '../assets/icon-linkedin.svg'
import iconYoutube from '../assets/icon-youtube.svg'
import iconTiktok from '../assets/icon-tiktok.svg'
import iconDiscord from '../assets/icon-discord.svg'
import iconSlack from '../assets/icon-slack.svg'
import iconReddit from '../assets/icon-reddit.svg'
import iconSpotify from '../assets/icon-spotify.svg'
import iconTwitch from '../assets/icon-twitch.svg'
import iconPinterest from '../assets/icon-pinterest.svg'
import iconSnapchat from '../assets/icon-snapchat.svg'
import iconTelegram from '../assets/icon-telegram.svg'
import iconWhatsapp from '../assets/icon-whatsapp.svg'
import iconMedium from '../assets/icon-medium.svg'
import iconDribbble from '../assets/icon-dribbble.svg'
import iconBehance from '../assets/icon-behance.svg'
import iconFigma from '../assets/icon-figma.svg'
import iconNotion from '../assets/icon-notion.svg'
import iconThreads from '../assets/icon-threads.svg'
import iconMastodon from '../assets/icon-mastodon.svg'
import iconBluesky from '../assets/icon-bluesky.svg'
import iconSignal from '../assets/icon-signal.svg'

const ALL_ICONS = [
  iconX, iconInstagram, iconGithub, iconLinkedin, iconYoutube, iconTiktok,
  iconDiscord, iconSlack, iconReddit, iconSpotify, iconTwitch, iconPinterest,
  iconSnapchat, iconTelegram, iconWhatsapp, iconMedium, iconDribbble, iconBehance,
  iconFigma, iconNotion, iconThreads, iconMastodon, iconBluesky, iconSignal,
]

// Each face type gets a consistent background color
const FACE_COLORS: Record<FaceName, string> = {
  front:  '#1a1a2e',
  back:   '#16213e',
  left:   '#0f3460',
  right:  '#1a1a40',
  top:    '#2d132c',
  bottom: '#0d0d0d',
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
      const pad = size * 0.2
      ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2)
      resolve(canvas.toDataURL())
    }
    img.onerror = () => resolve(canvas.toDataURL())
    img.src = svgUrl
  })
}

type Props = Pick<ExamplePageProps, 'controls' | 'onControlsChange' | 'explodeTrigger' | 'collapseTrigger'>

export function ImagePerBoxExample({ controls }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showCode, setShowCode] = useState(true)
  const [tileCache, setTileCache] = useState<Map<string, string> | null>(null)

  // Pre-render all icon+color combos we might need
  useEffect(() => {
    const renderAll = async () => {
      const cache = new Map<string, string>()
      const faces = Object.keys(FACE_COLORS) as FaceName[]
      for (let i = 0; i < ALL_ICONS.length; i++) {
        for (const face of faces) {
          const key = `${i}-${face}`
          cache.set(key, await renderIconToDataUrl(ALL_ICONS[i], FACE_COLORS[face], 128))
        }
      }
      setTileCache(cache)
    }
    renderAll()
  }, [])

  const afterMount = useCallback((b: import('boxels').Boxels) => {
    if (!tileCache) return
    const world = b.getWorldContainer()
    if (!world) return

    const faceEls = world.querySelectorAll<HTMLElement>('[data-face]')
    let cellIndex = 0

    faceEls.forEach((faceEl) => {
      const face = faceEl.dataset.face as FaceName
      const iconIdx = cellIndex % ALL_ICONS.length
      const key = `${iconIdx}-${face}`
      const dataUrl = tileCache.get(key)
      if (dataUrl) {
        faceEl.style.backgroundImage = `url(${dataUrl})`
        faceEl.style.backgroundSize = 'cover'
        faceEl.style.backgroundPosition = 'center'
      }
      cellIndex++
    })
  }, [tileCache])

  useBoxelScene(containerRef, controls, afterMount)

  const { sizeX, sizeY, sizeZ } = controls
  const totalCells = (sizeX * sizeY * 2) + (sizeX * sizeZ * 2) + (sizeY * sizeZ * 2)

  const code = generateCode(controls, `// Map unique image per cell
b.mapImagePerCell(icons)`)

  return (
    <div className="example-page">
      <div className="scene-area">
        <div className="scene-header">
          <span className="scene-title">Per Cell</span>
          <span className="scene-desc">
            {totalCells} cells — {ALL_ICONS.length} social icons distributed
          </span>
          <button className="code-toggle" onClick={() => setShowCode(!showCode)}>
            {showCode ? 'Hide code' : 'Show code'}
          </button>
        </div>
        <div ref={containerRef} className="scene-container" />
      </div>
      <CodeDrawer code={code} visible={showCode} />
    </div>
  )
}
