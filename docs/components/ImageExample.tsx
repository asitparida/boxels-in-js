import { useRef, useCallback, useState } from 'react'
import { type ExamplePageProps, generateCode } from './ExamplePage'
import { CodeDrawer } from './CodeDrawer'
import { useBoxelScene } from './useBoxelScene'

import landscapeUrl from '../assets/landscape.jpg'

type Props = Pick<ExamplePageProps, 'controls' | 'onControlsChange' | 'explodeTrigger' | 'collapseTrigger'>

export function ImageExample({ controls }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showCode, setShowCode] = useState(true)
  const afterMount = useCallback((b: import('boxels').Boxels) => {
    b.mapImage(landscapeUrl)
  }, [])

  useBoxelScene(containerRef, controls, afterMount)

  const code = generateCode(controls, `b.mapImage('landscape.jpg')`)

  return (
    <div className="example-page">
      <div className="scene-area">
        <div className="scene-header">
          <span className="scene-title">Image Across</span>
          <span className="scene-desc">One image distributed across all exposed faces</span>
          <button className="code-toggle" onClick={() => setShowCode(!showCode)}>
            {showCode ? 'Hide code' : 'Show code'}
          </button>
        </div>
        <div ref={containerRef} className="scene-container" />
      </div>
      <CodeDrawer code={code} visible={showCode} />
    </div>
  )
}
