import { describe, it, expect } from 'vitest'
import { BoxelGrid } from '../../src/lib/core/grid'
import { rotateGrid } from '../../src/lib/core/rotation'

describe('rotateGrid', () => {
  it('rotates a single boxel 90° around Y axis', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(1, 0, 0, { position: [1, 0, 0], opaque: true })
    rotateGrid(grid, 'y', 1)
    expect(grid.hasBoxel(1, 0, 0)).toBe(false)
    expect(grid.hasBoxel(0, 0, -1)).toBe(true)
  })

  it('rotates 2 turns (180°)', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(1, 0, 0, { position: [1, 0, 0], opaque: true })
    rotateGrid(grid, 'y', 2)
    expect(grid.hasBoxel(-1, 0, 0)).toBe(true)
  })

  it('rotates around X axis', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(0, 1, 0, { position: [0, 1, 0], opaque: true })
    rotateGrid(grid, 'x', 1)
    expect(grid.hasBoxel(0, 0, 1)).toBe(true)
  })

  it('rotates around Z axis', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(1, 0, 0, { position: [1, 0, 0], opaque: true })
    rotateGrid(grid, 'z', 1)
    expect(grid.hasBoxel(0, 1, 0)).toBe(true)
  })

  it('rotates around a custom center', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(2, 0, 0, { position: [2, 0, 0], opaque: true })
    rotateGrid(grid, 'y', 1, [1, 0, 0])
    expect(grid.hasBoxel(1, 0, -1)).toBe(true)
  })

  it('preserves boxel count after rotation', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    grid.setBoxel(1, 0, 0, { position: [1, 0, 0], opaque: true })
    grid.setBoxel(2, 0, 0, { position: [2, 0, 0], opaque: true })
    rotateGrid(grid, 'y', 1)
    expect(grid.count).toBe(3)
  })
})
