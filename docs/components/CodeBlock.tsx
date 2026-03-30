import { useEffect, useRef } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-javascript'

interface Props {
  code: string
  language?: 'typescript' | 'javascript'
}

export function CodeBlock({ code, language = 'typescript' }: Props) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (ref.current) Prism.highlightElement(ref.current)
  }, [code, language])

  return (
    <pre className="code-block">
      <code ref={ref} className={`language-${language}`}>
        {code}
      </code>
    </pre>
  )
}
