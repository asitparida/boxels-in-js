import { describe, it, expect } from 'vitest'
import { BoxelGrid } from '../../src/lib/core/grid'
import { getExposedFaces, getEdgeVisibility } from '../../src/lib/core/edge-fusion'

describe('getExposedFaces', () => {
  it('returns all 6 faces for an isolated boxel', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    const faces = getExposedFaces(grid, 0, 0, 0)
    expect(faces).toHaveLength(6)
    expect(faces).toContain('top')
    expect(faces).toContain('bottom')
    expect(faces).toContain('front')
    expect(faces).toContain('back')
    expect(faces).toContain('left')
    expect(faces).toContain('right')
  })

  it('culls face when neighbor exists in that direction', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    grid.setBoxel(1, 0, 0, { position: [1, 0, 0], opaque: true })
    const faces = getExposedFaces(grid, 0, 0, 0)
    expect(faces).toHaveLength(5)
    expect(faces).not.toContain('right')
  })

  it('fully enclosed boxel has no exposed faces', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(1, 1, 1, { position: [1, 1, 1], opaque: true })
    grid.setBoxel(0, 1, 1, { position: [0, 1, 1], opaque: true })
    grid.setBoxel(2, 1, 1, { position: [2, 1, 1], opaque: true })
    grid.setBoxel(1, 0, 1, { position: [1, 0, 1], opaque: true })
    grid.setBoxel(1, 2, 1, { position: [1, 2, 1], opaque: true })
    grid.setBoxel(1, 1, 0, { position: [1, 1, 0], opaque: true })
    grid.setBoxel(1, 1, 2, { position: [1, 1, 2], opaque: true })
    const faces = getExposedFaces(grid, 1, 1, 1)
    expect(faces).toHaveLength(0)
  })
})

describe('getEdgeVisibility', () => {
  it('shows all edges for isolated boxel face', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    const edges = getEdgeVisibility(grid, 0, 0, 0, 'top')
    expect(edges).toEqual({ left: true, right: true, top: true, bottom: true })
  })

  it('hides edge when planar neighbor shares the same exposed face', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    grid.setBoxel(1, 0, 0, { position: [1, 0, 0], opaque: true })

    const edges0 = getEdgeVisibility(grid, 0, 0, 0, 'top')
    expect(edges0.right).toBe(false)

    const edges1 = getEdgeVisibility(grid, 1, 0, 0, 'top')
    expect(edges1.left).toBe(false)
  })

  it('shows edge when planar neighbor does NOT have that face exposed', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    grid.setBoxel(1, 0, 0, { position: [1, 0, 0], opaque: true })
    grid.setBoxel(1, 1, 0, { position: [1, 1, 0], opaque: true })

    const edges = getEdgeVisibility(grid, 0, 0, 0, 'top')
    expect(edges.right).toBe(true)
  })

  it('fuses edges correctly for front face', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    grid.setBoxel(0, 1, 0, { position: [0, 1, 0], opaque: true })

    const edgesBottom = getEdgeVisibility(grid, 0, 0, 0, 'front')
    expect(edgesBottom.top).toBe(false)

    const edgesTop = getEdgeVisibility(grid, 0, 1, 0, 'front')
    expect(edgesTop.bottom).toBe(false)
  })
})
