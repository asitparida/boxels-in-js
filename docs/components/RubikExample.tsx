import { useRef, useEffect } from 'react'
import { Boxels } from 'boxels'

const CODE = `import { Boxels } from 'boxels'

const b = new Boxels({
  voxelSize: 50,
  gap: 2,
  camera: { rotation: [-25, 35] },
})

b.addBox({
  position: [0, 0, 0],
  size: [3, 3, 3],
  style: Boxels.presets.rubik(3, 3, 3),
})

b.mount(document.getElementById('scene'))

// Rotate a random layer every 2 seconds
setInterval(() => {
  const axes = ['x', 'y', 'z']
  const axis = axes[Math.floor(Math.random() * 3)]
  const layer = Math.floor(Math.random() * 3)
  const direction = Math.random() > 0.5 ? 1 : -1
  b.rotateLayer({ axis, layer, direction, duration: 400 })
}, 2000)`

export function RubikExample() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const b = new Boxels({
      voxelSize: 50,
      gap: 2,
      camera: { rotation: [-25, 35] },
    })

    b.addBox({
      position: [0, 0, 0],
      size: [3, 3, 3],
      style: Boxels.presets.rubik(3, 3, 3),
    })

    b.mount(containerRef.current)

    const interval = setInterval(() => {
      const axes = ['x', 'y', 'z'] as const
      const axis = axes[Math.floor(Math.random() * 3)]
      const layer = Math.floor(Math.random() * 3)
      const direction = Math.random() > 0.5 ? 1 : -1
      b.rotateLayer({ axis, layer, direction: direction as 1 | -1, duration: 400 })
    }, 2000)

    return () => {
      clearInterval(interval)
      b.unmount()
    }
  }, [])

  return (
    <div className="example-page">
      <h2>Rubik's Cube</h2>
      <p className="description">
        A 3x3x3 Rubik's cube with the rubik preset. Layers rotate automatically every 2 seconds.
      </p>
      <div ref={containerRef} className="scene-container" />
      <pre className="code-block">{CODE}</pre>
    </div>
  )
}
