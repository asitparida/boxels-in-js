import { ExamplePage } from './ExamplePage'

const CODE = `import { Boxels } from 'boxels'

const b = new Boxels({
  voxelSize: 50,
  gap: 0,
  camera: { rotation: [-25, 35] },
})

b.addBox({ position: [0, 0, 0], size: [3, 3, 3] })
b.mount(document.getElementById('scene'))`

export function BasicExample() {
  return (
    <ExamplePage
      title="Basic"
      description="A 3x3x3 cube with default styling and orbit controls. Drag to rotate, scroll to zoom."
      code={CODE}
    />
  )
}
