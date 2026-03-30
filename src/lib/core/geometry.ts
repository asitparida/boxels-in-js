import type { Vec3 } from '../types'

export function generateBox(position: Vec3, size: Vec3): Vec3[] {
  const [px, py, pz] = position
  const [sx, sy, sz] = size
  const positions: Vec3[] = []
  for (let x = px; x < px + sx; x++) {
    for (let y = py; y < py + sy; y++) {
      for (let z = pz; z < pz + sz; z++) {
        positions.push([x, y, z])
      }
    }
  }
  return positions
}

export function generateSphere(center: Vec3, radius: number): Vec3[] {
  const [cx, cy, cz] = center
  const r = radius
  const positions: Vec3[] = []
  for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++) {
        const dx = x - cx
        const dy = y - cy
        const dz = z - cz
        if (dx * dx + dy * dy + dz * dz <= r * r) {
          positions.push([x, y, z])
        }
      }
    }
  }
  return positions
}

export function generateLine(from: Vec3, to: Vec3, radius: number = 0): Vec3[] {
  const [x0, y0, z0] = from
  const [x1, y1, z1] = to
  const dx = x1 - x0
  const dy = y1 - y0
  const dz = z1 - z0
  const steps = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz))

  if (steps === 0) {
    return radius === 0 ? [from] : generateSphere(from, radius)
  }

  const centerPositions: Vec3[] = []
  const seen = new Set<string>()
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = Math.round(x0 + dx * t)
    const y = Math.round(y0 + dy * t)
    const z = Math.round(z0 + dz * t)
    const key = `${x},${y},${z}`
    if (!seen.has(key)) {
      seen.add(key)
      centerPositions.push([x, y, z])
    }
  }

  if (radius === 0) {
    return centerPositions
  }

  const allPositions = new Set<string>()
  const result: Vec3[] = []
  for (const center of centerPositions) {
    const sphere = generateSphere(center, radius)
    for (const pos of sphere) {
      const key = `${pos[0]},${pos[1]},${pos[2]}`
      if (!allPositions.has(key)) {
        allPositions.add(key)
        result.push(pos)
      }
    }
  }
  return result
}
