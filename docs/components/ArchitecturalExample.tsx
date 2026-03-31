import { useCallback } from 'react'
import { ExamplePage, type ExamplePageProps } from './ExamplePage'
import type { Boxels } from 'boxels'
import type { ControlsState } from './ControlsPanel'

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
      setup={setup}
    />
  )
}
