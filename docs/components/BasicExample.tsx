import { ExamplePage, type ExamplePageProps } from './ExamplePage'

type Props = Omit<ExamplePageProps, 'title' | 'description' | 'code' | 'setup'>

export function BasicExample(props: Props) {
  return (
    <ExamplePage
      {...props}
      title="Basic"
      description="Drag to rotate, scroll to zoom."
    />
  )
}
