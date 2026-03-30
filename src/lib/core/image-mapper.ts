import type { FaceName, Vec3 } from '../types'
import type { BoxelGrid } from './grid'
import { getExposedFaces } from './edge-fusion'

export interface ImageMapResult {
  position: Vec3
  face: FaceName
  backgroundImage: string
  backgroundPosition: string
  backgroundSize: string
}

const CROSS_LAYOUT: Record<FaceName, { row: number; col: number }> = {
  top:    { row: 0, col: 1 },
  left:   { row: 1, col: 0 },
  front:  { row: 1, col: 1 },
  right:  { row: 1, col: 2 },
  back:   { row: 1, col: 3 },
  bottom: { row: 2, col: 1 },
}

const STRIP_ORDER: FaceName[] = ['front', 'back', 'left', 'right', 'top', 'bottom']

function getFaceUV(
  face: FaceName,
  x: number, y: number, z: number,
  min: Vec3,
  w: number, h: number, d: number,
): { u: number; v: number; gridW: number; gridH: number } {
  const rx = x - min[0]
  const ry = y - min[1]
  const rz = z - min[2]

  switch (face) {
    case 'front':  return { u: rx, v: h - 1 - ry, gridW: w, gridH: h }
    case 'back':   return { u: w - 1 - rx, v: h - 1 - ry, gridW: w, gridH: h }
    case 'left':   return { u: rz, v: h - 1 - ry, gridW: d, gridH: h }
    case 'right':  return { u: d - 1 - rz, v: h - 1 - ry, gridW: d, gridH: h }
    case 'top':    return { u: rx, v: rz, gridW: w, gridH: d }
    case 'bottom': return { u: rx, v: d - 1 - rz, gridW: w, gridH: d }
  }
}

export function mapImageToFaces(
  grid: BoxelGrid,
  img: HTMLImageElement | HTMLCanvasElement,
  layout: 'cross' | 'strip' | 'per-face',
  faces?: Partial<Record<FaceName, HTMLImageElement | HTMLCanvasElement>>,
): ImageMapResult[] {
  const results: ImageMapResult[] = []
  const bounds = grid.getBounds()
  const w = bounds.max[0] - bounds.min[0] + 1
  const h = bounds.max[1] - bounds.min[1] + 1
  const d = bounds.max[2] - bounds.min[2] + 1

  grid.forEach((_boxel, pos) => {
    const [x, y, z] = pos
    const exposed = getExposedFaces(grid, x, y, z)

    for (const face of exposed) {
      let faceImg: HTMLImageElement | HTMLCanvasElement = img

      if (layout === 'per-face' && faces?.[face]) {
        faceImg = faces[face]!
        const { u, v, gridW, gridH } = getFaceUV(face, x, y, z, bounds.min, w, h, d)
        const src = faceImg instanceof HTMLCanvasElement
          ? faceImg.toDataURL()
          : faceImg.src

        results.push({
          position: pos,
          face,
          backgroundImage: `url(${src})`,
          backgroundPosition: `${(u / gridW) * 100}% ${(v / gridH) * 100}%`,
          backgroundSize: `${gridW * 100}% ${gridH * 100}%`,
        })
      } else if (layout === 'cross') {
        const facePos = CROSS_LAYOUT[face]
        const { u, v, gridW, gridH } = getFaceUV(face, x, y, z, bounds.min, w, h, d)
        const cellW = 1 / 4
        const cellH = 1 / 3
        const bgX = (facePos.col + u / gridW) * cellW
        const bgY = (facePos.row + v / gridH) * cellH

        const src = faceImg instanceof HTMLCanvasElement
          ? faceImg.toDataURL()
          : faceImg.src

        results.push({
          position: pos,
          face,
          backgroundImage: `url(${src})`,
          backgroundPosition: `${bgX * 100}% ${bgY * 100}%`,
          backgroundSize: `${(1 / cellW) * gridW * 100}% ${(1 / cellH) * gridH * 100}%`,
        })
      } else if (layout === 'strip') {
        const faceIndex = STRIP_ORDER.indexOf(face)
        const { u, v, gridW, gridH } = getFaceUV(face, x, y, z, bounds.min, w, h, d)
        const bgX = (faceIndex + u / gridW) / 6
        const bgY = v / gridH

        const src = faceImg instanceof HTMLCanvasElement
          ? faceImg.toDataURL()
          : faceImg.src

        results.push({
          position: pos,
          face,
          backgroundImage: `url(${src})`,
          backgroundPosition: `${bgX * 100}% ${bgY * 100}%`,
          backgroundSize: `${6 * gridW * 100}% ${gridH * 100}%`,
        })
      }
    }
  })

  return results
}
