import { describe, it, expect } from 'vitest'
import { computeExplodeOffsets } from '../../src/lib/animation/explode'
import type { Vec3 } from '../../src/lib/types'

describe('computeExplodeOffsets', () => {
  it('computes offset directions from center', () => {
    const positions: Vec3[] = [[0, 0, 0], [2, 0, 0], [0, 2, 0]]
    const center: Vec3 = [1, 1, 0]
    const offsets = computeExplodeOffsets(positions, center, 2.0)

    expect(offsets).toHaveLength(3)
    expect(offsets[0][0]).toBeLessThan(0)
    expect(offsets[0][1]).toBeLessThan(0)
  })

  it('returns zero offset for boxel at center', () => {
    const positions: Vec3[] = [[5, 5, 5]]
    const center: Vec3 = [5, 5, 5]
    const offsets = computeExplodeOffsets(positions, center, 2.0)
    expect(offsets[0]).toEqual([0, 0, 0])
  })

  it('scales offsets by factor', () => {
    const positions: Vec3[] = [[2, 0, 0]]
    const center: Vec3 = [0, 0, 0]
    const offsets1 = computeExplodeOffsets(positions, center, 1.0)
    const offsets2 = computeExplodeOffsets(positions, center, 3.0)
    expect(Math.abs(offsets2[0][0])).toBeGreaterThan(Math.abs(offsets1[0][0]))
  })
})
