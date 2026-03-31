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

export type {
  BoxelsOptions, BoxelStyle, BoxelEvent, BoxelEventType, Vec3,
  AddBoxOptions, AddSphereOptions, AddLineOptions,
  RemoveBoxOptions, RemoveSphereOptions, StyleBoxOptions,
  RotateOptions, ExplodeOptions, LayerRotateOptions, TweenOptions,
  AnimateEachCallback, AnimateEachOptions,
  Boxel, FaceName, BoxelRenderer,
}

type EventCallback = (event: BoxelEvent | Event) => void

export class Boxels {
  static presets = presets

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
