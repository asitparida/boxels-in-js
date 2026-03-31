import type { Vec3, BoxelRenderer } from '../types'
import type { BoxelGrid } from '../core/grid'
import type { Animator, AnimationHandle } from './animator'
import { easings, parseCubicBezier } from './animator'

export function computeExplodeOffsets(
  positions: Vec3[],
  center: Vec3,
  factor: number,
): Vec3[] {
  return positions.map(([x, y, z]) => {
    const dx = x - center[0]
    const dy = y - center[1]
    const dz = z - center[2]
    return [dx * factor, dy * factor, dz * factor] as Vec3
  })
}

export function createExplodeAnimation(
  grid: BoxelGrid,
  renderer: BoxelRenderer,
  animator: Animator,
  boxelSize: number,
  options: {
    factor?: number
    stagger?: number
    easing?: string
    duration?: number
  } = {},
): AnimationHandle {
  const factor = options.factor ?? 2.0
  const duration = options.duration ?? 800

  const positions: Vec3[] = []
  grid.forEach((_boxel, pos) => positions.push(pos))

  const bounds = grid.getBounds()
  const center: Vec3 = [
    (bounds.min[0] + bounds.max[0]) / 2,
    (bounds.min[1] + bounds.max[1]) / 2,
    (bounds.min[2] + bounds.max[2]) / 2,
  ]

  const offsets = computeExplodeOffsets(positions, center, factor)

  let easingFn = easings.easeOut
  if (options.easing) {
    const parsed = parseCubicBezier(options.easing)
    if (parsed) easingFn = parsed
  }

  return animator.add({
    duration,
    easing: easingFn,
    tick: (t) => {
      for (let i = 0; i < positions.length; i++) {
        const [ox, oy, oz] = offsets[i]
        const key = `${positions[i][0]},${positions[i][1]},${positions[i][2]}`
        renderer.setBoxelTransform(
          key,
          [ox * t * boxelSize, oy * t * boxelSize, oz * t * boxelSize],
        )
      }
    },
  })
}
