import { useState } from 'react'
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import { ImageExample } from './components/ImageExample'
import { BasicExample } from './components/BasicExample'
import { RubikExample } from './components/RubikExample'
import { ArchitecturalExample } from './components/ArchitecturalExample'
import { GlassExample } from './components/GlassExample'
import { PerformanceExample } from './components/PerformanceExample'
import { ControlsPanel, type ControlsState } from './components/ControlsPanel'

const examples = [
  { path: '/', label: 'Image Mapping', component: null },
  { path: '/basic', label: 'Basic', component: BasicExample },
  { path: '/rubik', label: "Rubik's Cube", component: RubikExample },
  { path: '/architectural', label: 'Architectural', component: ArchitecturalExample },
  { path: '/glass', label: 'Glass', component: GlassExample },
  { path: '/performance', label: 'Performance', component: PerformanceExample },
]

export function App() {
  const [controls, setControls] = useState<ControlsState>({
    sizeX: 2, sizeY: 2, sizeZ: 2,
    gap: 2, boxelSize: 60, edgeWidth: 1, preset: 'xray', hue: 220, opacity: 80, backfaces: false,
    spinX: false, spinXDir: 1, spinY: false, spinYDir: 1, spinSpeed: 3, showAxis: true,
    imageFace: 'all', imageDataUrl: null,
  })
  const [explodeTrigger, setExplodeTrigger] = useState(0)
  const [collapseTrigger, setCollapseTrigger] = useState(0)

  return (
    <HashRouter>
      <div className="app-layout">
        <aside className="sidebar">
          <h1>boxels</h1>
          <p className="tagline">3D design primitives</p>
          <nav>
            {examples.map((ex) => (
              <NavLink
                key={ex.path}
                to={ex.path}
                className={({ isActive }) => isActive ? 'active' : ''}
                end={ex.path === '/'}
              >
                {ex.label}
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
            <Route path="/" element={
              <ImageExample
                controls={controls}
                onControlsChange={setControls}
                explodeTrigger={explodeTrigger}
                collapseTrigger={collapseTrigger}
              />
            } />
            {examples.filter(ex => ex.component).map((ex) => {
              const Comp = ex.component!
              return (
                <Route
                  key={ex.path}
                  path={ex.path}
                  element={
                    <Comp
                      controls={controls}
                      onControlsChange={setControls}
                      explodeTrigger={explodeTrigger}
                      collapseTrigger={collapseTrigger}
                    />
                  }
                />
              )
            })}
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
