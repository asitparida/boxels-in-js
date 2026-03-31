import { ExamplePage, type ExamplePageProps } from './ExamplePage'

type Props = Omit<ExamplePageProps, 'title' | 'description' | 'code' | 'setup'>

export function PerformanceExample(props: Props) {
  return (
    <ExamplePage
      {...props}
      title="Performance"
      description="1,000 boxels with edge fusion. Internal faces culled from DOM."
    />
  )
}
