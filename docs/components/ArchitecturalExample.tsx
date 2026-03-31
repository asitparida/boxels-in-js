import { useCallback } from 'react'
import { ExamplePage, type ExamplePageProps } from './ExamplePage'
import type { Boxels } from 'boxels'
import type { ControlsState } from './ControlsPanel'

const CODE = `import { Boxels } from 'boxels'

const b = new Boxels({
  boxelSize: 40,
  gap: 0,
  style: Boxels.presets.heerich(8, 8, 8),
})

b.addBox({ position: [0, 0, 0], size: [8, 8, 8] })
b.addBox({ position: [1, 1, 1], size: [6, 7, 6], mode: 'subtract' })
b.removeBox({ position: [0, 3, 2], size: [1, 3, 4] })

b.mount(document.getElementById('scene'))`

type Props = Omit<ExamplePageProps, 'title' | 'description' | 'code' | 'setup'>

export function ArchitecturalExample(props: Props) {
  const setup = useCallback((b: Boxels, state: ControlsState) => {
    b.addBox({ position: [0, 0, 0], size: [state.sizeX, state.sizeY, state.sizeZ] })
    if (state.sizeX > 2 && state.sizeY > 2 && state.sizeZ > 2) {
      b.addBox({
        position: [1, 1, 1],
        size: [state.sizeX - 2, state.sizeY - 1, state.sizeZ - 2],
        mode: 'subtract',
      })
    }
  }, [])

  return (
    <ExamplePage
      {...props}
      title="Architectural"
      description="Heerich-inspired sculpture with carved interior and edge fusion."
      code={CODE}
      setup={setup}
    />
  )
}
