import type { AnimateEachCallback, AnimateEachOptions, TweenOptions, BoxelRenderer } from '../types'
import type { BoxelGrid } from '../core/grid'
import type { Animator, AnimationHandle } from './animator'
import { easings, parseCubicBezier } from './animator'

function resolveEasing(easingStr?: string): (t: number) => number {
  if (!easingStr) return easings.easeInOut
  if (easingStr in easings) return easings[easingStr as keyof typeof easings]
  const parsed = parseCubicBezier(easingStr)
  return parsed ?? easings.easeInOut
}

export function createGapTween(
  animator: Animator,
  onGapChange: (gap: number) => void,
  options: TweenOptions,
): AnimationHandle {
  const { from, to, duration = 600 } = options
  const easingFn = resolveEasing(options.easing)
  return animator.add({
    duration,
    easing: easingFn,
    tick: (t) => {
      const gap = from + (to - from) * t
      onGapChange(gap)
    },
  })
}

export function createOpacityTween(
  animator: Animator,
  renderer: BoxelRenderer,
  options: TweenOptions,
): AnimationHandle {
  const { from, to, duration = 600 } = options
  const easingFn = resolveEasing(options.easing)
  return animator.add({
    duration,
    easing: easingFn,
    tick: (t) => {
      const opacity = from + (to - from) * t
      renderer.updateOpacity(opacity)
    },
  })
}

export function createEachTween(
  grid: BoxelGrid,
  renderer: BoxelRenderer,
  animator: Animator,
  _voxelSize: number,
  callback: AnimateEachCallback,
  options: AnimateEachOptions = {},
): AnimationHandle {
  const { duration = 2000, loop = false } = options
  const easingFn = resolveEasing(options.easing)

  return animator.add({
    duration,
    easing: easingFn,
    loop,
    tick: (t) => {
      grid.forEach((boxel, pos) => {
        const result = callback(boxel, pos, t)
        const key = `${pos[0]},${pos[1]},${pos[2]}`
        renderer.setBoxelTransform(
          key,
          result.translate ?? [0, 0, 0],
          result.scale,
          result.opacity,
        )
      })
    },
  })
}
