import type { BoxelStyle } from '../types'

export type TextureName = 'solid' | 'hollow' | 'glass' | 'frosted' | 'matte' | 'glossy' | 'neon' | 'paper' | 'metal' | 'hologram'

export const ALL_TEXTURES: TextureName[] = [
  'solid', 'hollow', 'glass', 'frosted', 'matte', 'glossy', 'neon', 'paper', 'metal', 'hologram',
]

/**
 * Generate a BoxelStyle for a given texture and hue.
 * Hue (0-360) controls the base color. Opacity (0-1) is an additional multiplier.
 */
export function createTextureStyle(
  texture: TextureName,
  hue: number,
  opacity: number = 1,
  w: number = 1,
  h: number = 1,
  d: number = 1,
): BoxelStyle {
  const op = opacity

  switch (texture) {
    case 'solid':
      return {
        default: {
          fill: `oklch(0.65 0.15 ${hue})`,
          stroke: `oklch(0.45 0.12 ${hue})`,
          opacity: op,
        },
      }

    case 'hollow':
      return {
        default: {
          fill: 'transparent',
          stroke: `oklch(0.7 0.15 ${hue})`,
          opacity: op,
        },
      }

    case 'glass':
      return {
        default: {
          fill: `oklch(0.8 0.06 ${hue} / ${0.15 * op})`,
          stroke: `oklch(0.5 0.08 ${hue} / ${0.4 * op})`,
          opacity: Math.min(op, 0.85),
          backdropFilter: `blur(${Math.round(4 * op)}px)`,
        },
      }

    case 'frosted':
      return {
        default: {
          fill: `oklch(0.9 0.02 ${hue} / ${0.4 * op})`,
          stroke: `oklch(0.7 0.04 ${hue} / ${0.3 * op})`,
          opacity: Math.min(op, 0.9),
          backdropFilter: `blur(${Math.round(12 * op)}px)`,
        },
      }

    case 'matte':
      return {
        default: {
          fill: `oklch(0.6 0.1 ${hue})`,
          stroke: 'transparent',
          opacity: op,
        },
      }

    case 'glossy':
      return {
        default: (x: number, y: number, _z: number) => {
          const highlight = 0.55 + (y / Math.max(h, 1)) * 0.3
          return {
            fill: `oklch(${highlight} 0.18 ${hue})`,
            stroke: `oklch(${highlight + 0.1} 0.05 ${hue})`,
            opacity: op,
          }
        },
      }

    case 'neon':
      return {
        default: {
          fill: `oklch(0.15 0.02 ${hue} / ${0.9 * op})`,
          stroke: `oklch(0.85 0.25 ${hue})`,
          opacity: op,
        },
      }

    case 'paper':
      return {
        default: (x: number, y: number, z: number) => {
          const noise = Math.sin(x * 12.98 + y * 78.23 + z * 37.71) * 43758.54
          const grain = (noise - Math.floor(noise)) * 0.06
          const lightness = 0.88 + grain
          return {
            fill: `oklch(${lightness} 0.015 ${hue})`,
            stroke: `oklch(${lightness - 0.1} 0.02 ${hue})`,
            opacity: op,
          }
        },
      }

    case 'metal':
      return {
        default: (x: number, y: number, _z: number) => {
          const gradient = 0.4 + (y / Math.max(h, 1)) * 0.35
          const shimmer = Math.sin(x * 2.5) * 0.05
          return {
            fill: `oklch(${gradient + shimmer} 0.03 ${hue})`,
            stroke: `oklch(${gradient - 0.1} 0.05 ${hue})`,
            opacity: op,
          }
        },
      }

    case 'hologram': {
      return {
        default: (x: number, y: number, z: number) => {
          const shift = ((x + y + z) / Math.max(w + h + d, 1)) * 120
          const h2 = (hue + shift) % 360
          return {
            fill: `oklch(0.7 0.15 ${h2} / ${0.3 * op})`,
            stroke: `oklch(0.6 0.1 ${h2} / ${0.5 * op})`,
            opacity: Math.min(op, 0.7),
            backdropFilter: `blur(${Math.round(2 * op)}px)`,
          }
        },
      }
    }
  }
}
