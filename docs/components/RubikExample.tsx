import { ExamplePage, type ExamplePageProps } from './ExamplePage'

const CODE = `import { Boxels } from 'boxels'

const b = new Boxels({
  voxelSize: 50,
  gap: 2,
  style: Boxels.presets.rubik(3, 3, 3),
})

b.addBox({ position: [0, 0, 0], size: [3, 3, 3] })
b.mount(document.getElementById('scene'))`

type Props = Omit<ExamplePageProps, 'title' | 'description' | 'code' | 'setup'>

export function RubikExample(props: Props) {
  return (
    <ExamplePage
      {...props}
      title="Rubik's Cube"
      description="Classic Rubik's cube colors with gap between boxels."
      code={CODE}
    />
  )
}
