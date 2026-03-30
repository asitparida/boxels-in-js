export interface OrbitState {
  rotX: number
  rotY: number
  scale: number
}

export type OrbitChangeCallback = (state: OrbitState) => void

export class OrbitControls {
  private rotX: number
  private rotY: number
  private scale: number
  private isDragging = false
  private lastPointerX = 0
  private lastPointerY = 0
  private onChange: OrbitChangeCallback
  private container: HTMLElement | null = null

  private boundPointerDown = this.onPointerDown.bind(this)
  private boundPointerMove = this.onPointerMove.bind(this)
  private boundPointerUp = this.onPointerUp.bind(this)
  private boundWheel = this.onWheel.bind(this)

  constructor(
    initialRotation: [number, number] = [-25, 35],
    onChange: OrbitChangeCallback,
  ) {
    this.rotX = initialRotation[0]
    this.rotY = initialRotation[1]
    this.scale = 1
    this.onChange = onChange
  }

  attach(container: HTMLElement): void {
    this.container = container
    container.addEventListener('pointerdown', this.boundPointerDown)
    container.addEventListener('wheel', this.boundWheel, { passive: false })
  }

  detach(): void {
    if (!this.container) return
    this.container.removeEventListener('pointerdown', this.boundPointerDown)
    this.container.removeEventListener('wheel', this.boundWheel)
    document.removeEventListener('pointermove', this.boundPointerMove)
    document.removeEventListener('pointerup', this.boundPointerUp)
    this.container = null
  }

  getState(): OrbitState {
    return { rotX: this.rotX, rotY: this.rotY, scale: this.scale }
  }

  private onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return
    this.isDragging = true
    this.lastPointerX = e.clientX
    this.lastPointerY = e.clientY
    document.addEventListener('pointermove', this.boundPointerMove)
    document.addEventListener('pointerup', this.boundPointerUp)
    e.preventDefault()
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.isDragging) return
    const dx = e.clientX - this.lastPointerX
    const dy = e.clientY - this.lastPointerY
    this.lastPointerX = e.clientX
    this.lastPointerY = e.clientY

    this.rotY += dx * 0.5
    this.rotX -= dy * 0.5
    this.rotX = Math.max(-90, Math.min(90, this.rotX))

    this.onChange({ rotX: this.rotX, rotY: this.rotY, scale: this.scale })
  }

  private onPointerUp(): void {
    this.isDragging = false
    document.removeEventListener('pointermove', this.boundPointerMove)
    document.removeEventListener('pointerup', this.boundPointerUp)
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.95 : 1.05
    this.scale = Math.max(0.1, Math.min(5, this.scale * delta))
    this.onChange({ rotX: this.rotX, rotY: this.rotY, scale: this.scale })
  }
}
