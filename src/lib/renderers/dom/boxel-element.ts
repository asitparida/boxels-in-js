import type { FaceName, ResolvedFaceStyle, EdgeVisibility, Vec3 } from '../../types'
import { applyEdgeBorders } from './edge-borders'

const FACE_TRANSFORMS: Record<FaceName, (size: number) => string> = {
  front:  (s) => `translateZ(${s / 2}px)`,
  back:   (s) => `rotateY(180deg) translateZ(${s / 2}px)`,
  left:   (s) => `rotateY(-90deg) translateZ(${s / 2}px)`,
  right:  (s) => `rotateY(90deg) translateZ(${s / 2}px)`,
  top:    (s) => `rotateX(90deg) translateZ(${s / 2}px)`,
  bottom: (s) => `rotateX(-90deg) translateZ(${s / 2}px)`,
}

export function createFaceElement(
  face: FaceName,
  boxelSize: number,
  style: ResolvedFaceStyle,
  edges: EdgeVisibility,
  edgeWidth: number,
  edgeColor: string,
  showBackfaces?: boolean,
): HTMLDivElement {
  const el = document.createElement('div')
  el.dataset.face = face
  el.dataset.faceIndex = face
  el.style.position = 'absolute'
  el.style.width = `${boxelSize}px`
  el.style.height = `${boxelSize}px`
  el.style.transform = FACE_TRANSFORMS[face](boxelSize)
  el.style.backfaceVisibility = showBackfaces ? 'visible' : 'hidden'
  el.style.boxSizing = 'border-box'
  // GPU: promote face to its own compositor layer
  el.style.willChange = 'transform'
  el.style.contain = 'layout style paint'

  el.style.backgroundColor = style.fill
  el.style.opacity = String(style.opacity)
  if (style.backdropFilter) {
    el.style.backdropFilter = style.backdropFilter
    el.style.webkitBackdropFilter = style.backdropFilter
  }
  if (style.className) {
    el.className = style.className
  }

  const resolvedColor = style.stroke !== 'transparent' ? style.stroke : edgeColor
  applyEdgeBorders(el, edges, edgeWidth, resolvedColor)

  return el
}

export function createBoxelElement(
  position: Vec3,
  boxelSize: number,
  gap: number,
  faces: Array<{
    name: FaceName
    style: ResolvedFaceStyle
    edges: EdgeVisibility
  }>,
  edgeWidth: number,
  edgeColor: string,
  showBackfaces?: boolean,
): HTMLDivElement {
  const container = document.createElement('div')
  container.dataset.boxel = `${position[0]},${position[1]},${position[2]}`
  container.dataset.x = String(position[0])
  container.dataset.y = String(position[1])
  container.dataset.z = String(position[2])
  container.style.position = 'absolute'
  container.style.width = `${boxelSize}px`
  container.style.height = `${boxelSize}px`
  container.style.transformStyle = 'preserve-3d'
  // GPU: promote boxel container to its own layer for efficient transform updates
  container.style.willChange = 'transform'

  const [x, y, z] = position
  const offset = boxelSize + gap
  container.style.transform = `translate3d(${x * offset}px, ${-y * offset}px, ${z * offset}px)`

  for (const face of faces) {
    const faceEl = createFaceElement(face.name, boxelSize, face.style, face.edges, edgeWidth, edgeColor, showBackfaces)
    container.appendChild(faceEl)
  }

  return container
}
