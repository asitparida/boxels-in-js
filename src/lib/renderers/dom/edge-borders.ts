import type { EdgeVisibility } from '../../types'

export function applyEdgeBorders(
  faceEl: HTMLElement,
  edges: EdgeVisibility,
  edgeWidth: number,
  edgeColor: string,
): void {
  faceEl.style.borderStyle = 'solid'

  faceEl.style.borderLeftWidth = edges.left ? `${edgeWidth}px` : '0'
  faceEl.style.borderRightWidth = edges.right ? `${edgeWidth}px` : '0'
  faceEl.style.borderTopWidth = edges.top ? `${edgeWidth}px` : '0'
  faceEl.style.borderBottomWidth = edges.bottom ? `${edgeWidth}px` : '0'

  faceEl.style.borderLeftColor = edges.left ? edgeColor : 'transparent'
  faceEl.style.borderRightColor = edges.right ? edgeColor : 'transparent'
  faceEl.style.borderTopColor = edges.top ? edgeColor : 'transparent'
  faceEl.style.borderBottomColor = edges.bottom ? edgeColor : 'transparent'
}
