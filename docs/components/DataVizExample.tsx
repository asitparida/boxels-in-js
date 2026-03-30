import { useRef, useEffect } from 'react'
import { Boxels } from 'boxels'

const CODE = `import { Boxels } from 'boxels'

const b = new Boxels({
  voxelSize: 30,
  gap: 2,
  camera: { rotation: [-30, 45] },
})

const data = [3, 7, 5, 9, 4, 6]
data.forEach((height, i) => {
  b.addBox({
    position: [i * 2, 0, 0],
    size: [1, height, 1],
    style: {
      default: (_x, y) => {
        const hue = (i / data.length) * 280
        const lightness = 0.35 + (y / 9) * 0.35
        return {
          fill: \`oklch(\${lightness} 0.18 \${hue})\`,
          stroke: \`oklch(\${lightness - 0.08} 0.18 \${hue})\`,
        }
      },
    },
  })
})

b.mount(document.getElementById('scene'))`

export function DataVizExample() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const b = new Boxels({
      voxelSize: 30,
      gap: 2,
      camera: { rotation: [-30, 45] },
    })

    const data = [3, 7, 5, 9, 4, 6]
    const maxH = Math.max(...data)

    data.forEach((height, i) => {
      b.addBox({
        position: [i * 2, 0, 0],
        size: [1, height, 1],
        style: {
          default: (_x: number, y: number, _z: number) => {
            const hue = (i / data.length) * 280
            const lightness = 0.35 + (y / maxH) * 0.35
            return {
              fill: `oklch(${lightness} 0.18 ${hue})`,
              stroke: `oklch(${lightness - 0.08} 0.18 ${hue})`,
            }
          },
        },
      })
    })

    b.mount(containerRef.current)

    return () => b.unmount()
  }, [])

  return (
    <div className="example-page">
      <h2>Data Viz</h2>
      <p className="description">
        A 3D bar chart built from boxels with position-based gradient coloring.
      </p>
      <div ref={containerRef} className="scene-container" />
      <pre className="code-block">{CODE}</pre>
    </div>
  )
}
