import { describe, it, expect, beforeEach } from 'vitest'
import { DOMRenderer } from '../../src/lib/renderers/dom/dom-renderer'
import { BoxelGrid } from '../../src/lib/core/grid'

describe('DOMRenderer', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('mounts a scene container into the target element', () => {
    const renderer = new DOMRenderer({ orbit: false, zoom: false })
    renderer.mount(container)
    expect(container.children.length).toBe(1)
    const scene = container.children[0] as HTMLElement
    expect(scene.style.transformStyle).toBe('preserve-3d')
    renderer.dispose()
  })

  it('renders boxels as div elements with face children', () => {
    const renderer = new DOMRenderer({ orbit: false, zoom: false })
    renderer.mount(container)
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    renderer.render({
      grid,
      boxelSize: 50,
      gap: 0,
      edgeWidth: 1,
      edgeColor: '#333',
    })
    const scene = container.querySelector('[data-boxel]')
    expect(scene).not.toBeNull()
    expect(scene!.children.length).toBe(6)
    renderer.dispose()
  })

  it('culls internal faces between adjacent boxels', () => {
    const renderer = new DOMRenderer({ orbit: false, zoom: false })
    renderer.mount(container)
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    grid.setBoxel(1, 0, 0, { position: [1, 0, 0], opaque: true })
    renderer.render({
      grid,
      boxelSize: 50,
      gap: 0,
      edgeWidth: 1,
      edgeColor: '#333',
    })
    const boxels = container.querySelectorAll('[data-boxel]')
    expect(boxels.length).toBe(2)
    expect(boxels[0].children.length).toBe(5)
    expect(boxels[1].children.length).toBe(5)
    renderer.dispose()
  })

  it('unmounts and cleans up', () => {
    const renderer = new DOMRenderer({ orbit: false, zoom: false })
    renderer.mount(container)
    renderer.unmount()
    expect(container.children.length).toBe(0)
  })

  it('updates rotation transform without rebuild', () => {
    const renderer = new DOMRenderer({ orbit: false, zoom: false })
    renderer.mount(container)
    renderer.updateTransform(-30, 45)
    const world = renderer.getWorldContainer()!
    expect(world.style.transform).toContain('rotateX(-30deg)')
    expect(world.style.transform).toContain('rotateY(45deg)')
    renderer.dispose()
  })
})
