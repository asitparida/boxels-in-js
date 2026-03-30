import { useRef, useEffect, useCallback, useState } from 'react'
import { Boxels } from 'boxels'
import { type ControlsState } from './ControlsPanel'
import { CodeBlock } from './CodeBlock'

export interface ExamplePageProps {
  title: string
  description: string
  code: string
  controls: ControlsState
  explodeTrigger: number
  collapseTrigger: number
  setup?: (b: Boxels, state: ControlsState) => void
}

export function ExamplePage({
  title, description, code, controls, explodeTrigger, collapseTrigger, setup,
}: ExamplePageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<Boxels | null>(null)
  const lastExplode = useRef(0)
  const lastCollapse = useRef(0)
  const [showCode, setShowCode] = useState(false)

  const rebuild = useCallback(() => {
    if (!containerRef.current) return

    if (instanceRef.current) {
      instanceRef.current.unmount()
    }

    const style = controls.preset !== 'none'
      ? Boxels.presets[controls.preset as keyof typeof Boxels.presets](controls.sizeX, controls.sizeY, controls.sizeZ)
      : undefined

    const b = new Boxels({
      voxelSize: controls.boxelSize,
      gap: controls.gap,
      edgeWidth: controls.edgeWidth,
      camera: { rotation: [-25, 35] },
      style,
    })

    if (setup) {
      setup(b, controls)
    } else {
      b.addBox({ position: [0, 0, 0], size: [controls.sizeX, controls.sizeY, controls.sizeZ] })
    }

    b.mount(containerRef.current)
    instanceRef.current = b
  }, [controls, setup])

  useEffect(() => {
    rebuild()
    return () => {
      if (instanceRef.current) {
        instanceRef.current.unmount()
        instanceRef.current = null
      }
    }
  }, [rebuild])

  useEffect(() => {
    if (explodeTrigger > lastExplode.current) {
      instanceRef.current?.explode({ factor: 2.2, duration: 800 })
    }
    lastExplode.current = explodeTrigger
  }, [explodeTrigger])

  useEffect(() => {
    if (collapseTrigger > lastCollapse.current) {
      instanceRef.current?.collapse()
    }
    lastCollapse.current = collapseTrigger
  }, [collapseTrigger])

  return (
    <div className="example-page">
      <div className="scene-area">
        <div className="scene-header">
          <span className="scene-title">{title}</span>
          <span className="scene-desc">{description}</span>
          <button
            className="code-toggle"
            onClick={() => setShowCode(!showCode)}
          >
            {showCode ? 'Hide code' : 'Show code'}
          </button>
        </div>
        <div ref={containerRef} className="scene-container" />
      </div>
      {showCode && (
        <div className="code-drawer">
          <CodeBlock code={code} />
        </div>
      )}
    </div>
  )
}
