import { useCallback } from 'react'
import { ExamplePage } from './ExamplePage'
import type { Boxels } from 'boxels'
import type { ControlsState } from './ControlsPanel'

const CODE = `import { Boxels } from 'boxels'

const b = new Boxels({
  voxelSize: 30,
  gap: 2,
  camera: { rotation: [-30, 45] },
})

const data = [3, 7, 5, 9, 4, 6]
data.forEach((height, i) => {
  b.addBox({
    position: [i * 2, 0, 0],
    size: [1, height, 1],
  })
})

b.mount(document.getElementById('scene'))`

export function DataVizExample() {
  const setup = useCallback((b: Boxels, _state: ControlsState) => {
    const data = [3, 7, 5, 9, 4, 6]
    const maxH = Math.max(...data)
    data.forEach((height, i) => {
      b.addBox({
        position: [i * 2, 0, 0],
        size: [1, height, 1],
        style: {
          default: (_x: number, y: number, _z: number) => {
            const hue = (i / data.length) * 280
            const lightness = 0.35 + (y / maxH) * 0.35
            return {
              fill: `oklch(${lightness} 0.18 ${hue})`,
              stroke: `oklch(${lightness - 0.08} 0.18 ${hue})`,
            }
          },
        },
      })
    })
  }, [])

  return (
    <ExamplePage
      title="Data Viz"
      description="A 3D bar chart built from boxels with position-based gradient coloring."
      code={CODE}
      defaultState={{ boxelSize: 30, gap: 2 }}
      setup={setup}
    />
  )
}
