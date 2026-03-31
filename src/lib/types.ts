export type FaceName = 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right'

export interface EdgeVisibility {
  left: boolean
  right: boolean
  top: boolean
  bottom: boolean
}

export type StyleValue = string | ((x: number, y: number, z: number) => string)

export interface FaceStyle {
  fill?: StyleValue
  stroke?: StyleValue
  opacity?: number
  className?: string
  backdropFilter?: string
}

export type FaceStyleOrFn = FaceStyle | ((x: number, y: number, z: number) => FaceStyle)

export interface BoxelStyle {
  default?: FaceStyleOrFn
  top?: FaceStyleOrFn
  bottom?: FaceStyleOrFn
  front?: FaceStyleOrFn
  back?: FaceStyleOrFn
  left?: FaceStyleOrFn
  right?: FaceStyleOrFn
}

export interface ResolvedFaceStyle {
  fill: string
  stroke: string
  opacity: number
  className?: string
  backdropFilter?: string
}

export interface Boxel {
  position: [number, number, number]
  style?: BoxelStyle
  meta?: Record<string, unknown>
  opaque: boolean
}

export type Vec3 = [number, number, number]

export type BooleanMode = 'union' | 'subtract' | 'intersect' | 'exclude'

export interface AddBoxOptions {
  position: Vec3
  size: Vec3
  mode?: BooleanMode
  style?: BoxelStyle
}

export interface AddSphereOptions {
  center: Vec3
  radius: number
  mode?: BooleanMode
  style?: BoxelStyle
}

export interface AddLineOptions {
  from: Vec3
  to: Vec3
  radius?: number
  mode?: BooleanMode
  style?: BoxelStyle
}

export interface RemoveBoxOptions {
  position: Vec3
  size: Vec3
}

export interface RemoveSphereOptions {
  center: Vec3
  radius: number
}

export interface StyleBoxOptions {
  position: Vec3
  size: Vec3
  style: BoxelStyle
}

export interface RotateOptions {
  axis: 'x' | 'y' | 'z'
  turns: number
  center?: Vec3
}

export interface CameraOptions {
  type?: 'perspective' | 'orthographic'
  distance?: number
  rotation?: [number, number]
}

export interface PositionOptions {
  x?: number | string        // CSS left value (px or %, e.g. 100 or '50%')
  y?: number | string        // CSS top value
  zIndex?: number
  fixed?: boolean            // true = position: fixed, false = position: absolute
}

export type PositionPreset =
  | 'center'
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'

export interface BoxelsOptions {
  renderer?: 'dom'
  container?: HTMLElement
  boxelSize?: number
  gap?: number
  edgeWidth?: number
  edgeColor?: string
  camera?: CameraOptions
  style?: BoxelStyle
  orbit?: boolean
  zoom?: boolean
  showBackfaces?: boolean
  position?: PositionOptions
}

export interface BoxelEvent {
  boxel: Boxel
  position: Vec3
  face: FaceName
  originalEvent: Event
}

export type BoxelEventType =
  | 'boxel:click'
  | 'boxel:hover'
  | 'boxel:pointerdown'
  | 'rotate'
  | 'zoom'
  | 'render'

export interface ExplodeOptions {
  factor?: number
  stagger?: number
  easing?: string
  duration?: number
}

export interface LayerRotateOptions {
  axis: 'x' | 'y' | 'z'
  layer: number
  direction: 1 | -1
  duration?: number
}

export interface TweenOptions {
  from: number
  to: number
  duration?: number
  easing?: string
}

export interface AnimateEachCallback {
  (boxel: Boxel, position: Vec3, t: number): {
    translate?: Vec3
    opacity?: number
    scale?: number
  }
}

export interface AnimateEachOptions {
  duration?: number
  loop?: boolean
  easing?: string
}

export interface ImageMapOptions {
  src: string | HTMLImageElement | HTMLCanvasElement
  layout: 'cross' | 'strip' | 'per-face'
  faces?: Partial<Record<FaceName, string | HTMLImageElement | HTMLCanvasElement>>
}

export interface BoxelRenderer {
  mount(container: HTMLElement): void
  unmount(): void
  render(options: RenderOptions): void
  updateTransform(rotX: number, rotY: number): void
  updateGap(gap: number): void
  updateOpacity(opacity: number): void
  setBoxelTransform(key: string, translate: Vec3, scale?: number, opacity?: number): void
  getWorldContainer(): HTMLElement | null
  dispose(): void
}

export interface RenderOptions {
  grid: import('./core/grid').BoxelGrid
  boxelSize: number
  gap: number
  edgeWidth: number
  edgeColor: string
  globalStyle?: BoxelStyle
  showBackfaces?: boolean
}
