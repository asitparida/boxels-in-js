import { useRef } from 'react'

const TEXTURE_NAMES = ['solid', 'hollow', 'glass', 'frosted', 'matte', 'glossy', 'neon', 'paper', 'metal', 'hologram'] as const
const FACE_OPTIONS = ['all', 'top', 'bottom', 'front', 'back', 'left', 'right'] as const

export interface ControlsState {
  sizeX: number
  sizeY: number
  sizeZ: number
  gap: number
  boxelSize: number
  edgeWidth: number
  texture: string
  hue: number
  opacity: number
  backfaces: boolean
  spinX: boolean
  spinXDir: 1 | -1
  spinY: boolean
  spinYDir: 1 | -1
  spinSpeed: number
  showAxis: boolean
  imageFace: 'all' | 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right'
  imageDataUrl: string | null
  positionPreset: string
}

interface ControlsPanelProps {
  state: ControlsState
  onChange: (state: ControlsState) => void
  onExplode: () => void
  onCollapse: () => void
}

function Slider({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void
}) {
  return (
    <div className="control-row">
      <span className="control-label">{label}</span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} />
      <span className="control-value">{value}</span>
    </div>
  )
}

export function ControlsPanel({ state, onChange, onExplode, onCollapse }: ControlsPanelProps) {
  const update = (patch: Partial<ControlsState>) => onChange({ ...state, ...patch })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      update({ imageDataUrl: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="controls-panel">
      <div className="controls-section">
        <h4>Dimensions</h4>
        <Slider label="X" value={state.sizeX} min={1} max={10} onChange={(v) => update({ sizeX: v })} />
        <Slider label="Y" value={state.sizeY} min={1} max={10} onChange={(v) => update({ sizeY: v })} />
        <Slider label="Z" value={state.sizeZ} min={1} max={10} onChange={(v) => update({ sizeZ: v })} />
      </div>

      <div className="controls-section">
        <h4>Appearance</h4>
        <Slider label="Gap" value={state.gap} min={0} max={20} onChange={(v) => update({ gap: v })} />
        <Slider label="Size" value={state.boxelSize} min={10} max={200} onChange={(v) => update({ boxelSize: v })} />
        <Slider label="Edge" value={state.edgeWidth} min={0} max={4} onChange={(v) => update({ edgeWidth: v })} />
        <Slider label="Hue" value={state.hue} min={0} max={360} onChange={(v) => update({ hue: v })} />
        <Slider label="Opacity" value={state.opacity} min={5} max={100} onChange={(v) => update({ opacity: v })} />
        <div className="control-row">
          <span className="control-label">Backface</span>
          <button
            className={`toggle-btn ${state.backfaces ? 'active' : ''}`}
            onClick={() => update({ backfaces: !state.backfaces })}
          >
            {state.backfaces ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="controls-section">
        <h4>Texture</h4>
        <div className="preset-grid">
          {TEXTURE_NAMES.map((name) => (
            <button
              key={name}
              className={`preset-btn ${state.texture === name ? 'active' : ''}`}
              onClick={() => update({ texture: name })}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="controls-section">
        <h4>Animate</h4>
        <div className="control-row">
          <span className="control-label">X</span>
          <button
            className={`toggle-btn small ${state.spinX ? 'active' : ''}`}
            onClick={() => update({ spinX: !state.spinX })}
          >
            {state.spinX ? 'ON' : 'OFF'}
          </button>
          {state.spinX && (
            <button
              className="toggle-btn small"
              onClick={() => update({ spinXDir: (state.spinXDir === 1 ? -1 : 1) as 1 | -1 })}
            >
              {state.spinXDir === 1 ? '→' : '←'}
            </button>
          )}
        </div>
        <div className="control-row">
          <span className="control-label">Y</span>
          <button
            className={`toggle-btn small ${state.spinY ? 'active' : ''}`}
            onClick={() => update({ spinY: !state.spinY })}
          >
            {state.spinY ? 'ON' : 'OFF'}
          </button>
          {state.spinY && (
            <button
              className="toggle-btn small"
              onClick={() => update({ spinYDir: (state.spinYDir === 1 ? -1 : 1) as 1 | -1 })}
            >
              {state.spinYDir === 1 ? '↑' : '↓'}
            </button>
          )}
        </div>
        {(state.spinX || state.spinY) && (
          <Slider label="Speed" value={state.spinSpeed} min={1} max={10} onChange={(v) => update({ spinSpeed: v })} />
        )}
        <div className="control-row">
          <span className="control-label">Axis</span>
          <button
            className={`toggle-btn ${state.showAxis ? 'active' : ''}`}
            onClick={() => update({ showAxis: !state.showAxis })}
          >
            {state.showAxis ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="controls-section">
        <h4>Image</h4>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
        <div className="effects-row">
          <button className="effect-btn" onClick={() => fileInputRef.current?.click()}>
            {state.imageDataUrl ? 'Change' : 'Upload'}
          </button>
          {state.imageDataUrl && (
            <button className="effect-btn" onClick={() => update({ imageDataUrl: null })}>
              Clear
            </button>
          )}
        </div>
        {state.imageDataUrl && (
          <>
            <div className="control-row" style={{ marginTop: 6 }}>
              <span className="control-label">Face</span>
              <select
                className="face-select"
                value={state.imageFace}
                onChange={(e) => update({ imageFace: e.target.value as typeof state.imageFace })}
              >
                {FACE_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="image-preview">
              <img src={state.imageDataUrl} alt="preview" />
            </div>
          </>
        )}
      </div>

      <div className="controls-section">
        <h4>Position</h4>
        <div className="position-grid">
          {['top-left', 'top-center', 'top-right',
            'center-left', 'center', 'center-right',
            'bottom-left', 'bottom-center', 'bottom-right'].map((pos) => (
            <button
              key={pos}
              className={`position-dot ${state.positionPreset === pos ? 'active' : ''}`}
              onClick={() => update({ positionPreset: pos })}
              title={pos}
            />
          ))}
        </div>
      </div>

      <div className="controls-section">
        <h4>Effects</h4>
        <div className="effects-row">
          <button className="effect-btn" onClick={onExplode}>Expand</button>
          <button className="effect-btn" onClick={onCollapse}>Collapse</button>
        </div>
      </div>
    </div>
  )
}
