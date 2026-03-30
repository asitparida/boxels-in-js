import { useRef, useEffect, useState, useCallback } from 'react'
import { Boxels } from 'boxels'

const PRESET_NAMES = ['heerich', 'rubik', 'gradient', 'wireframe', 'xray', 'glass', 'marble', 'neon'] as const

export function BasicExample() {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<Boxels | null>(null)

  const [sizeX, setSizeX] = useState(3)
  const [sizeY, setSizeY] = useState(3)
  const [sizeZ, setSizeZ] = useState(3)
  const [gap, setGap] = useState(0)
  const [voxelSize, setVoxelSize] = useState(50)
  const [preset, setPreset] = useState<string>('none')
  const [edgeWidth, setEdgeWidth] = useState(1)

  const rebuild = useCallback(() => {
    if (!containerRef.current) return

    if (instanceRef.current) {
      instanceRef.current.unmount()
    }

    const style = preset !== 'none'
      ? Boxels.presets[preset as keyof typeof Boxels.presets](sizeX, sizeY, sizeZ)
      : undefined

    const b = new Boxels({
      voxelSize,
      gap,
      edgeWidth,
      camera: { rotation: [-25, 35] },
      style,
    })

    b.addBox({ position: [0, 0, 0], size: [sizeX, sizeY, sizeZ] })
    b.mount(containerRef.current)
    instanceRef.current = b
  }, [sizeX, sizeY, sizeZ, gap, voxelSize, preset, edgeWidth])

  useEffect(() => {
    rebuild()
    return () => {
      if (instanceRef.current) {
        instanceRef.current.unmount()
        instanceRef.current = null
      }
    }
  }, [rebuild])

  const handleExplode = () => {
    instanceRef.current?.explode({ factor: 2.2, duration: 800 })
  }

  const handleCollapse = () => {
    instanceRef.current?.collapse()
  }

  return (
    <div className="example-page">
      <h2>Basic</h2>
      <p className="description">
        Interactive boxel scene. Drag to rotate, scroll to zoom.
      </p>
      <div className="controls-bar">
        <label>
          <span>X</span>
          <input type="range" min={1} max={10} value={sizeX} onChange={(e) => setSizeX(+e.target.value)} />
          <span className="val">{sizeX}</span>
        </label>
        <label>
          <span>Y</span>
          <input type="range" min={1} max={10} value={sizeY} onChange={(e) => setSizeY(+e.target.value)} />
          <span className="val">{sizeY}</span>
        </label>
        <label>
          <span>Z</span>
          <input type="range" min={1} max={10} value={sizeZ} onChange={(e) => setSizeZ(+e.target.value)} />
          <span className="val">{sizeZ}</span>
        </label>
        <div className="control-sep" />
        <label>
          <span>Gap</span>
          <input type="range" min={0} max={20} value={gap} onChange={(e) => setGap(+e.target.value)} />
          <span className="val">{gap}</span>
        </label>
        <label>
          <span>Size</span>
          <input type="range" min={10} max={80} value={voxelSize} onChange={(e) => setVoxelSize(+e.target.value)} />
          <span className="val">{voxelSize}</span>
        </label>
        <label>
          <span>Edge</span>
          <input type="range" min={0} max={4} value={edgeWidth} onChange={(e) => setEdgeWidth(+e.target.value)} />
          <span className="val">{edgeWidth}</span>
        </label>
        <div className="control-sep" />
        <label>
          <span>Preset</span>
          <select value={preset} onChange={(e) => setPreset(e.target.value)}>
            <option value="none">default</option>
            {PRESET_NAMES.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
        <div className="control-sep" />
        <button onClick={handleExplode}>Explode</button>
        <button onClick={handleCollapse}>Collapse</button>
      </div>
      <div ref={containerRef} className="scene-container" />
    </div>
  )
}
