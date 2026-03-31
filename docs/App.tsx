import { useState } from 'react'
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import { ImageExample } from './components/ImageExample'
import { ImagePerFaceExample } from './components/ImagePerFaceExample'
import { ImagePerBoxExample } from './components/ImagePerBoxExample'
import { BasicExample } from './components/BasicExample'
import { RubikExample } from './components/RubikExample'
import { ArchitecturalExample } from './components/ArchitecturalExample'
import { GlassExample } from './components/GlassExample'
import { PerformanceExample } from './components/PerformanceExample'
import { ControlsPanel, type ControlsState } from './components/ControlsPanel'

const controlledExamples = [
  { path: '/basic', label: 'Basic', component: BasicExample },
  { path: '/rubik', label: "Rubik's Cube", component: RubikExample },
  { path: '/architectural', label: 'Architectural', component: ArchitecturalExample },
  { path: '/glass', label: 'Glass', component: GlassExample },
  { path: '/performance', label: 'Performance', component: PerformanceExample },
]

const allNavItems = [
  { path: '/', label: 'Per Face' },
  { path: '/image-across', label: 'Image Across' },
  { path: '/per-cell', label: 'Per Cell' },
  ...controlledExamples.map(({ path, label }) => ({ path, label })),
]

export function App() {
  const [controls, setControls] = useState<ControlsState>({
    sizeX: 2, sizeY: 2, sizeZ: 2,
    gap: 1, boxelSize: 100, edgeWidth: 1, texture: 'glass', hue: 220, opacity: 70, backfaces: false,
    spinX: false, spinXDir: 1, spinY: false, spinYDir: 1, spinSpeed: 1, showAxis: false,
    imageFace: 'all', imageDataUrl: null, positionPreset: 'center', clickEnabled: false,
  })
  const [explodeTrigger, setExplodeTrigger] = useState(0)
  const [collapseTrigger, setCollapseTrigger] = useState(0)

  const sharedProps = {
    controls,
    onControlsChange: setControls,
    explodeTrigger,
    collapseTrigger,
  }

  return (
    <HashRouter>
      <div className="app-layout">
        <aside className="sidebar">
          <h1>boxels</h1>
          <p className="tagline">3D design primitives</p>
          <nav>
            {allNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => isActive ? 'active' : ''}
                end={item.path === '/'}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-controls">
            <ControlsPanel
              state={controls}
              onChange={setControls}
              onExplode={() => setExplodeTrigger((n) => n + 1)}
              onCollapse={() => setCollapseTrigger((n) => n + 1)}
            />
          </div>
        </aside>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ImagePerFaceExample {...sharedProps} />} />
            <Route path="/image-across" element={<ImageExample {...sharedProps} />} />
            <Route path="/per-cell" element={<ImagePerBoxExample {...sharedProps} />} />
            {controlledExamples.map((ex) => {
              const Comp = ex.component
              return (
                <Route
                  key={ex.path}
                  path={ex.path}
                  element={<Comp {...sharedProps} />}
                />
              )
            })}
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
