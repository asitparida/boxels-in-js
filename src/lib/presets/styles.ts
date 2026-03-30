import type { BoxelStyle } from '../types'

export const presets = {
  heerich(_w: number, _h: number, _d: number): BoxelStyle {
    return {
      default: (_x: number, y: number, _z: number) => {
        const base = 0.75 + y * 0.02
        return {
          fill: `oklch(${base} 0.03 80)`,
          stroke: `oklch(${base - 0.15} 0.03 80)`,
        }
      },
      top: { fill: `oklch(0.85 0.02 80)`, stroke: `oklch(0.65 0.03 80)` },
    }
  },

  rubik(_w: number, _h: number, _d: number): BoxelStyle {
    return {
      default: { fill: '#111', stroke: '#000' },
      top: { fill: '#ffff00', stroke: '#333' },
      bottom: { fill: '#ffffff', stroke: '#333' },
      front: { fill: '#ff0000', stroke: '#333' },
      back: { fill: '#ff8c00', stroke: '#333' },
      left: { fill: '#00ff00', stroke: '#333' },
      right: { fill: '#0000ff', stroke: '#333' },
    }
  },

  gradient(w: number, h: number, d: number): BoxelStyle {
    return {
      default: (x: number, y: number, z: number) => {
        const hue = (x / Math.max(w, 1)) * 360
        const lightness = 0.4 + (y / Math.max(h, 1)) * 0.4
        const chroma = 0.1 + (z / Math.max(d, 1)) * 0.1
        return {
          fill: `oklch(${lightness} ${chroma} ${hue})`,
          stroke: `oklch(${lightness - 0.1} ${chroma} ${hue})`,
        }
      },
    }
  },

  wireframe(_w: number, _h: number, _d: number): BoxelStyle {
    return {
      default: {
        fill: 'transparent',
        stroke: '#666',
        opacity: 1,
      },
    }
  },

  xray(w: number, h: number, d: number): BoxelStyle {
    const cx = w / 2
    const cy = h / 2
    const cz = d / 2
    const maxDist = Math.sqrt(cx * cx + cy * cy + cz * cz)
    return {
      default: (x: number, y: number, z: number) => {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2)
        const opacity = 0.1 + (dist / Math.max(maxDist, 1)) * 0.6
        return {
          fill: `oklch(0.7 0.12 220)`,
          stroke: `oklch(0.5 0.12 220)`,
          opacity,
        }
      },
    }
  },

  glass(_w: number, _h: number, _d: number): BoxelStyle {
    return {
      default: {
        fill: 'rgba(200, 220, 240, 0.15)',
        stroke: 'rgba(100, 140, 180, 0.4)',
        opacity: 0.8,
        backdropFilter: 'blur(4px)',
      },
    }
  },

  marble(_w: number, _h: number, _d: number): BoxelStyle {
    return {
      default: (x: number, y: number, z: number) => {
        const noise = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453
        const vein = (noise - Math.floor(noise)) * 0.08
        const lightness = 0.88 + vein
        return {
          fill: `oklch(${lightness} 0.005 90)`,
          stroke: `oklch(${lightness - 0.12} 0.01 90)`,
        }
      },
    }
  },

  neon(_w: number, _h: number, _d: number): BoxelStyle {
    return {
      default: {
        fill: 'rgba(10, 10, 15, 0.9)',
        stroke: '#0ff',
        opacity: 1,
      },
    }
  },
}
