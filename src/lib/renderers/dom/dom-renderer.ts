import type { BoxelRenderer, RenderOptions, Vec3 } from '../../types'
import { getExposedFaces, getEdgeVisibility } from '../../core/edge-fusion'
import { resolveStyle } from '../../core/style'
import { createBoxelElement } from './boxel-element'
import { OrbitControls } from './orbit'

interface DOMRendererOptions {
  orbit?: boolean
  zoom?: boolean
  cameraRotation?: [number, number]
  cameraDistance?: number
}

export class DOMRenderer implements BoxelRenderer {
  private sceneEl: HTMLDivElement | null = null
  private worldEl: HTMLDivElement | null = null
  private containerEl: HTMLElement | null = null
  private orbitControls: OrbitControls | null = null
  private options: DOMRendererOptions

  constructor(options: DOMRendererOptions = {}) {
    this.options = options
  }

  mount(container: HTMLElement): void {
    this.containerEl = container

    this.sceneEl = document.createElement('div')
    this.sceneEl.style.width = '100%'
    this.sceneEl.style.height = '100%'
    this.sceneEl.style.perspective = `${this.options.cameraDistance ?? 1200}px`
    this.sceneEl.style.overflow = 'hidden'
    this.sceneEl.style.position = 'relative'
    this.sceneEl.style.transformStyle = 'preserve-3d'

    this.worldEl = document.createElement('div')
    this.worldEl.style.position = 'absolute'
    this.worldEl.style.top = '50%'
    this.worldEl.style.left = '50%'
    this.worldEl.style.transformStyle = 'preserve-3d'

    const [rx, ry] = this.options.cameraRotation ?? [-25, 35]
    this.worldEl.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`

    this.sceneEl.appendChild(this.worldEl)
    container.appendChild(this.sceneEl)

    if (this.options.orbit !== false) {
      this.orbitControls = new OrbitControls(
        this.options.cameraRotation ?? [-25, 35],
        (state) => {
          if (this.worldEl) {
            this.worldEl.style.transform = `rotateX(${state.rotX}deg) rotateY(${state.rotY}deg) scale(${state.scale})`
          }
        },
      )
      this.orbitControls.attach(this.sceneEl)
    }
  }

  unmount(): void {
    if (this.orbitControls) {
      this.orbitControls.detach()
      this.orbitControls = null
    }
    if (this.sceneEl && this.containerEl) {
      this.containerEl.removeChild(this.sceneEl)
    }
    this.sceneEl = null
    this.worldEl = null
    this.containerEl = null
  }

  render(options: RenderOptions): void {
    if (!this.worldEl) return

    this.worldEl.innerHTML = ''

    const { grid, voxelSize, gap, edgeWidth, edgeColor, globalStyle, showBackfaces } = options

    // Center the grid so rotation orbits around the visual center
    const bounds = grid.getBounds()
    const offset = voxelSize + gap
    const centerX = ((bounds.min[0] + bounds.max[0]) / 2) * offset
    const centerY = ((bounds.min[1] + bounds.max[1]) / 2) * offset
    const centerZ = ((bounds.min[2] + bounds.max[2]) / 2) * offset

    // Create an inner group that's offset so the center of the grid is at the world origin
    const groupEl = document.createElement('div')
    groupEl.style.position = 'absolute'
    groupEl.style.transformStyle = 'preserve-3d'
    groupEl.style.transform = `translate3d(${-centerX}px, ${centerY}px, ${-centerZ}px)`
    this.worldEl.appendChild(groupEl)

    const allFaces: import('../../types').FaceName[] = ['top', 'bottom', 'front', 'back', 'left', 'right']

    grid.forEach((boxel, pos) => {
      const [x, y, z] = pos
      // When showBackfaces is on, render all 6 faces (no culling) for see-through depth
      const facesToRender = showBackfaces ? allFaces : getExposedFaces(grid, x, y, z)
      if (facesToRender.length === 0) return

      const faceData = facesToRender.map((face) => {
        const edges = gap === 0 && !showBackfaces
          ? getEdgeVisibility(grid, x, y, z, face)
          : { left: true, right: true, top: true, bottom: true }
        const style = resolveStyle(face, x, y, z, boxel.style, globalStyle)
        return { name: face, style, edges }
      })

      const el = createBoxelElement(pos, voxelSize, gap, faceData, edgeWidth, edgeColor, showBackfaces)
      groupEl.appendChild(el)
    })
  }

  updateTransform(rotX: number, rotY: number): void {
    if (this.worldEl) {
      this.worldEl.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`
    }
  }

  updateGap(_gap: number): void {
    // Gap changes require re-render — handled by Boxels class calling render()
  }

  updateOpacity(opacity: number): void {
    if (this.worldEl) {
      this.worldEl.style.setProperty('--face-opacity', String(opacity))
    }
  }

  setBoxelTransform(key: string, translate: Vec3, scale?: number, opacity?: number): void {
    if (!this.worldEl) return
    // Search within the world container (which now has a group child)
    const el = this.worldEl.querySelector(`[data-boxel="${key}"]`) as HTMLElement | null
    if (!el) return
    const current = el.style.transform
    if (translate[0] !== 0 || translate[1] !== 0 || translate[2] !== 0) {
      el.style.transform = current + ` translate3d(${translate[0]}px, ${-translate[1]}px, ${translate[2]}px)`
    }
    if (scale !== undefined) {
      el.style.transform += ` scale(${scale})`
    }
    if (opacity !== undefined) {
      el.style.opacity = String(opacity)
    }
  }

  getWorldContainer(): HTMLElement | null {
    return this.worldEl
  }

  getOrbitState(): { rotX: number; rotY: number; scale: number } {
    if (this.orbitControls) return this.orbitControls.getState()
    const [rx, ry] = this.options.cameraRotation ?? [-25, 35]
    return { rotX: rx, rotY: ry, scale: 1 }
  }

  dispose(): void {
    this.unmount()
  }
}
