export interface AnimationConfig {
  duration: number
  tick: (t: number) => void
  onComplete?: () => void
  easing?: (t: number) => number
  loop?: boolean
}

export interface AnimationHandle {
  cancel: () => void
  readonly done: boolean
}

export const easings = {
  linear: (t: number) => t,
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2,
  easeOut: (t: number) => 1 - (1 - t) ** 3,
  easeIn: (t: number) => t * t * t,
  bounce: (t: number) => {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) return n1 * t * t
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  },
}

export function parseCubicBezier(str: string): ((t: number) => number) | null {
  const match = str.match(/cubic-bezier\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/)
  if (!match) return null
  const [, x1s, y1s, x2s, y2s] = match
  const x1 = parseFloat(x1s), y1 = parseFloat(y1s)
  const x2 = parseFloat(x2s), y2 = parseFloat(y2s)
  return (t: number) => {
    const ct = 1 - t
    const b1 = 3 * ct * ct * t
    const b2 = 3 * ct * t * t
    const b3 = t * t * t
    return b1 * y1 + b2 * y2 + b3
  }
}

interface ActiveAnimation {
  config: AnimationConfig
  startTime: number | null
  cancelled: boolean
}

export class Animator {
  private animations: ActiveAnimation[] = []
  private rafId: number | null = null

  add(config: AnimationConfig): AnimationHandle {
    const anim: ActiveAnimation = {
      config,
      startTime: null,
      cancelled: false,
    }
    this.animations.push(anim)
    this.start()

    return {
      cancel: () => {
        anim.cancelled = true
      },
      get done() {
        return anim.cancelled
      },
    }
  }

  cancelAll(): void {
    for (const anim of this.animations) {
      anim.cancelled = true
    }
    this.animations = []
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private start(): void {
    if (this.rafId !== null) return
    this.rafId = requestAnimationFrame(this.tick)
  }

  private tick = (time: number): void => {
    const toRemove: number[] = []

    for (let i = 0; i < this.animations.length; i++) {
      const anim = this.animations[i]
      if (anim.cancelled) {
        toRemove.push(i)
        continue
      }

      if (anim.startTime === null) {
        anim.startTime = time
      }

      const elapsed = time - anim.startTime
      const duration = anim.config.duration
      let rawT = Math.min(elapsed / duration, 1)

      if (anim.config.loop && rawT >= 1) {
        anim.startTime = time
        rawT = 0
      }

      const easing = anim.config.easing ?? easings.linear
      const t = easing(rawT)
      anim.config.tick(t)

      if (rawT >= 1 && !anim.config.loop) {
        anim.config.tick(1)
        anim.config.onComplete?.()
        toRemove.push(i)
      }
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.animations.splice(toRemove[i], 1)
    }

    if (this.animations.length > 0) {
      this.rafId = requestAnimationFrame(this.tick)
    } else {
      this.rafId = null
    }
  }
}
