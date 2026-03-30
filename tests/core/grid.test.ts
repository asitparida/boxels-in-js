import { describe, it, expect } from 'vitest'
import { BoxelGrid } from '../../src/lib/core/grid'

describe('BoxelGrid', () => {
  it('starts empty', () => {
    const grid = new BoxelGrid()
    expect(grid.count).toBe(0)
  })

  it('sets and gets a boxel', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(1, 2, 3, { position: [1, 2, 3], opaque: true })
    expect(grid.hasBoxel(1, 2, 3)).toBe(true)
    expect(grid.getBoxel(1, 2, 3)?.position).toEqual([1, 2, 3])
  })

  it('removes a boxel by setting null', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    grid.setBoxel(0, 0, 0, null)
    expect(grid.hasBoxel(0, 0, 0)).toBe(false)
    expect(grid.count).toBe(0)
  })

  it('returns null for empty positions', () => {
    const grid = new BoxelGrid()
    expect(grid.getBoxel(5, 5, 5)).toBeNull()
    expect(grid.hasBoxel(5, 5, 5)).toBe(false)
  })

  it('tracks bounds as boxels are added', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(1, 2, 3, { position: [1, 2, 3], opaque: true })
    grid.setBoxel(5, 0, 1, { position: [5, 0, 1], opaque: true })
    const bounds = grid.getBounds()
    expect(bounds.min).toEqual([1, 0, 1])
    expect(bounds.max).toEqual([5, 2, 3])
  })

  it('returns empty bounds for empty grid', () => {
    const grid = new BoxelGrid()
    const bounds = grid.getBounds()
    expect(bounds.min).toEqual([0, 0, 0])
    expect(bounds.max).toEqual([0, 0, 0])
  })

  it('iterates all boxels with forEach', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    grid.setBoxel(1, 1, 1, { position: [1, 1, 1], opaque: true })
    const positions: [number, number, number][] = []
    grid.forEach((_boxel, pos) => positions.push(pos))
    expect(positions).toHaveLength(2)
    expect(positions).toContainEqual([0, 0, 0])
    expect(positions).toContainEqual([1, 1, 1])
  })

  it('gets neighbors for a position', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(1, 0, 0, { position: [1, 0, 0], opaque: true })
    grid.setBoxel(0, 1, 0, { position: [0, 1, 0], opaque: true })
    const neighbors = grid.getNeighbors(0, 0, 0)
    expect(neighbors.right).not.toBeNull()
    expect(neighbors.top).not.toBeNull()
    expect(neighbors.left).toBeNull()
    expect(neighbors.bottom).toBeNull()
    expect(neighbors.front).toBeNull()
    expect(neighbors.back).toBeNull()
  })

  it('counts exposure (open faces)', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    expect(grid.getExposure(0, 0, 0)).toBe(6)

    grid.setBoxel(1, 0, 0, { position: [1, 0, 0], opaque: true })
    expect(grid.getExposure(0, 0, 0)).toBe(5)
    expect(grid.getExposure(1, 0, 0)).toBe(5)
  })

  it('clears all boxels', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    grid.setBoxel(1, 1, 1, { position: [1, 1, 1], opaque: true })
    grid.clear()
    expect(grid.count).toBe(0)
    expect(grid.hasBoxel(0, 0, 0)).toBe(false)
  })
})
