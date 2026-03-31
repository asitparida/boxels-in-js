import type { BoxelStyle } from '../types'

export type TextureName = 'solid' | 'hollow' | 'glass' | 'frosted' | 'neon'

export const ALL_TEXTURES: TextureName[] = [
  'solid', 'hollow', 'glass', 'frosted', 'neon',
]

/**
 * Generate a BoxelStyle for a given texture and hue.
 * Hue (0-360) controls the base color. Opacity (0-1) is an additional multiplier.
 */
export function createTextureStyle(
  texture: TextureName,
  hue: number,
  opacity: number = 1,
  _w: number = 1,
  _h: number = 1,
  _d: number = 1,
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

    case 'neon':
      return {
        default: {
          fill: `oklch(0.15 0.02 ${hue} / ${0.9 * op})`,
          stroke: `oklch(0.85 0.25 ${hue})`,
          opacity: op,
        },
      }

  }
}
