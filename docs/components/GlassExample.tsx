import { useRef, useEffect } from 'react'
import { Boxels } from 'boxels'

const CODE = `import { Boxels } from 'boxels'

const b = new Boxels({
  voxelSize: 60,
  gap: 4,
  camera: { rotation: [-20, 40] },
  style: Boxels.presets.glass(4, 4, 4),
})

b.addBox({ position: [0, 0, 0], size: [4, 4, 4] })
b.addSphere({ center: [2, 2, 2], radius: 1.5, mode: 'subtract' })

b.mount(document.getElementById('scene'))`

export function GlassExample() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const b = new Boxels({
      voxelSize: 60,
      gap: 4,
      camera: { rotation: [-20, 40] },
      style: Boxels.presets.glass(4, 4, 4),
    })

    b.addBox({ position: [0, 0, 0], size: [4, 4, 4] })
    b.addSphere({ center: [2, 2, 2], radius: 1.5, mode: 'subtract' })

    b.mount(containerRef.current)

    return () => b.unmount()
  }, [])

  return (
    <div className="example-page">
      <h2>Glass</h2>
      <p className="description">
        Translucent boxels with backdrop-filter blur and a carved sphere.
      </p>
      <div ref={containerRef} className="scene-container" />
      <pre className="code-block">{CODE}</pre>
    </div>
  )
}
