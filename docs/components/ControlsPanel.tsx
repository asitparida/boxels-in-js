import { Boxels } from 'boxels'

const PRESET_NAMES = ['none', 'heerich', 'rubik', 'gradient', 'wireframe', 'xray', 'glass', 'marble', 'neon'] as const

export interface ControlsState {
  sizeX: number
  sizeY: number
  sizeZ: number
  gap: number
  boxelSize: number
  edgeWidth: number
  preset: string
  hue: number
  backfaces: boolean
  spinX: boolean
  spinXDir: 1 | -1
  spinY: boolean
  spinYDir: 1 | -1
  spinSpeed: number
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
        <Slider label="Size" value={state.boxelSize} min={10} max={80} onChange={(v) => update({ boxelSize: v })} />
        <Slider label="Edge" value={state.edgeWidth} min={0} max={4} onChange={(v) => update({ edgeWidth: v })} />
        <Slider label="Hue" value={state.hue} min={0} max={360} onChange={(v) => update({ hue: v })} />
        <div className="control-row">
          <span className="control-label">Back</span>
          <button
            className={`toggle-btn ${state.backfaces ? 'active' : ''}`}
            onClick={() => update({ backfaces: !state.backfaces })}
          >
            {state.backfaces ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="controls-section">
        <h4>Preset</h4>
        <div className="preset-grid">
          {PRESET_NAMES.map((name) => (
            <button
              key={name}
              className={`preset-btn ${state.preset === name ? 'active' : ''}`}
              onClick={() => update({ preset: name })}
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
