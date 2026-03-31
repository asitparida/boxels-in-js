import { useState } from 'react'
import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { ImageExample } from './components/ImageExample'
import { ImagePerFaceExample } from './components/ImagePerFaceExample'
import { ImagePerBoxExample } from './components/ImagePerBoxExample'
import { BasicExample } from './components/BasicExample'
import { RubikExample } from './components/RubikExample'
import { ArchitecturalExample } from './components/ArchitecturalExample'
import { GlassExample } from './components/GlassExample'
import { PerformanceExample } from './components/PerformanceExample'
import { ControlsPanel, type ControlsState } from './components/ControlsPanel'
import { TutorialExample } from './components/TutorialExample'

const controlledExamples = [
  { path: '/basic', label: 'Basic', component: BasicExample },
  { path: '/rubik', label: "Rubik's Cube", component: RubikExample },
  { path: '/architectural', label: 'Architectural', component: ArchitecturalExample },
  { path: '/glass', label: 'Glass', component: GlassExample },
  { path: '/performance', label: 'Performance', component: PerformanceExample },
]

const allNavItems = [
  { path: '/', label: 'How It Works' },
  { path: '/per-face', label: 'Per Face' },
  { path: '/image-across', label: 'Image Across' },
  { path: '/per-cell', label: 'Per Cell' },
  ...controlledExamples.map(({ path, label }) => ({ path, label })),
]

function AppContent() {
  const location = useLocation()
  const isTutorial = location.pathname === '/' || location.hash === '#/'

  const [controls, setControls] = useState<ControlsState>({
    sizeX: 2, sizeY: 2, sizeZ: 2,
    gap: 1, boxelSize: 100, edgeWidth: 1, texture: 'glass', hue: 220, opacity: 70, backfaces: false,
    spinX: false, spinXDir: 1, spinY: true, spinYDir: 1, spinSpeed: 1, showAxis: false,
    imageFace: 'all', imageDataUrl: null, positionPreset: 'center', clickEnabled: true,
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
      </aside>
      <main className={`main-content ${isTutorial ? '' : 'with-controls'}`}>
        <div className="main-scene">
          <Routes>
            <Route path="/" element={<TutorialExample />} />
            <Route path="/per-face" element={<ImagePerFaceExample {...sharedProps} />} />
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
        </div>
        {!isTutorial && (
          <aside className="controls-sidebar">
            <ControlsPanel
              state={controls}
              onChange={setControls}
              onExplode={() => setExplodeTrigger((n) => n + 1)}
              onCollapse={() => setCollapseTrigger((n) => n + 1)}
            />
          </aside>
        )}
      </main>
    </div>
  )
}

export function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  )
}
