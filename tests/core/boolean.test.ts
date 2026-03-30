import { describe, it, expect } from 'vitest'
import { BoxelGrid } from '../../src/lib/core/grid'
import { applyBoolean } from '../../src/lib/core/boolean'
import type { Vec3, BoxelStyle } from '../../src/lib/types'

describe('applyBoolean', () => {
  it('union adds all positions to grid', () => {
    const grid = new BoxelGrid()
    const positions: Vec3[] = [[0, 0, 0], [1, 0, 0], [2, 0, 0]]
    applyBoolean(grid, positions, 'union')
    expect(grid.count).toBe(3)
    expect(grid.hasBoxel(0, 0, 0)).toBe(true)
    expect(grid.hasBoxel(1, 0, 0)).toBe(true)
    expect(grid.hasBoxel(2, 0, 0)).toBe(true)
  })

  it('union with style applies style to new boxels', () => {
    const grid = new BoxelGrid()
    const style: BoxelStyle = { default: { fill: 'red' } }
    applyBoolean(grid, [[0, 0, 0]], 'union', style)
    expect(grid.getBoxel(0, 0, 0)?.style).toEqual(style)
  })

  it('subtract removes positions from grid', () => {
    const grid = new BoxelGrid()
    applyBoolean(grid, [[0, 0, 0], [1, 0, 0], [2, 0, 0]], 'union')
    applyBoolean(grid, [[1, 0, 0]], 'subtract')
    expect(grid.count).toBe(2)
    expect(grid.hasBoxel(1, 0, 0)).toBe(false)
  })

  it('subtract ignores positions not in grid', () => {
    const grid = new BoxelGrid()
    applyBoolean(grid, [[0, 0, 0]], 'union')
    applyBoolean(grid, [[5, 5, 5]], 'subtract')
    expect(grid.count).toBe(1)
  })

  it('intersect keeps only overlapping positions', () => {
    const grid = new BoxelGrid()
    applyBoolean(grid, [[0, 0, 0], [1, 0, 0], [2, 0, 0]], 'union')
    applyBoolean(grid, [[1, 0, 0], [2, 0, 0], [3, 0, 0]], 'intersect')
    expect(grid.count).toBe(2)
    expect(grid.hasBoxel(0, 0, 0)).toBe(false)
    expect(grid.hasBoxel(1, 0, 0)).toBe(true)
    expect(grid.hasBoxel(2, 0, 0)).toBe(true)
    expect(grid.hasBoxel(3, 0, 0)).toBe(false)
  })

  it('exclude toggles positions (symmetric difference)', () => {
    const grid = new BoxelGrid()
    applyBoolean(grid, [[0, 0, 0], [1, 0, 0]], 'union')
    applyBoolean(grid, [[1, 0, 0], [2, 0, 0]], 'exclude')
    expect(grid.count).toBe(2)
    expect(grid.hasBoxel(0, 0, 0)).toBe(true)
    expect(grid.hasBoxel(1, 0, 0)).toBe(false)
    expect(grid.hasBoxel(2, 0, 0)).toBe(true)
  })
})
