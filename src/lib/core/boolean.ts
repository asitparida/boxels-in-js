import type { Vec3, BooleanMode, BoxelStyle } from '../types'
import type { BoxelGrid } from './grid'

export function applyBoolean(
  grid: BoxelGrid,
  positions: Vec3[],
  mode: BooleanMode,
  style?: BoxelStyle,
): void {
  switch (mode) {
    case 'union':
      for (const [x, y, z] of positions) {
        grid.setBoxel(x, y, z, { position: [x, y, z], opaque: true, style })
      }
      break

    case 'subtract':
      for (const [x, y, z] of positions) {
        grid.setBoxel(x, y, z, null)
      }
      break

    case 'intersect': {
      const posSet = new Set(positions.map(([x, y, z]) => `${x},${y},${z}`))
      const toRemove: Vec3[] = []
      grid.forEach((_boxel, pos) => {
        const key = `${pos[0]},${pos[1]},${pos[2]}`
        if (!posSet.has(key)) {
          toRemove.push(pos)
        }
      })
      for (const [x, y, z] of toRemove) {
        grid.setBoxel(x, y, z, null)
      }
      break
    }

    case 'exclude': {
      for (const [x, y, z] of positions) {
        if (grid.hasBoxel(x, y, z)) {
          grid.setBoxel(x, y, z, null)
        } else {
          grid.setBoxel(x, y, z, { position: [x, y, z], opaque: true, style })
        }
      }
      break
    }
  }
}
