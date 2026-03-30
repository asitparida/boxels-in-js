import { ExamplePage, type ExamplePageProps } from './ExamplePage'

const CODE = `import { Boxels } from 'boxels'

const b = new Boxels({
  voxelSize: 20,
  gap: 0,
  style: Boxels.presets.gradient(10, 10, 10),
})

b.addBox({ position: [0, 0, 0], size: [10, 10, 10] })
b.mount(document.getElementById('scene'))`

type Props = Omit<ExamplePageProps, 'title' | 'description' | 'code' | 'setup'>

export function PerformanceExample(props: Props) {
  return (
    <ExamplePage
      {...props}
      title="Performance"
      description="1,000 boxels with edge fusion. Internal faces culled from DOM."
      code={CODE}
    />
  )
}
