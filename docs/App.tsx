import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import { BasicExample } from './components/BasicExample'
import { RubikExample } from './components/RubikExample'
import { DataVizExample } from './components/DataVizExample'
import { ArchitecturalExample } from './components/ArchitecturalExample'
import { GlassExample } from './components/GlassExample'
import { PerformanceExample } from './components/PerformanceExample'

const examples = [
  { path: '/', label: 'Basic', component: BasicExample },
  { path: '/rubik', label: "Rubik's Cube", component: RubikExample },
  { path: '/data-viz', label: 'Data Viz', component: DataVizExample },
  { path: '/architectural', label: 'Architectural', component: ArchitecturalExample },
  { path: '/glass', label: 'Glass', component: GlassExample },
  { path: '/performance', label: 'Performance', component: PerformanceExample },
]

export function App() {
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
        </aside>
        <main className="main-content">
          <Routes>
            {examples.map((ex) => (
              <Route key={ex.path} path={ex.path} element={<ex.component />} />
            ))}
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
