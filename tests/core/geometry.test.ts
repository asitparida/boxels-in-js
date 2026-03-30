import { describe, it, expect } from 'vitest'
import { generateBox, generateSphere, generateLine } from '../../src/lib/core/geometry'

describe('generateBox', () => {
  it('generates positions for a 2x2x2 box at origin', () => {
    const positions = generateBox([0, 0, 0], [2, 2, 2])
    expect(positions).toHaveLength(8)
    expect(positions).toContainEqual([0, 0, 0])
    expect(positions).toContainEqual([1, 1, 1])
  })

  it('generates positions offset from origin', () => {
    const positions = generateBox([3, 3, 3], [2, 1, 1])
    expect(positions).toHaveLength(2)
    expect(positions).toContainEqual([3, 3, 3])
    expect(positions).toContainEqual([4, 3, 3])
  })

  it('generates single voxel for size [1,1,1]', () => {
    const positions = generateBox([5, 5, 5], [1, 1, 1])
    expect(positions).toHaveLength(1)
    expect(positions).toContainEqual([5, 5, 5])
  })
})

describe('generateSphere', () => {
  it('generates a sphere of radius 1', () => {
    const positions = generateSphere([5, 5, 5], 1)
    expect(positions.length).toBeGreaterThanOrEqual(7)
    expect(positions).toContainEqual([5, 5, 5])
  })

  it('generates a sphere of radius 2', () => {
    const positions = generateSphere([5, 5, 5], 2)
    for (const [x, y, z] of positions) {
      const dist = Math.sqrt((x - 5) ** 2 + (y - 5) ** 2 + (z - 5) ** 2)
      expect(dist).toBeLessThanOrEqual(2 + 0.5)
    }
  })

  it('is symmetric', () => {
    const positions = generateSphere([5, 5, 5], 3)
    const set = new Set(positions.map(([x, y, z]) => `${x},${y},${z}`))
    for (const [x, y, z] of positions) {
      const mirror = `${10 - x},${10 - y},${10 - z}`
      expect(set.has(mirror)).toBe(true)
    }
  })
})

describe('generateLine', () => {
  it('generates a line along x-axis', () => {
    const positions = generateLine([0, 0, 0], [4, 0, 0], 0)
    expect(positions).toHaveLength(5)
    for (let x = 0; x <= 4; x++) {
      expect(positions).toContainEqual([x, 0, 0])
    }
  })

  it('generates a diagonal line', () => {
    const positions = generateLine([0, 0, 0], [3, 3, 3], 0)
    expect(positions.length).toBeGreaterThanOrEqual(4)
    expect(positions).toContainEqual([0, 0, 0])
    expect(positions).toContainEqual([3, 3, 3])
  })

  it('generates a thick line with radius', () => {
    const positions = generateLine([0, 0, 0], [4, 0, 0], 1)
    expect(positions.length).toBeGreaterThan(5)
    const hasOffAxis = positions.some(([_x, y, z]) => y !== 0 || z !== 0)
    expect(hasOffAxis).toBe(true)
  })
})
