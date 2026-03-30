import { useRef, useEffect } from 'react'
import { Boxels } from 'boxels'

const CODE = `import { Boxels } from 'boxels'

const b = new Boxels({
  voxelSize: 40,
  gap: 0,
  camera: { rotation: [-20, 30] },
  style: Boxels.presets.heerich(8, 8, 8),
})

// Solid block with carved interior
b.addBox({ position: [0, 0, 0], size: [8, 8, 8] })
b.addBox({ position: [1, 1, 1], size: [6, 7, 6], mode: 'subtract' })

// Window openings
b.removeBox({ position: [0, 3, 2], size: [1, 3, 4] })
b.removeBox({ position: [7, 3, 2], size: [1, 3, 4] })

b.mount(document.getElementById('scene'))`

export function ArchitecturalExample() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const b = new Boxels({
      voxelSize: 40,
      gap: 0,
      camera: { rotation: [-20, 30] },
      style: Boxels.presets.heerich(8, 8, 8),
    })

    b.addBox({ position: [0, 0, 0], size: [8, 8, 8] })
    b.addBox({ position: [1, 1, 1], size: [6, 7, 6], mode: 'subtract' })

    b.removeBox({ position: [0, 3, 2], size: [1, 3, 4] })
    b.removeBox({ position: [7, 3, 2], size: [1, 3, 4] })

    b.mount(containerRef.current)

    return () => b.unmount()
  }, [])

  return (
    <div className="example-page">
      <h2>Architectural</h2>
      <p className="description">
        A Heerich-inspired sculpture: a hollowed cube with window openings, using muted cardboard tones and edge fusion.
      </p>
      <div ref={containerRef} className="scene-container" />
      <pre className="code-block">{CODE}</pre>
    </div>
  )
}
