import type { Vec3, LayerRotateOptions, BoxelRenderer } from '../types'
import type { BoxelGrid } from '../core/grid'
import type { Animator, AnimationHandle } from './animator'
import { easings } from './animator'
import { rotateGrid } from '../core/rotation'
import { BoxelGrid as BoxelGridClass } from '../core/grid'

export function createLayerRotateAnimation(
  grid: BoxelGrid,
  renderer: BoxelRenderer,
  animator: Animator,
  options: LayerRotateOptions,
  onComplete: () => void,
): AnimationHandle {
  const { axis, layer, direction, duration = 350 } = options
  const worldContainer = renderer.getWorldContainer()
  if (!worldContainer) {
    return { cancel: () => {}, done: true }
  }

  const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
  const layerBoxels: Vec3[] = []
  grid.forEach((_boxel, pos) => {
    if (pos[axisIndex] === layer) {
      layerBoxels.push(pos)
    }
  })

  if (layerBoxels.length === 0) {
    return { cancel: () => {}, done: true }
  }

  const wrapper = document.createElement('div')
  wrapper.style.position = 'absolute'
  wrapper.style.transformStyle = 'preserve-3d'
  worldContainer.appendChild(wrapper)

  const elements: HTMLElement[] = []
  for (const pos of layerBoxels) {
    const key = `${pos[0]},${pos[1]},${pos[2]}`
    const el = worldContainer.querySelector(`[data-boxel="${key}"]`) as HTMLElement | null
    if (el) {
      elements.push(el)
      wrapper.appendChild(el)
    }
  }

  const rotateAxis = axis === 'x' ? 'rotateX' : axis === 'y' ? 'rotateY' : 'rotateZ'
  const targetAngle = direction * 90

  return animator.add({
    duration,
    easing: easings.easeInOut,
    tick: (t) => {
      wrapper.style.transform = `${rotateAxis}(${targetAngle * t}deg)`
    },
    onComplete: () => {
      for (const el of elements) {
        worldContainer.appendChild(el)
      }
      wrapper.remove()

      const tempGrid = new BoxelGridClass()
      for (const pos of layerBoxels) {
        const boxel = grid.getBoxel(pos[0], pos[1], pos[2])
        if (boxel) {
          tempGrid.setBoxel(pos[0], pos[1], pos[2], boxel)
          grid.setBoxel(pos[0], pos[1], pos[2], null)
        }
      }
      rotateGrid(tempGrid, axis, direction)
      tempGrid.forEach((boxel, pos) => {
        grid.setBoxel(pos[0], pos[1], pos[2], boxel)
      })

      onComplete()
    },
  })
}
