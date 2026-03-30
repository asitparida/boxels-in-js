import { describe, it, expect } from 'vitest'
import { resolveStyle } from '../../src/lib/core/style'
import type { BoxelStyle } from '../../src/lib/types'

describe('resolveStyle', () => {
  it('returns library fallback when no styles provided', () => {
    const result = resolveStyle('top', 0, 0, 0)
    expect(result.fill).toBe('#ddd')
    expect(result.stroke).toBe('#333')
    expect(result.opacity).toBe(1)
  })

  it('uses constructor default style', () => {
    const global: BoxelStyle = { default: { fill: 'red', stroke: 'blue' } }
    const result = resolveStyle('top', 0, 0, 0, undefined, global)
    expect(result.fill).toBe('red')
    expect(result.stroke).toBe('blue')
  })

  it('boxel default overrides constructor default', () => {
    const global: BoxelStyle = { default: { fill: 'red' } }
    const boxel: BoxelStyle = { default: { fill: 'green' } }
    const result = resolveStyle('top', 0, 0, 0, boxel, global)
    expect(result.fill).toBe('green')
  })

  it('face-specific overrides default', () => {
    const boxel: BoxelStyle = {
      default: { fill: 'red' },
      top: { fill: 'blue' },
    }
    const result = resolveStyle('top', 0, 0, 0, boxel)
    expect(result.fill).toBe('blue')
    const front = resolveStyle('front', 0, 0, 0, boxel)
    expect(front.fill).toBe('red')
  })

  it('evaluates functional styles with position', () => {
    const boxel: BoxelStyle = {
      default: (x, _y, _z) => ({ fill: x > 2 ? 'red' : 'blue' }),
    }
    expect(resolveStyle('top', 0, 0, 0, boxel).fill).toBe('blue')
    expect(resolveStyle('top', 5, 0, 0, boxel).fill).toBe('red')
  })

  it('evaluates functional StyleValue within FaceStyle', () => {
    const boxel: BoxelStyle = {
      default: { fill: (x, _y, _z) => `hsl(${x * 10}, 50%, 50%)` },
    }
    const result = resolveStyle('top', 10, 0, 0, boxel)
    expect(result.fill).toBe('hsl(100, 50%, 50%)')
  })

  it('merges partial styles — unset properties fall through', () => {
    const global: BoxelStyle = { default: { fill: 'red', stroke: 'blue' } }
    const boxel: BoxelStyle = { default: { fill: 'green' } }
    const result = resolveStyle('top', 0, 0, 0, boxel, global)
    expect(result.fill).toBe('green')
    expect(result.stroke).toBe('blue')
  })

  it('preserves className and backdropFilter', () => {
    const boxel: BoxelStyle = {
      top: { fill: 'red', className: 'highlight', backdropFilter: 'blur(4px)' },
    }
    const result = resolveStyle('top', 0, 0, 0, boxel)
    expect(result.className).toBe('highlight')
    expect(result.backdropFilter).toBe('blur(4px)')
  })
})
