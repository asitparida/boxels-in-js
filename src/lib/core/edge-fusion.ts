import type { FaceName, EdgeVisibility, Vec3 } from '../types'
import type { BoxelGrid } from './grid'

const FACE_NORMALS: Record<FaceName, Vec3> = {
  right:  [1, 0, 0],
  left:   [-1, 0, 0],
  top:    [0, 1, 0],
  bottom: [0, -1, 0],
  front:  [0, 0, 1],
  back:   [0, 0, -1],
}

const FACE_EDGES: Record<FaceName, Record<'Left' | 'Right' | 'Top' | 'Bottom', Vec3>> = {
  top:    { Left: [-1, 0, 0], Right: [1, 0, 0], Top: [0, 0, -1], Bottom: [0, 0, 1] },
  bottom: { Left: [-1, 0, 0], Right: [1, 0, 0], Top: [0, 0, 1],  Bottom: [0, 0, -1] },
  front:  { Left: [-1, 0, 0], Right: [1, 0, 0], Top: [0, 1, 0],  Bottom: [0, -1, 0] },
  back:   { Left: [1, 0, 0],  Right: [-1, 0, 0], Top: [0, 1, 0], Bottom: [0, -1, 0] },
  left:   { Left: [0, 0, 1],  Right: [0, 0, -1], Top: [0, 1, 0], Bottom: [0, -1, 0] },
  right:  { Left: [0, 0, -1], Right: [0, 0, 1],  Top: [0, 1, 0], Bottom: [0, -1, 0] },
}

const ALL_FACES: FaceName[] = ['top', 'bottom', 'front', 'back', 'left', 'right']

export function getExposedFaces(grid: BoxelGrid, x: number, y: number, z: number): FaceName[] {
  const exposed: FaceName[] = []
  for (const face of ALL_FACES) {
    const [dx, dy, dz] = FACE_NORMALS[face]
    if (!grid.hasBoxel(x + dx, y + dy, z + dz)) {
      exposed.push(face)
    }
  }
  return exposed
}

export function getEdgeVisibility(
  grid: BoxelGrid,
  x: number,
  y: number,
  z: number,
  face: FaceName,
): EdgeVisibility {
  const edges = FACE_EDGES[face]
  return {
    left: !neighborHasFaceExposed(grid, x, y, z, face, edges.Left),
    right: !neighborHasFaceExposed(grid, x, y, z, face, edges.Right),
    top: !neighborHasFaceExposed(grid, x, y, z, face, edges.Top),
    bottom: !neighborHasFaceExposed(grid, x, y, z, face, edges.Bottom),
  }
}

function neighborHasFaceExposed(
  grid: BoxelGrid,
  x: number,
  y: number,
  z: number,
  face: FaceName,
  offset: Vec3,
): boolean {
  const nx = x + offset[0]
  const ny = y + offset[1]
  const nz = z + offset[2]
  if (!grid.hasBoxel(nx, ny, nz)) return false
  const normal = FACE_NORMALS[face]
  return !grid.hasBoxel(nx + normal[0], ny + normal[1], nz + normal[2])
}
