import type { Boxel, FaceName, Vec3 } from '../types'

const FACE_NORMALS: Record<FaceName, Vec3> = {
  right:  [1, 0, 0],
  left:   [-1, 0, 0],
  top:    [0, 1, 0],
  bottom: [0, -1, 0],
  front:  [0, 0, 1],
  back:   [0, 0, -1],
}

const ALL_FACES: FaceName[] = ['top', 'bottom', 'front', 'back', 'left', 'right']

function key(x: number, y: number, z: number): string {
  return `${x},${y},${z}`
}

export class BoxelGrid {
  readonly data: Map<string, Boxel> = new Map()

  get count(): number {
    return this.data.size
  }

  hasBoxel(x: number, y: number, z: number): boolean {
    return this.data.has(key(x, y, z))
  }

  getBoxel(x: number, y: number, z: number): Boxel | null {
    return this.data.get(key(x, y, z)) ?? null
  }

  setBoxel(x: number, y: number, z: number, boxel: Boxel | null): void {
    const k = key(x, y, z)
    if (boxel === null) {
      this.data.delete(k)
    } else {
      this.data.set(k, boxel)
    }
  }

  getNeighbors(x: number, y: number, z: number): Record<FaceName, Boxel | null> {
    const result = {} as Record<FaceName, Boxel | null>
    for (const face of ALL_FACES) {
      const [dx, dy, dz] = FACE_NORMALS[face]
      result[face] = this.getBoxel(x + dx, y + dy, z + dz)
    }
    return result
  }

  getExposure(x: number, y: number, z: number): number {
    let count = 0
    for (const face of ALL_FACES) {
      const [dx, dy, dz] = FACE_NORMALS[face]
      if (!this.hasBoxel(x + dx, y + dy, z + dz)) {
        count++
      }
    }
    return count
  }

  forEach(fn: (boxel: Boxel, pos: Vec3) => void): void {
    for (const [k, boxel] of this.data) {
      const parts = k.split(',').map(Number) as Vec3
      fn(boxel, parts)
    }
  }

  getBounds(): { min: Vec3; max: Vec3 } {
    if (this.data.size === 0) {
      return { min: [0, 0, 0], max: [0, 0, 0] }
    }
    let minX = Infinity, minY = Infinity, minZ = Infinity
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
    for (const k of this.data.keys()) {
      const [x, y, z] = k.split(',').map(Number)
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (z < minZ) minZ = z
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
      if (z > maxZ) maxZ = z
    }
    return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] }
  }

  clear(): void {
    this.data.clear()
  }
}
