import { useRef, useEffect } from 'react'
import { Boxels } from 'boxels'

const CODE = `import { Boxels } from 'boxels'

const b = new Boxels({
  voxelSize: 50,
  gap: 0,
  camera: { rotation: [-25, 35] },
})

b.addBox({ position: [0, 0, 0], size: [3, 3, 3] })
b.mount(document.getElementById('scene'))`

export function BasicExample() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const b = new Boxels({
      voxelSize: 50,
      gap: 0,
      camera: { rotation: [-25, 35] },
    })

    b.addBox({ position: [0, 0, 0], size: [3, 3, 3] })
    b.mount(containerRef.current)

    return () => b.unmount()
  }, [])

  return (
    <div className="example-page">
      <h2>Basic</h2>
      <p className="description">
        A 3x3x3 cube with default styling and orbit controls. Drag to rotate, scroll to zoom.
      </p>
      <div ref={containerRef} className="scene-container" />
      <pre className="code-block">{CODE}</pre>
    </div>
  )
}
