import type { FaceName, Vec3 } from '../types'
import type { BoxelGrid } from './grid'
import { getExposedFaces } from './edge-fusion'

export interface FaceImageSlice {
  position: Vec3
  face: FaceName
  backgroundSize: string
  backgroundPosition: string
}

/**
 * Compute where a face sits in the 2D grid for its face type.
 * Returns col/row/cols/rows for CSS background slicing.
 */
export function getFaceGridPosition(
  face: FaceName,
  x: number, y: number, z: number,
  gridW: number, gridH: number, gridD: number,
): { col: number; row: number; cols: number; rows: number } {
  switch (face) {
    case 'front':  return { col: x, row: gridH - 1 - y, cols: gridW, rows: gridH }
    case 'back':   return { col: gridW - 1 - x, row: gridH - 1 - y, cols: gridW, rows: gridH }
    case 'left':   return { col: z, row: gridH - 1 - y, cols: gridD, rows: gridH }
    case 'right':  return { col: gridD - 1 - z, row: gridH - 1 - y, cols: gridD, rows: gridH }
    case 'top':    return { col: x, row: z, cols: gridW, rows: gridD }
    case 'bottom': return { col: x, row: gridD - 1 - z, cols: gridW, rows: gridD }
  }
}

/**
 * Compute CSS background-size and background-position for a face
 * so that an image is distributed across all faces of that type.
 */
export function computeFaceImageSlice(
  face: FaceName,
  x: number, y: number, z: number,
  gridW: number, gridH: number, gridD: number,
): { backgroundSize: string; backgroundPosition: string } {
  const { col, row, cols, rows } = getFaceGridPosition(face, x, y, z, gridW, gridH, gridD)
  return {
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    backgroundPosition: `${cols > 1 ? (col / (cols - 1)) * 100 : 0}% ${rows > 1 ? (row / (rows - 1)) * 100 : 0}%`,
  }
}

/**
 * Compute image slices for all exposed faces in the grid.
 * Optionally filter to a specific face type.
 */
export function computeImageMap(
  grid: BoxelGrid,
  targetFace?: FaceName,
): FaceImageSlice[] {
  const results: FaceImageSlice[] = []
  const bounds = grid.getBounds()
  const gridW = bounds.max[0] - bounds.min[0] + 1
  const gridH = bounds.max[1] - bounds.min[1] + 1
  const gridD = bounds.max[2] - bounds.min[2] + 1

  grid.forEach((_boxel, pos) => {
    const [x, y, z] = pos
    const exposed = getExposedFaces(grid, x, y, z)

    for (const face of exposed) {
      if (targetFace && face !== targetFace) continue

      const rx = x - bounds.min[0]
      const ry = y - bounds.min[1]
      const rz = z - bounds.min[2]

      const slice = computeFaceImageSlice(face, rx, ry, rz, gridW, gridH, gridD)
      results.push({
        position: pos,
        face,
        ...slice,
      })
    }
  })

  return results
}
