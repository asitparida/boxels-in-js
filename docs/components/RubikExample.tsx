import { useCallback } from 'react'
import { ExamplePage } from './ExamplePage'
import type { Boxels } from 'boxels'
import type { ControlsState } from './ControlsPanel'

const CODE = `import { Boxels } from 'boxels'

const b = new Boxels({
  voxelSize: 50,
  gap: 2,
  style: Boxels.presets.rubik(3, 3, 3),
})

b.addBox({ position: [0, 0, 0], size: [3, 3, 3] })
b.mount(document.getElementById('scene'))`

export function RubikExample() {
  const setup = useCallback((b: Boxels, state: ControlsState) => {
    b.addBox({ position: [0, 0, 0], size: [state.sizeX, state.sizeY, state.sizeZ] })
  }, [])

  return (
    <ExamplePage
      title="Rubik's Cube"
      description="Classic Rubik's cube colors with gap between boxels."
      code={CODE}
      defaultState={{ gap: 2, preset: 'rubik' }}
      setup={setup}
    />
  )
}
