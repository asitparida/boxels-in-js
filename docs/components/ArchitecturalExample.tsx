import { useCallback } from 'react'
import { ExamplePage } from './ExamplePage'
import type { Boxels } from 'boxels'
import type { ControlsState } from './ControlsPanel'

const CODE = `import { Boxels } from 'boxels'

const b = new Boxels({
  voxelSize: 40,
  gap: 0,
  style: Boxels.presets.heerich(8, 8, 8),
})

b.addBox({ position: [0, 0, 0], size: [8, 8, 8] })
b.addBox({ position: [1, 1, 1], size: [6, 7, 6], mode: 'subtract' })
b.removeBox({ position: [0, 3, 2], size: [1, 3, 4] })
b.removeBox({ position: [7, 3, 2], size: [1, 3, 4] })

b.mount(document.getElementById('scene'))`

export function ArchitecturalExample() {
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
      title="Architectural"
      description="A Heerich-inspired sculpture with carved interior and edge fusion."
      code={CODE}
      defaultState={{ sizeX: 8, sizeY: 8, sizeZ: 8, boxelSize: 40, preset: 'heerich' }}
      setup={setup}
    />
  )
}
