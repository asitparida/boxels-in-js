import { ExamplePage, type ExamplePageProps } from './ExamplePage'

const CODE = `import { Boxels } from 'boxels'

const b = new Boxels({
  voxelSize: 60,
  gap: 2,
  camera: { rotation: [-25, 35] },
  style: Boxels.presets.xray(4, 4, 4),
})

b.addBox({ position: [0, 0, 0], size: [4, 4, 4] })
b.mount(document.getElementById('scene'))`

type Props = Omit<ExamplePageProps, 'title' | 'description' | 'code' | 'setup'>

export function BasicExample(props: Props) {
  return (
    <ExamplePage
      {...props}
      title="Basic"
      description="Drag to rotate, scroll to zoom."
      code={CODE}
    />
  )
}
