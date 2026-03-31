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
  voxelSize: number,
  style: ResolvedFaceStyle,
  edges: EdgeVisibility,
  edgeWidth: number,
  edgeColor: string,
  showBackfaces?: boolean,
): HTMLDivElement {
  const el = document.createElement('div')
  el.dataset.face = face
  el.style.position = 'absolute'
  el.style.width = `${voxelSize}px`
  el.style.height = `${voxelSize}px`
  el.style.transform = FACE_TRANSFORMS[face](voxelSize)
  el.style.backfaceVisibility = showBackfaces ? 'visible' : 'hidden'
  el.style.boxSizing = 'border-box'

  el.style.backgroundColor = style.fill
  el.style.opacity = String(style.opacity)
  if (style.backdropFilter) {
    el.style.backdropFilter = style.backdropFilter
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
  voxelSize: number,
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
  container.style.position = 'absolute'
  container.style.width = `${voxelSize}px`
  container.style.height = `${voxelSize}px`
  container.style.transformStyle = 'preserve-3d'

  const [x, y, z] = position
  const offset = voxelSize + gap
  container.style.transform = `translate3d(${x * offset}px, ${-y * offset}px, ${z * offset}px)`

  for (const face of faces) {
    const faceEl = createFaceElement(face.name, voxelSize, face.style, face.edges, edgeWidth, edgeColor, showBackfaces)
    container.appendChild(faceEl)
  }

  return container
}
