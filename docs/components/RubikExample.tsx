import { useCallback } from 'react'
import { ExamplePage, type ExamplePageProps } from './ExamplePage'
import type { Boxels, FaceName } from 'boxels'
import type { ControlsState } from './ControlsPanel'

const RUBIK_COLORS: Record<FaceName, string> = {
  top:    '#ffff00',
  bottom: '#ffffff',
  front:  '#ff0000',
  back:   '#ff8c00',
  left:   '#00cc00',
  right:  '#0000ff',
}

function rubikStyle(texture: string, opacity: number): import('boxels').BoxelStyle {
  const op = opacity / 100
  const isTranslucent = ['glass', 'frosted', 'hologram'].includes(texture)
  const isHollow = texture === 'hollow'
  const isNeon = texture === 'neon'
  const isMatte = texture === 'matte'

  const result: import('boxels').BoxelStyle = {}
  for (const [face, color] of Object.entries(RUBIK_COLORS)) {
    result[face as FaceName] = {
      fill: isHollow ? 'transparent' : isNeon ? 'rgba(10,10,15,0.9)' : color,
      stroke: isNeon ? color : isHollow ? color : isMatte ? 'transparent' : '#222',
      opacity: isTranslucent ? op * 0.5 : op,
      backdropFilter: texture === 'glass' ? `blur(${Math.round(4 * op)}px)` :
                       texture === 'frosted' ? `blur(${Math.round(12 * op)}px)` : undefined,
    }
  }
  return result
}

type Props = Omit<ExamplePageProps, 'title' | 'description' | 'code' | 'setup'>

export function RubikExample(props: Props) {
  const setup = useCallback((b: Boxels, state: ControlsState) => {
    b.addBox({
      position: [0, 0, 0],
      size: [state.sizeX, state.sizeY, state.sizeZ],
      style: rubikStyle(state.texture, state.opacity),
    })
  }, [])

  return (
    <ExamplePage
      {...props}
      title="Rubik's Cube"
      description="Classic 6-color faces — texture effects applied to Rubik colors."
      setup={setup}
    />
  )
}
