import { describe, it, expect, vi } from 'vitest'
import { Animator } from '../../src/lib/animation/animator'

describe('Animator', () => {
  it('calls tick callback with progress 0 to 1', () => {
    const animator = new Animator()
    const ticks: number[] = []

    let rafCallback: ((time: number) => void) | null = null
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb as (time: number) => void
      return 1
    })
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {})

    animator.add({
      duration: 100,
      tick: (t) => { ticks.push(t) },
    })

    rafCallback!(0)
    rafCallback!(50)
    rafCallback!(100)

    expect(ticks.length).toBeGreaterThanOrEqual(2)
    expect(ticks[ticks.length - 1]).toBe(1)

    vi.restoreAllMocks()
  })

  it('supports cancel', () => {
    const animator = new Animator()
    const ticks: number[] = []

    let rafCallback: ((time: number) => void) | null = null
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb as (time: number) => void
      return 1
    })
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {})

    const handle = animator.add({
      duration: 1000,
      tick: (t) => { ticks.push(t) },
    })

    rafCallback!(0)
    handle.cancel()
    rafCallback!(500)

    expect(ticks.length).toBe(1)

    vi.restoreAllMocks()
  })

  it('calls onComplete when animation finishes', () => {
    const animator = new Animator()
    let completed = false

    let rafCallback: ((time: number) => void) | null = null
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb as (time: number) => void
      return 1
    })
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {})

    animator.add({
      duration: 100,
      tick: () => {},
      onComplete: () => { completed = true },
    })

    rafCallback!(0)
    rafCallback!(200)

    expect(completed).toBe(true)

    vi.restoreAllMocks()
  })
})
