import type { BoxelStyle, FaceStyle, FaceStyleOrFn, FaceName, ResolvedFaceStyle, StyleValue } from '../types'

const LIBRARY_FALLBACK: ResolvedFaceStyle = {
  fill: '#ddd',
  stroke: '#333',
  opacity: 1,
}

function evaluateStyleValue(value: StyleValue, x: number, y: number, z: number): string {
  return typeof value === 'function' ? value(x, y, z) : value
}

function evaluateFaceStyleOrFn(
  styleOrFn: FaceStyleOrFn | undefined,
  x: number,
  y: number,
  z: number,
): FaceStyle | undefined {
  if (styleOrFn === undefined) return undefined
  if (typeof styleOrFn === 'function') return styleOrFn(x, y, z)
  return styleOrFn
}

function resolveFaceStyle(style: FaceStyle | undefined, x: number, y: number, z: number): Partial<ResolvedFaceStyle> {
  if (!style) return {}
  const result: Partial<ResolvedFaceStyle> = {}
  if (style.fill !== undefined) result.fill = evaluateStyleValue(style.fill, x, y, z)
  if (style.stroke !== undefined) result.stroke = evaluateStyleValue(style.stroke, x, y, z)
  if (style.opacity !== undefined) result.opacity = style.opacity
  if (style.className !== undefined) result.className = style.className
  if (style.backdropFilter !== undefined) result.backdropFilter = style.backdropFilter
  return result
}

export function resolveStyle(
  face: FaceName,
  x: number,
  y: number,
  z: number,
  boxelStyle?: BoxelStyle,
  globalStyle?: BoxelStyle,
): ResolvedFaceStyle {
  const result: ResolvedFaceStyle = { ...LIBRARY_FALLBACK }

  // Layer 3: constructor default
  if (globalStyle) {
    const globalDefault = evaluateFaceStyleOrFn(globalStyle.default, x, y, z)
    Object.assign(result, resolveFaceStyle(globalDefault, x, y, z))

    const globalFace = evaluateFaceStyleOrFn(globalStyle[face], x, y, z)
    Object.assign(result, resolveFaceStyle(globalFace, x, y, z))
  }

  // Layer 2: boxel default + Layer 1: face-specific
  if (boxelStyle) {
    const boxelDefault = evaluateFaceStyleOrFn(boxelStyle.default, x, y, z)
    Object.assign(result, resolveFaceStyle(boxelDefault, x, y, z))

    const boxelFace = evaluateFaceStyleOrFn(boxelStyle[face], x, y, z)
    Object.assign(result, resolveFaceStyle(boxelFace, x, y, z))
  }

  return result
}
