import { useCallback } from 'react'
import { ExamplePage, type ExamplePageProps } from './ExamplePage'
import type { Boxels } from 'boxels'
import type { ControlsState } from './ControlsPanel'

const CODE = `import { Boxels } from 'boxels'

const b = new Boxels({
  boxelSize: 60,
  gap: 4,
  style: Boxels.presets.glass(4, 4, 4),
})

b.addBox({ position: [0, 0, 0], size: [4, 4, 4] })
b.addSphere({ center: [2, 2, 2], radius: 1.5, mode: 'subtract' })

b.mount(document.getElementById('scene'))`

type Props = Omit<ExamplePageProps, 'title' | 'description' | 'code' | 'setup'>

export function GlassExample(props: Props) {
  const setup = useCallback((b: Boxels, state: ControlsState) => {
    b.addBox({ position: [0, 0, 0], size: [state.sizeX, state.sizeY, state.sizeZ] })
    const cx = Math.floor(state.sizeX / 2)
    const cy = Math.floor(state.sizeY / 2)
    const cz = Math.floor(state.sizeZ / 2)
    const r = Math.min(cx, cy, cz) * 0.75
    if (r >= 1) {
      b.addSphere({ center: [cx, cy, cz], radius: r, mode: 'subtract' })
    }
  }, [])

  return (
    <ExamplePage
      {...props}
      title="Glass"
      description="Translucent boxels with backdrop-filter blur and carved sphere."
      code={CODE}
      setup={setup}
    />
  )
}
