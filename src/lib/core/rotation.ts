import type { Vec3, Boxel } from '../types'
import type { BoxelGrid } from './grid'

function rotate90(axis: 'x' | 'y' | 'z', x: number, y: number, z: number): Vec3 {
  switch (axis) {
    case 'x': return [x, -z, y]
    case 'y': return [z, y, -x]
    case 'z': return [-y, x, z]
  }
}

export function rotateGrid(
  grid: BoxelGrid,
  axis: 'x' | 'y' | 'z',
  turns: number,
  center: Vec3 = [0, 0, 0],
): void {
  const t = ((turns % 4) + 4) % 4
  if (t === 0) return

  const entries: [Vec3, Boxel][] = []
  grid.forEach((boxel, pos) => {
    entries.push([pos, boxel])
  })

  grid.clear()

  for (const [pos, boxel] of entries) {
    let rx = pos[0] - center[0]
    let ry = pos[1] - center[1]
    let rz = pos[2] - center[2]

    for (let i = 0; i < t; i++) {
      [rx, ry, rz] = rotate90(axis, rx, ry, rz)
    }

    const newPos: Vec3 = [
      Math.round(rx + center[0]),
      Math.round(ry + center[1]),
      Math.round(rz + center[2]),
    ]
    grid.setBoxel(newPos[0], newPos[1], newPos[2], {
      ...boxel,
      position: newPos,
    })
  }
}
