import { useRef, useEffect, useState, useCallback } from 'react'
import { Boxels } from 'boxels'
import { ControlsPanel, type ControlsState } from './ControlsPanel'
import { CodeBlock } from './CodeBlock'

interface ExamplePageProps {
  title: string
  description: string
  code: string
  defaultState?: Partial<ControlsState>
  setup?: (b: Boxels, state: ControlsState) => void
}

const DEFAULT_STATE: ControlsState = {
  sizeX: 3,
  sizeY: 3,
  sizeZ: 3,
  gap: 0,
  boxelSize: 50,
  edgeWidth: 1,
  preset: 'none',
}

export function ExamplePage({ title, description, code, defaultState, setup }: ExamplePageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<Boxels | null>(null)
  const [state, setState] = useState<ControlsState>({ ...DEFAULT_STATE, ...defaultState })

  const rebuild = useCallback(() => {
    if (!containerRef.current) return

    if (instanceRef.current) {
      instanceRef.current.unmount()
    }

    const style = state.preset !== 'none'
      ? Boxels.presets[state.preset as keyof typeof Boxels.presets](state.sizeX, state.sizeY, state.sizeZ)
      : undefined

    const b = new Boxels({
      voxelSize: state.boxelSize,
      gap: state.gap,
      edgeWidth: state.edgeWidth,
      camera: { rotation: [-25, 35] },
      style,
    })

    if (setup) {
      setup(b, state)
    } else {
      b.addBox({ position: [0, 0, 0], size: [state.sizeX, state.sizeY, state.sizeZ] })
    }

    b.mount(containerRef.current)
    instanceRef.current = b
  }, [state, setup])

  useEffect(() => {
    rebuild()
    return () => {
      if (instanceRef.current) {
        instanceRef.current.unmount()
        instanceRef.current = null
      }
    }
  }, [rebuild])

  const handleExplode = () => {
    instanceRef.current?.explode({ factor: 2.2, duration: 800 })
  }

  const handleCollapse = () => {
    instanceRef.current?.collapse()
  }

  return (
    <div className="example-page">
      <div className="example-header">
        <h2>{title}</h2>
        <p className="description">{description}</p>
      </div>
      <div className="example-body">
        <div ref={containerRef} className="scene-container" />
        <ControlsPanel
          state={state}
          onChange={setState}
          onExplode={handleExplode}
          onCollapse={handleCollapse}
        />
      </div>
      <CodeBlock code={code} />
    </div>
  )
}
