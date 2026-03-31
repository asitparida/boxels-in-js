import { useRef, useCallback } from 'react'
import { type ExamplePageProps } from './ExamplePage'
import { useBoxelScene } from './useBoxelScene'

import landscapeUrl from '../assets/landscape.jpg'

type Props = Pick<ExamplePageProps, 'controls' | 'onControlsChange' | 'explodeTrigger' | 'collapseTrigger'>

export function ImageExample({ controls, onControlsChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const afterMount = useCallback((b: import('boxels').Boxels) => {
    b.mapImage(landscapeUrl)
  }, [])

  useBoxelScene(containerRef, controls, afterMount)

  return (
    <div className="example-page">
      <div className="scene-area">
        <div className="scene-header">
          <span className="scene-title">Image Across</span>
          <span className="scene-desc">One image distributed across all exposed faces</span>
        </div>
        <div ref={containerRef} className="scene-container" />
      </div>
    </div>
  )
}
