function createLabel(text: string, color: string, transform: string): HTMLDivElement {
  const label = document.createElement('div')
  label.className = 'boxel-axis-label'
  label.textContent = text
  label.style.position = 'absolute'
  label.style.color = color
  label.style.fontSize = '16px'
  label.style.fontFamily = 'monospace'
  label.style.fontWeight = '700'
  label.style.transform = transform
  label.style.pointerEvents = 'none'
  label.style.textShadow = `0 0 16px ${color}, 0 2px 8px rgba(0,0,0,0.9)`
  label.style.whiteSpace = 'nowrap'
  return label
}

export function createAxesElement(halfLen: number): HTMLDivElement {
  const group = document.createElement('div')
  group.className = 'boxel-axes'
  group.style.position = 'absolute'
  group.style.transformStyle = 'preserve-3d'
  group.style.pointerEvents = 'none'

  const xColor = 'rgba(255, 100, 100, 0.9)'
  const yColor = 'rgba(100, 180, 255, 0.9)'
  const zColor = 'rgba(100, 255, 160, 0.9)'

  // X axis — Left / Right
  const xLine = document.createElement('div')
  xLine.style.position = 'absolute'
  xLine.style.width = `${halfLen * 2}px`
  xLine.style.height = '4px'
  xLine.style.background = `linear-gradient(90deg, transparent, ${xColor} 10%, ${xColor} 90%, transparent)`
  xLine.style.transform = `translate3d(${-halfLen}px, -2px, 2px)`
  group.appendChild(xLine)
  group.appendChild(createLabel('L', xColor, `translate3d(${-halfLen - 22}px, -10px, 2px)`))
  group.appendChild(createLabel('R', xColor, `translate3d(${halfLen + 8}px, -10px, 2px)`))

  // Y axis — Top / Bottom
  const yLine = document.createElement('div')
  yLine.style.position = 'absolute'
  yLine.style.width = '4px'
  yLine.style.height = `${halfLen * 2}px`
  yLine.style.background = `linear-gradient(180deg, transparent, ${yColor} 10%, ${yColor} 90%, transparent)`
  yLine.style.transform = `translate3d(-2px, ${-halfLen}px, 2px)`
  group.appendChild(yLine)
  group.appendChild(createLabel('T', yColor, `translate3d(-10px, ${-halfLen - 26}px, 2px)`))
  group.appendChild(createLabel('B', yColor, `translate3d(-10px, ${halfLen + 8}px, 2px)`))

  // Z axis — Front / Back
  // Horizontal line rotated 90° on Y to point along Z, centered at origin
  const zLine1 = document.createElement('div')
  zLine1.style.position = 'absolute'
  zLine1.style.width = `${halfLen * 2}px`
  zLine1.style.height = '4px'
  zLine1.style.left = `${-halfLen}px`
  zLine1.style.top = '-2px'
  zLine1.style.background = `linear-gradient(90deg, transparent, ${zColor} 10%, ${zColor} 90%, transparent)`
  zLine1.style.transformOrigin = `${halfLen}px 2px`
  zLine1.style.transform = 'rotateY(90deg)'
  group.appendChild(zLine1)

  // Vertical line rotated 90° on X to point along Z, centered at origin
  const zLine2 = document.createElement('div')
  zLine2.style.position = 'absolute'
  zLine2.style.width = '4px'
  zLine2.style.height = `${halfLen * 2}px`
  zLine2.style.left = '-2px'
  zLine2.style.top = `${-halfLen}px`
  zLine2.style.background = `linear-gradient(180deg, transparent, ${zColor} 10%, ${zColor} 90%, transparent)`
  zLine2.style.transformOrigin = `2px ${halfLen}px`
  zLine2.style.transform = 'rotateX(90deg)'
  group.appendChild(zLine2)

  group.appendChild(createLabel('F', zColor, `translate3d(-8px, -10px, ${halfLen + 12}px)`))
  group.appendChild(createLabel('Bk', zColor, `translate3d(-12px, -10px, ${-halfLen - 28}px)`))

  // Center dot
  const dot = document.createElement('div')
  dot.style.position = 'absolute'
  dot.style.width = '10px'
  dot.style.height = '10px'
  dot.style.borderRadius = '50%'
  dot.style.background = 'rgba(255,255,255,0.7)'
  dot.style.boxShadow = '0 0 12px rgba(255,255,255,0.5)'
  dot.style.transform = 'translate3d(-5px, -5px, 2px)'
  group.appendChild(dot)

  return group
}
