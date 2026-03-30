import { useRef, useEffect, useState } from 'react'
import { Boxels } from 'boxels'

const CODE = `import { Boxels } from 'boxels'

const b = new Boxels({
  voxelSize: 20,
  gap: 0,
  camera: { rotation: [-25, 35] },
  style: Boxels.presets.gradient(10, 10, 10),
})

b.addBox({ position: [0, 0, 0], size: [10, 10, 10] })

b.mount(document.getElementById('scene'))`

export function PerformanceExample() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fps, setFps] = useState(0)
  const [boxelCount, setBoxelCount] = useState(0)
  const [faceCount, setFaceCount] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return

    const b = new Boxels({
      voxelSize: 20,
      gap: 0,
      camera: { rotation: [-25, 35] },
      style: Boxels.presets.gradient(10, 10, 10),
    })

    b.addBox({ position: [0, 0, 0], size: [10, 10, 10] })
    b.mount(containerRef.current)

    let count = 0
    b.forEach(() => count++)
    setBoxelCount(count)

    const faces = containerRef.current.querySelectorAll('[data-face]')
    setFaceCount(faces.length)

    let frames = 0
    let lastTime = performance.now()
    const fpsLoop = () => {
      frames++
      const now = performance.now()
      if (now - lastTime >= 1000) {
        setFps(frames)
        frames = 0
        lastTime = now
      }
      rafId = requestAnimationFrame(fpsLoop)
    }
    let rafId = requestAnimationFrame(fpsLoop)

    return () => {
      cancelAnimationFrame(rafId)
      b.unmount()
    }
  }, [])

  return (
    <div className="example-page">
      <h2>Performance</h2>
      <p className="description">
        10x10x10 cube (1,000 boxels) with edge fusion. Internal faces are culled from the DOM.
      </p>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div style={{ background: '#111118', padding: '8px 16px', borderRadius: 8, fontSize: 14 }}>
          Boxels: <strong>{boxelCount}</strong>
        </div>
        <div style={{ background: '#111118', padding: '8px 16px', borderRadius: 8, fontSize: 14 }}>
          DOM faces: <strong>{faceCount}</strong>
        </div>
        <div style={{ background: '#111118', padding: '8px 16px', borderRadius: 8, fontSize: 14 }}>
          FPS: <strong>{fps}</strong>
        </div>
      </div>
      <div ref={containerRef} className="scene-container" />
      <pre className="code-block">{CODE}</pre>
    </div>
  )
}
