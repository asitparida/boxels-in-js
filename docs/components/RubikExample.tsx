import { ExamplePage, type ExamplePageProps } from './ExamplePage'

type Props = Omit<ExamplePageProps, 'title' | 'description' | 'code' | 'setup'>

export function RubikExample(props: Props) {
  return (
    <ExamplePage
      {...props}
      title="Rubik's Cube"
      description="Classic Rubik's cube colors with gap between boxels."
    />
  )
}
