import { ExamplePage } from './ExamplePage'

const CODE = `import { Boxels } from 'boxels'

const b = new Boxels({
  voxelSize: 20,
  gap: 0,
  style: Boxels.presets.gradient(10, 10, 10),
})

b.addBox({ position: [0, 0, 0], size: [10, 10, 10] })

b.mount(document.getElementById('scene'))`

export function PerformanceExample() {
  return (
    <ExamplePage
      title="Performance"
      description="10x10x10 cube (1,000 boxels) with edge fusion. Internal faces are culled from the DOM."
      code={CODE}
      defaultState={{ sizeX: 10, sizeY: 10, sizeZ: 10, boxelSize: 20, preset: 'gradient' }}
    />
  )
}
