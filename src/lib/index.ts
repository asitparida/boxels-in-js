import type {
  BoxelsOptions, BoxelStyle, BoxelEvent, BoxelEventType, Vec3,
  AddBoxOptions, AddSphereOptions, AddLineOptions,
  RemoveBoxOptions, RemoveSphereOptions, StyleBoxOptions,
  RotateOptions, ExplodeOptions, LayerRotateOptions, TweenOptions,
  AnimateEachCallback, AnimateEachOptions,
  Boxel, FaceName, BoxelRenderer,
} from './types'
import { BoxelGrid } from './core/grid'
import { applyBoolean } from './core/boolean'
import { generateBox, generateSphere, generateLine } from './core/geometry'
import { rotateGrid } from './core/rotation'
import { computeImageMap } from './core/image-mapper'
import { DOMRenderer } from './renderers/dom/dom-renderer'
import { createAxesElement } from './renderers/dom/axes'
import { Animator } from './animation/animator'
import { createExplodeAnimation } from './animation/explode'
import { createLayerRotateAnimation } from './animation/layer-rotate'
import { createGapTween, createOpacityTween, createEachTween } from './animation/tweens'
import { presets } from './presets/styles'
import { createTextureStyle, ALL_TEXTURES, type TextureName } from './core/textures'

export type {
  BoxelsOptions, BoxelStyle, BoxelEvent, BoxelEventType, Vec3,
  AddBoxOptions, AddSphereOptions, AddLineOptions,
  RemoveBoxOptions, RemoveSphereOptions, StyleBoxOptions,
  RotateOptions, ExplodeOptions, LayerRotateOptions, TweenOptions,
  AnimateEachCallback, AnimateEachOptions,
  Boxel, FaceName, BoxelRenderer,
}

type EventCallback = (event: BoxelEvent | Event) => void

export type { TextureName }
export { ALL_TEXTURES }

export class Boxels {
  static presets = presets
  static textures = ALL_TEXTURES

  private grid: BoxelGrid
  private renderer: BoxelRenderer
  private animator: Animator
  private options: { boxelSize: number; gap: number; edgeWidth: number; edgeColor: string; showBackfaces: boolean }
  private globalStyle?: BoxelStyle
  private listeners: Map<BoxelEventType, Set<EventCallback>> = new Map()
  private mounted = false
  private eventsBound = false

  constructor(options: BoxelsOptions = {}) {
    this.grid = new BoxelGrid()
    this.animator = new Animator()
    this.options = {
      boxelSize: options.boxelSize ?? 50,
      gap: options.gap ?? 0,
      edgeWidth: options.edgeWidth ?? 1,
      edgeColor: options.edgeColor ?? '#333',
      showBackfaces: options.showBackfaces ?? false,
    }
    this.globalStyle = options.style

    this.renderer = new DOMRenderer({
      orbit: options.orbit ?? true,
      zoom: options.zoom ?? true,
      cameraRotation: options.camera?.rotation,
      cameraDistance: options.camera?.distance,
      position: options.position,
    })

    if (options.container) {
      this.mount(options.container)
    }
  }

  // ── Lifecycle ──

  mount(container: HTMLElement): void {
    this.renderer.mount(container)
    this.mounted = true
    this.renderScene()
  }

  unmount(): void {
    this.animator.cancelAll()
    this.renderer.unmount()
    this.mounted = false
    this.eventsBound = false
  }

  // ── Manipulation ──

  addBox(opts: AddBoxOptions): void {
    const positions = generateBox(opts.position, opts.size)
    applyBoolean(this.grid, positions, opts.mode ?? 'union', opts.style)
    this.renderScene()
  }

  removeBox(opts: RemoveBoxOptions): void {
    const positions = generateBox(opts.position, opts.size)
    applyBoolean(this.grid, positions, 'subtract')
    this.renderScene()
  }

  addSphere(opts: AddSphereOptions): void {
    const positions = generateSphere(opts.center, opts.radius)
    applyBoolean(this.grid, positions, opts.mode ?? 'union', opts.style)
    this.renderScene()
  }

  removeSphere(opts: RemoveSphereOptions): void {
    const positions = generateSphere(opts.center, opts.radius)
    applyBoolean(this.grid, positions, 'subtract')
    this.renderScene()
  }

  addLine(opts: AddLineOptions): void {
    const positions = generateLine(opts.from, opts.to, opts.radius)
    applyBoolean(this.grid, positions, opts.mode ?? 'union', opts.style)
    this.renderScene()
  }

  setBoxel(position: Vec3, value: boolean): void {
    const [x, y, z] = position
    if (value) {
      this.grid.setBoxel(x, y, z, { position, opaque: true })
    } else {
      this.grid.setBoxel(x, y, z, null)
    }
    this.renderScene()
  }

  hasBoxel(position: Vec3): boolean {
    return this.grid.hasBoxel(position[0], position[1], position[2])
  }

  getBoxel(position: Vec3): Boxel | null {
    return this.grid.getBoxel(position[0], position[1], position[2])
  }

  clear(): void {
    this.grid.clear()
    this.renderScene()
  }

  // ── Rotation ──

  rotate(opts: RotateOptions): void {
    rotateGrid(this.grid, opts.axis, opts.turns, opts.center)
    this.renderScene()
  }

  // ── Iteration ──

  forEach(fn: (boxel: Boxel, position: Vec3) => void): void {
    this.grid.forEach(fn)
  }

  getNeighbors(position: Vec3): Record<FaceName, Boxel | null> {
    return this.grid.getNeighbors(position[0], position[1], position[2])
  }

  getExposure(position: Vec3): number {
    return this.grid.getExposure(position[0], position[1], position[2])
  }

  // ── Camera ──

  getWorldContainer(): HTMLElement | null {
    return this.renderer.getWorldContainer()
  }

  updateTransform(rotX: number, rotY: number): void {
    this.renderer.updateTransform(rotX, rotY)
  }

  getRotation(): { rotX: number; rotY: number } {
    const r = this.renderer as import('./renderers/dom/dom-renderer').DOMRenderer
    if (r.getOrbitState) {
      const s = r.getOrbitState()
      return { rotX: s.rotX, rotY: s.rotY }
    }
    return { rotX: -25, rotY: 35 }
  }

  // ── Positioning ──

  setPosition(options: import('./types').PositionOptions): void {
    const r = this.renderer as import('./renderers/dom/dom-renderer').DOMRenderer
    const scene = r.getSceneElement?.()
    if (!scene) return
    scene.style.position = options.fixed ? 'fixed' : 'absolute'
    if (options.x !== undefined) scene.style.left = typeof options.x === 'number' ? `${options.x}px` : options.x
    if (options.y !== undefined) scene.style.top = typeof options.y === 'number' ? `${options.y}px` : options.y
    if (options.zIndex !== undefined) scene.style.zIndex = String(options.zIndex)
  }

  // ── Auto-rotate ──

  private spinRafId: number | null = null

  startSpin(options: { x?: boolean; y?: boolean; xDir?: 1 | -1; yDir?: 1 | -1; speed?: number } = {}): void {
    this.stopSpin()
    const xOn = options.x ?? false
    const yOn = options.y ?? true
    const xDir = options.xDir ?? 1
    const yDir = options.yDir ?? 1
    const speed = (options.speed ?? 1) * 0.5

    const tick = () => {
      const cur = this.getRotation()
      let rx = cur.rotX, ry = cur.rotY
      if (xOn) rx += speed * xDir
      if (yOn) ry += speed * yDir
      this.updateTransform(rx, ry)
      this.spinRafId = requestAnimationFrame(tick)
    }
    this.spinRafId = requestAnimationFrame(tick)
  }

  stopSpin(): void {
    if (this.spinRafId !== null) {
      cancelAnimationFrame(this.spinRafId)
      this.spinRafId = null
    }
  }

  // ── Axes ──

  showAxes(): void {
    this.hideAxes()
    const world = this.renderer.getWorldContainer()
    if (!world) return
    const bounds = this.grid.getBounds()
    const maxDim = Math.max(
      bounds.max[0] - bounds.min[0] + 1,
      bounds.max[1] - bounds.min[1] + 1,
      bounds.max[2] - bounds.min[2] + 1,
    )
    const halfLen = maxDim * (this.options.boxelSize + this.options.gap) * 0.8
    world.appendChild(createAxesElement(halfLen))
  }

  hideAxes(): void {
    const world = this.renderer.getWorldContainer()
    if (!world) return
    world.querySelectorAll('.boxel-axes').forEach((el) => el.remove())
  }

  // ── Styling ──

  styleBox(opts: StyleBoxOptions): void {
    const positions = generateBox(opts.position, opts.size)
    for (const [x, y, z] of positions) {
      const existing = this.grid.getBoxel(x, y, z)
      if (existing) {
        this.grid.setBoxel(x, y, z, { ...existing, style: opts.style })
      }
    }
    this.renderScene()
  }

  // ── Textures ──

  setTexture(texture: TextureName, hue: number = 220, opacity: number = 1): void {
    const bounds = this.grid.getBounds()
    const w = bounds.max[0] - bounds.min[0] + 1
    const h = bounds.max[1] - bounds.min[1] + 1
    const d = bounds.max[2] - bounds.min[2] + 1
    this.globalStyle = createTextureStyle(texture, hue, opacity, w, h, d)
    this.renderScene()
  }

  // ── Image mapping ──

  mapImage(imageUrl: string, targetFace?: FaceName): void {
    const slices = computeImageMap(this.grid, targetFace)
    const world = this.renderer.getWorldContainer()
    if (!world) return
    for (const slice of slices) {
      const key = `${slice.position[0]},${slice.position[1]},${slice.position[2]}`
      const faceEl = world.querySelector(
        `[data-boxel="${key}"] [data-face="${slice.face}"]`,
      ) as HTMLElement | null
      if (faceEl) {
        faceEl.style.backgroundImage = `url(${imageUrl})`
        faceEl.style.backgroundSize = slice.backgroundSize
        faceEl.style.backgroundPosition = slice.backgroundPosition
      }
    }
  }

  clearImage(): void {
    const world = this.renderer.getWorldContainer()
    if (!world) return
    const faces = world.querySelectorAll<HTMLElement>('[data-face]')
    faces.forEach((el) => {
      el.style.backgroundImage = ''
      el.style.backgroundSize = ''
      el.style.backgroundPosition = ''
    })
  }

  // ── Animation ──

  explode(opts: ExplodeOptions = {}): void {
    createExplodeAnimation(
      this.grid, this.renderer, this.animator,
      this.options.boxelSize, opts,
    )
  }

  collapse(): void {
    this.renderScene()
  }

  rotateLayer(opts: LayerRotateOptions): void {
    createLayerRotateAnimation(
      this.grid, this.renderer, this.animator, opts,
      () => this.renderScene(),
    )
  }

  animateGap(opts: TweenOptions): void {
    createGapTween(this.animator, (gap) => {
      this.options.gap = gap
      this.renderScene()
    }, opts)
  }

  animateOpacity(opts: TweenOptions): void {
    createOpacityTween(this.animator, this.renderer, opts)
  }

  animateEach(callback: AnimateEachCallback, opts?: AnimateEachOptions): void {
    createEachTween(
      this.grid, this.renderer, this.animator,
      this.options.boxelSize, callback, opts,
    )
  }

  // ── Click interaction ──

  private clickEnabled = false
  private clickHandler: ((info: { boxel: Vec3; face: string }) => void) | null = null
  private boundClickListener: ((e: Event) => void) | null = null

  enableClick(handler: (info: { boxel: Vec3; face: string }) => void): void {
    this.disableClick()
    this.clickEnabled = true
    this.clickHandler = handler

    // Stop spin when click is enabled
    this.stopSpin()

    const world = this.renderer.getWorldContainer()
    if (!world) return

    world.style.cursor = 'pointer'

    this.boundClickListener = (e: Event) => {
      const target = e.target as HTMLElement
      const faceEl = target.closest('[data-face]') as HTMLElement | null
      if (!faceEl) return
      const boxelEl = faceEl.closest('[data-boxel]') as HTMLElement | null
      if (!boxelEl) return

      const pos = boxelEl.dataset.boxel!.split(',').map(Number) as Vec3
      const face = faceEl.dataset.face!

      // Dip animation: scale down then back
      const origTransform = boxelEl.style.transform
      boxelEl.style.transition = 'transform 0.15s ease-in'
      boxelEl.style.transform = origTransform + ' scale(0.85)'

      setTimeout(() => {
        boxelEl.style.transition = 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
        boxelEl.style.transform = origTransform
        setTimeout(() => {
          boxelEl.style.transition = ''
        }, 250)
      }, 150)

      this.clickHandler?.({ boxel: pos, face })
    }

    world.addEventListener('click', this.boundClickListener)
  }

  disableClick(): void {
    if (!this.clickEnabled) return
    const world = this.renderer.getWorldContainer()
    if (world) {
      world.style.cursor = ''
      if (this.boundClickListener) {
        world.removeEventListener('click', this.boundClickListener)
      }
    }
    this.clickEnabled = false
    this.clickHandler = null
    this.boundClickListener = null
  }

  // ── Events ──

  on(event: BoxelEventType, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: BoxelEventType, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback)
  }

  // ── Private ──

  private renderScene(): void {
    if (!this.mounted) return
    this.renderer.render({
      grid: this.grid,
      boxelSize: this.options.boxelSize,
      gap: this.options.gap,
      edgeWidth: this.options.edgeWidth,
      edgeColor: this.options.edgeColor,
      globalStyle: this.globalStyle,
      showBackfaces: this.options.showBackfaces,
    })
    if (!this.eventsBound) {
      this.setupFaceEvents()
      this.eventsBound = true
    }
    this.emit('render', new Event('render'))
  }

  private setupFaceEvents(): void {
    const world = this.renderer.getWorldContainer()
    if (!world) return

    world.addEventListener('click', (e) => {
      const event = this.buildBoxelEvent(e)
      if (event) this.emit('boxel:click', event)
    })

    world.addEventListener('pointerover', (e) => {
      const event = this.buildBoxelEvent(e)
      if (event) this.emit('boxel:hover', event)
    })

    world.addEventListener('pointerdown', (e) => {
      const event = this.buildBoxelEvent(e)
      if (event) this.emit('boxel:pointerdown', event)
    })
  }

  private buildBoxelEvent(e: Event): BoxelEvent | null {
    const faceEl = (e.target as HTMLElement).closest('[data-face]') as HTMLElement | null
    if (!faceEl) return null
    const boxelEl = faceEl.closest('[data-boxel]') as HTMLElement | null
    if (!boxelEl) return null
    const pos = boxelEl.dataset.boxel!.split(',').map(Number) as Vec3
    const face = faceEl.dataset.face as FaceName
    const boxel = this.grid.getBoxel(pos[0], pos[1], pos[2])
    if (!boxel) return null
    return { boxel, position: pos, face, originalEvent: e }
  }

  private emit(event: BoxelEventType, data: BoxelEvent | Event): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      for (const cb of callbacks) {
        cb(data)
      }
    }
  }
}
