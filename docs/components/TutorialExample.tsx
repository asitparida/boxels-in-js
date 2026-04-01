import { useState } from 'react'
import { CodeBlock } from './CodeBlock'

/* ────────────────────────────────────────────
   Step 1: A single div in 3D space
   ──────────────────────────────────────────── */

function Step1() {
  return (
    <section className="tutorial-step">
      <div className="tutorial-step-header">
        <h2>Step 1: A Single Div in 3D Space</h2>
        <p className="tutorial-desc">
          CSS 3D starts with two properties: <code>perspective</code> on a parent
          gives depth to children, and <code>transform-style: preserve-3d</code> lets
          nested elements live in the same 3D space instead of being flattened.
        </p>
      </div>
      <div className="tutorial-columns">
        <div className="tutorial-demo">
          <div
            style={{
              perspective: '600px',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 120,
                height: 120,
                background: 'rgba(108, 182, 255, 0.3)',
                border: '1px solid rgba(108, 182, 255, 0.6)',
                transform: 'rotateX(-15deg) rotateY(25deg)',
                transformStyle: 'preserve-3d' as const,
              }}
            />
          </div>
        </div>
        <div className="tutorial-code">
          <CodeBlock
            language="javascript"
            code={`<!-- The parent provides perspective -->
<div style="perspective: 600px">

  <!-- The child is rotated in 3D -->
  <div style="
    width: 120px;
    height: 120px;
    background: rgba(108,182,255,0.3);
    border: 1px solid rgba(108,182,255,0.6);
    transform: rotateX(-15deg) rotateY(25deg);
    transform-style: preserve-3d;
  " />

</div>`}
          />
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────
   Step 2: Building a cube face by face
   ──────────────────────────────────────────── */

const FACE_SIZE = 80
const HALF = FACE_SIZE / 2

const faceSteps: { name: string; transform: string; color: string; css: string; desc: string; viewAngle: [number, number] }[] = [
  {
    name: 'front',
    transform: `translateZ(${HALF}px)`,
    color: 'rgba(108,182,255,0.4)',
    css: `translateZ(${HALF}px)`,
    desc: 'The simplest face. No rotation — just push forward along Z by half the cube size.',
    viewAngle: [-15, 20],  // slightly angled, front visible
  },
  {
    name: 'back',
    transform: `rotateY(180deg) translateZ(${HALF}px)`,
    color: 'rgba(255,140,108,0.4)',
    css: `rotateY(180deg) translateZ(${HALF}px)`,
    desc: 'Rotate 180° around Y so it faces the opposite direction, then push out.',
    viewAngle: [-15, 200],  // rotated to see the back face
  },
  {
    name: 'left',
    transform: `rotateY(-90deg) translateZ(${HALF}px)`,
    color: 'rgba(108,255,160,0.4)',
    css: `rotateY(-90deg) translateZ(${HALF}px)`,
    desc: 'Rotate -90° around Y to face left, then push out along its new Z.',
    viewAngle: [-15, -70],  // looking from the left side
  },
  {
    name: 'right',
    transform: `rotateY(90deg) translateZ(${HALF}px)`,
    color: 'rgba(255,200,80,0.4)',
    css: `rotateY(90deg) translateZ(${HALF}px)`,
    desc: 'Rotate 90° around Y to face right, then push out.',
    viewAngle: [-15, 110],  // looking from the right side
  },
  {
    name: 'top',
    transform: `rotateX(90deg) translateZ(${HALF}px)`,
    color: 'rgba(160,108,255,0.4)',
    css: `rotateX(90deg) translateZ(${HALF}px)`,
    desc: 'Rotate 90° around X to face upward, then push out. Uses rotateX instead of rotateY.',
    viewAngle: [-65, 20],  // looking down from above
  },
  {
    name: 'bottom',
    transform: `rotateX(-90deg) translateZ(${HALF}px)`,
    color: 'rgba(255,108,180,0.4)',
    css: `rotateX(-90deg) translateZ(${HALF}px)`,
    desc: 'Rotate -90° around X to face downward, then push out. All 6 faces complete the cube.',
    viewAngle: [55, 20],  // looking up from below
  },
]

// Also used by later steps
const faceData = faceSteps.map(({ name, transform, color }) => ({ name, transform, color }))

const GHOST_FACES = [
  `translateZ(${HALF}px)`,
  `rotateY(180deg) translateZ(${HALF}px)`,
  `rotateY(-90deg) translateZ(${HALF}px)`,
  `rotateY(90deg) translateZ(${HALF}px)`,
  `rotateX(90deg) translateZ(${HALF}px)`,
  `rotateX(-90deg) translateZ(${HALF}px)`,
]

function SingleFaceDemo({ face, size }: { face: typeof faceSteps[0]; size: number }) {
  const [rx, ry] = face.viewAngle
  return (
    <div style={{
      perspective: '500px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      minHeight: 140,
    }}>
      <div style={{
        width: size,
        height: size,
        position: 'relative',
        transformStyle: 'preserve-3d' as const,
        transform: `rotateX(${rx}deg) rotateY(${ry}deg)`,
      }}>
        {/* Ghost edges — all 6 positions shown as dashed outlines */}
        {GHOST_FACES.map((t, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: size, height: size,
            border: '1px dashed rgba(255,255,255,0.15)',
            transform: t,
          }} />
        ))}
        {/* Show ALL faces as dim ghosts so the cube shape is clear */}
        {faceSteps.map((f) => (
          <div key={f.name} style={{
            position: 'absolute',
            width: size, height: size,
            background: f.name === face.name ? face.color.replace(/0\.\d+\)/, '0.6)') : 'rgba(255,255,255,0.04)',
            border: f.name === face.name ? '2px solid rgba(255,255,255,0.8)' : '1px solid rgba(255,255,255,0.08)',
            transform: f.transform,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: f.name === face.name ? '1rem' : '0.8rem',
            color: f.name === face.name ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.2)',
            fontWeight: f.name === face.name ? 700 : 400,
          }}>
            {f.name}
          </div>
        ))}
      </div>
    </div>
  )
}

function Step2() {
  return (
    <section className="tutorial-step">
      <div className="tutorial-step-header">
        <h2>Step 2: Building a Cube — Face by Face</h2>
        <p className="tutorial-desc">
          Every face starts as the same flat div at the center. We rotate it to point in a direction,
          then push it outward with <code>translateZ</code>. Each face shown below in its own cube
          outline — then combined at the end.
        </p>
      </div>

      {/* Faces stacked — paired: front+back, left+right, top+bottom */}
      {[
        { pair: [faceSteps[0], faceSteps[1]], label: 'Front & Back — the Z axis' },
        { pair: [faceSteps[2], faceSteps[3]], label: 'Left & Right — the X axis' },
        { pair: [faceSteps[4], faceSteps[5]], label: 'Top & Bottom — the Y axis' },
      ].map(({ pair, label }) => (
        <div key={label} style={{ marginBottom: 24 }}>
          <p style={{ color: '#888', fontSize: '0.9375rem', marginBottom: 12, fontWeight: 500 }}>{label}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pair.map((face) => (
              <div key={face.name} className="tutorial-face-row">
                <div className="tutorial-face-row-demo">
                  <SingleFaceDemo face={face} size={80} />
                </div>
                <div className="tutorial-face-row-info">
                  <p style={{ color: '#222', fontSize: '0.9375rem', fontWeight: 600, marginBottom: 4 }}>{face.name}</p>
                  <p style={{ color: '#888', fontSize: '0.9375rem', lineHeight: 1.5, marginBottom: 10 }}>{face.desc}</p>
                  <CodeBlock code={`<div style="\n  position: absolute;\n  width: ${FACE_SIZE}px;\n  height: ${FACE_SIZE}px;\n  transform: ${face.css};\n  backface-visibility: hidden;\n" />`} language="javascript" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Combined */}
      <div className="tutorial-combined">
        <div style={{
          perspective: '600px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 160,
          minHeight: 160,
        }}>
          <div style={{
            width: FACE_SIZE,
            height: FACE_SIZE,
            position: 'relative',
            transformStyle: 'preserve-3d' as const,
            transform: 'rotateX(-25deg) rotateY(35deg)',
          }}>
            {faceSteps.map((f) => (
              <div
                key={f.name}
                style={{
                  position: 'absolute',
                  width: FACE_SIZE,
                  height: FACE_SIZE,
                  background: f.color,
                  border: '1px solid rgba(108,182,255,0.5)',
                  transform: f.transform,
                  backfaceVisibility: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                {f.name}
              </div>
            ))}
          </div>
        </div>
        <div>
          <p style={{ color: '#222', fontSize: '0.9375rem', fontWeight: 600, marginBottom: 8 }}>
            All 6 faces combined
          </p>
          <p style={{ color: '#888', fontSize: '0.9375rem', lineHeight: 1.5 }}>
            Same div, 6 different transforms. Each one rotates to face a direction, then
            pushes outward by half the cube size. Together they form a hollow cube.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────
   Step 3: Rotation - the world container
   ──────────────────────────────────────────── */

function Step3() {
  const [rotX, setRotX] = useState(-25)
  const [rotY, setRotY] = useState(35)

  return (
    <section className="tutorial-step">
      <div className="tutorial-step-header">
        <h2>Step 3: Rotation -- the World Container</h2>
        <p className="tutorial-desc">
          Wrap everything in a &quot;world&quot; container and rotate it to get the isometric-like
          view. Changing <code>rotateX</code> and <code>rotateY</code> on this wrapper
          rotates the entire scene at once.
        </p>
      </div>
      <div className="tutorial-columns">
        <div className="tutorial-demo">
          <div
            style={{
              perspective: '600px',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
            }}
          >
            {/* Sliders */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: '1rem' }}>
              <label style={{ color: '#888' }}>
                rotX: {rotX}deg
                <input
                  type="range"
                  min={-90}
                  max={90}
                  value={rotX}
                  onChange={(e) => setRotX(Number(e.target.value))}
                  style={{ marginLeft: 8, accentColor: '#6cb6ff' }}
                />
              </label>
              <label style={{ color: '#888' }}>
                rotY: {rotY}deg
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={rotY}
                  onChange={(e) => setRotY(Number(e.target.value))}
                  style={{ marginLeft: 8, accentColor: '#6cb6ff' }}
                />
              </label>
            </div>

            {/* Scene */}
            <div
              style={{
                width: FACE_SIZE,
                height: FACE_SIZE,
                position: 'relative',
                transformStyle: 'preserve-3d' as const,
                transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
                transition: 'transform 0.1s ease-out',
              }}
            >
              {faceData.map((f) => (
                <div
                  key={f.name}
                  style={{
                    position: 'absolute',
                    width: FACE_SIZE,
                    height: FACE_SIZE,
                    background: f.color,
                    border: '1px solid rgba(108,182,255,0.5)',
                    transform: f.transform,
                    backfaceVisibility: 'hidden',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="tutorial-code">
          <CodeBlock
            language="javascript"
            code={`// The "world" container wraps all cubes.
// Its transform rotates the entire scene.

<div class="world" style="
  transform-style: preserve-3d;
  transform: rotateX(\${rotX}deg)
             rotateY(\${rotY}deg);
">
  <!-- all cubes go here -->
</div>

// Default isometric-like view:
//   rotateX(-25deg) rotateY(35deg)
//
// Drag the sliders to see how changing
// these values orbits the camera around
// the scene.`}
          />
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────
   Step 4: A 2x2x2 grid
   ──────────────────────────────────────────── */

function Step4() {
  const cubeSize = 50
  const gap = 2
  const offset = cubeSize + gap
  const half = cubeSize / 2

  const faces: { transform: string; color: string }[] = [
    { transform: `translateZ(${half}px)`,                     color: 'rgba(108,182,255,0.35)' },
    { transform: `rotateY(180deg) translateZ(${half}px)`,     color: 'rgba(108,182,255,0.2)' },
    { transform: `rotateY(-90deg) translateZ(${half}px)`,     color: 'rgba(80,140,220,0.35)' },
    { transform: `rotateY(90deg) translateZ(${half}px)`,      color: 'rgba(80,140,220,0.25)' },
    { transform: `rotateX(90deg) translateZ(${half}px)`,      color: 'rgba(140,200,255,0.4)' },
    { transform: `rotateX(-90deg) translateZ(${half}px)`,     color: 'rgba(60,100,180,0.3)' },
  ]

  const cubes: { x: number; y: number; z: number }[] = []
  for (let x = 0; x < 2; x++)
    for (let y = 0; y < 2; y++)
      for (let z = 0; z < 2; z++)
        cubes.push({ x, y, z })

  return (
    <section className="tutorial-step">
      <div className="tutorial-step-header">
        <h2>Step 4: A 2x2x2 Grid</h2>
        <p className="tutorial-desc">
          Position 8 cubes in a grid using <code>translate3d(x * offset, -y * offset, z * offset)</code>.
          Note the Y-flip: CSS Y goes downward, but we want world Y to go upward, so we negate it.
        </p>
      </div>
      <div className="tutorial-columns">
        <div className="tutorial-demo">
          <div
            style={{
              perspective: '800px',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                transformStyle: 'preserve-3d' as const,
                transform: 'rotateX(-25deg) rotateY(35deg)',
                position: 'relative',
              }}
            >
              {cubes.map(({ x, y, z }) => (
                <div
                  key={`${x}-${y}-${z}`}
                  style={{
                    position: 'absolute',
                    width: cubeSize,
                    height: cubeSize,
                    transformStyle: 'preserve-3d' as const,
                    transform: `translate3d(${x * offset}px, ${-y * offset}px, ${z * offset}px)`,
                  }}
                >
                  {faces.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        width: cubeSize,
                        height: cubeSize,
                        background: f.color,
                        border: '1px solid rgba(108,182,255,0.5)',
                        transform: f.transform,
                        backfaceVisibility: 'hidden',
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="tutorial-code">
          <CodeBlock
            language="javascript"
            code={`const offset = cubeSize + gap;

for (let x = 0; x < 2; x++)
  for (let y = 0; y < 2; y++)
    for (let z = 0; z < 2; z++) {
      const cube = createCube(cubeSize);

      // Position each cube in the grid.
      // Negate Y so "up" is positive.
      cube.style.transform =
        \`translate3d(
           \${x * offset}px,
           \${-y * offset}px,
           \${z * offset}px
        )\`;

      world.appendChild(cube);
    }

// Result: 8 cubes in a 2x2x2 arrangement.`}
          />
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────
   Step 5: Edge Fusion
   ──────────────────────────────────────────── */

function Step5() {
  const [fused, setFused] = useState(false)
  const cubeSize = 60
  const half = cubeSize / 2
  const gap = 2
  const offset = cubeSize + gap

  const borderStyle = '1px solid rgba(108,182,255,0.5)'
  const noBorder = '1px solid transparent'

  // Two cubes side by side along X
  // When fused: cube0's right face is hidden, cube1's left face is hidden,
  // and the shared edge between their coplanar front/back/top/bottom faces is removed.

  const cubes = [0, 1].map((idx) => {
    const isLeft = idx === 0
    const x = idx * offset

    const facesForCube: { transform: string; color: string; border: string; hide: boolean }[] = [
      {
        transform: `translateZ(${half}px)`,
        color: 'rgba(108,182,255,0.35)',
        border: fused
          ? `1px solid rgba(108,182,255,0.5) 1px solid ${isLeft ? 'rgba(108,182,255,0.5)' : 'transparent'} 1px solid rgba(108,182,255,0.5) 1px solid ${isLeft ? 'transparent' : 'rgba(108,182,255,0.5)'}`
          : borderStyle,
        hide: false,
      },
      {
        transform: `rotateY(180deg) translateZ(${half}px)`,
        color: 'rgba(108,182,255,0.2)',
        border: borderStyle,
        hide: false,
      },
      {
        // left face
        transform: `rotateY(-90deg) translateZ(${half}px)`,
        color: 'rgba(80,140,220,0.35)',
        border: borderStyle,
        hide: fused && !isLeft, // hide cube1's left face (internal)
      },
      {
        // right face
        transform: `rotateY(90deg) translateZ(${half}px)`,
        color: 'rgba(80,140,220,0.25)',
        border: borderStyle,
        hide: fused && isLeft, // hide cube0's right face (internal)
      },
      {
        transform: `rotateX(90deg) translateZ(${half}px)`,
        color: 'rgba(140,200,255,0.4)',
        border: borderStyle,
        hide: false,
      },
      {
        transform: `rotateX(-90deg) translateZ(${half}px)`,
        color: 'rgba(60,100,180,0.3)',
        border: borderStyle,
        hide: false,
      },
    ]

    return { x, faces: facesForCube }
  })

  // For the fused state, use custom per-edge borders on coplanar faces
  const getFrontBorder = (isLeft: boolean) => {
    if (!fused) return borderStyle
    // top right bottom left
    return isLeft
      ? '1px solid rgba(108,182,255,0.5) 1px solid transparent 1px solid rgba(108,182,255,0.5) 1px solid rgba(108,182,255,0.5)'
      : '1px solid rgba(108,182,255,0.5) 1px solid rgba(108,182,255,0.5) 1px solid rgba(108,182,255,0.5) 1px solid transparent'
  }

  const getBackBorder = (isLeft: boolean) => {
    if (!fused) return borderStyle
    // back face is rotated 180, so left/right are swapped visually
    return isLeft
      ? '1px solid rgba(108,182,255,0.5) 1px solid rgba(108,182,255,0.5) 1px solid rgba(108,182,255,0.5) 1px solid transparent'
      : '1px solid rgba(108,182,255,0.5) 1px solid transparent 1px solid rgba(108,182,255,0.5) 1px solid rgba(108,182,255,0.5)'
  }

  const getTopBorder = (isLeft: boolean) => {
    if (!fused) return borderStyle
    return isLeft
      ? '1px solid rgba(108,182,255,0.5) 1px solid transparent 1px solid rgba(108,182,255,0.5) 1px solid rgba(108,182,255,0.5)'
      : '1px solid rgba(108,182,255,0.5) 1px solid rgba(108,182,255,0.5) 1px solid rgba(108,182,255,0.5) 1px solid transparent'
  }

  const getBottomBorder = (isLeft: boolean) => {
    if (!fused) return borderStyle
    return isLeft
      ? '1px solid rgba(108,182,255,0.5) 1px solid rgba(108,182,255,0.5) 1px solid rgba(108,182,255,0.5) 1px solid transparent'
      : '1px solid rgba(108,182,255,0.5) 1px solid transparent 1px solid rgba(108,182,255,0.5) 1px solid rgba(108,182,255,0.5)'
  }

  return (
    <section className="tutorial-step">
      <div className="tutorial-step-header">
        <h2>Step 5: Edge Fusion</h2>
        <p className="tutorial-desc">
          When two cubes are adjacent, the shared internal faces are redundant and can be removed
          (face culling). The border between two coplanar faces on the outside is also hidden,
          making them look like one continuous surface. Toggle to see the difference.
        </p>
      </div>
      <div className="tutorial-columns">
        <div className="tutorial-demo">
          <div
            style={{
              perspective: '600px',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
            }}
          >
            <button
              className="toggle-btn"
              style={{
                background: fused ? '#141e2a' : '#111118',
                borderColor: fused ? '#6cb6ff' : '#1a1a22',
                color: fused ? '#6cb6ff' : '#555',
              }}
              onClick={() => setFused(!fused)}
            >
              {fused ? 'Fused (optimized)' : 'Unfused (naive)'}
            </button>
            <div
              style={{
                transformStyle: 'preserve-3d' as const,
                transform: 'rotateX(-25deg) rotateY(35deg)',
                position: 'relative',
              }}
            >
              {cubes.map((cube, ci) => {
                const isLeft = ci === 0
                return (
                  <div
                    key={ci}
                    style={{
                      position: 'absolute',
                      width: cubeSize,
                      height: cubeSize,
                      transformStyle: 'preserve-3d' as const,
                      transform: `translate3d(${cube.x}px, 0px, 0px)`,
                    }}
                  >
                    {cube.faces.map((f, fi) => {
                      if (f.hide) return null
                      let border: string
                      if (fi === 0) border = getFrontBorder(isLeft)
                      else if (fi === 1) border = getBackBorder(isLeft)
                      else if (fi === 4) border = getTopBorder(isLeft)
                      else if (fi === 5) border = getBottomBorder(isLeft)
                      else border = fused ? noBorder : f.border

                      // For individual border edges, split it
                      const parts = border.split(' ')
                      const style: React.CSSProperties = {
                        position: 'absolute',
                        width: cubeSize,
                        height: cubeSize,
                        background: f.color,
                        transform: f.transform,
                        backfaceVisibility: 'hidden',
                      }

                      if (parts.length > 6) {
                        // per-edge borders (4 shorthand values)
                        const edges = border.split(/(?<=\)) (?=\d)/)
                        if (edges.length === 4) {
                          style.borderTop = edges[0]
                          style.borderRight = edges[1]
                          style.borderBottom = edges[2]
                          style.borderLeft = edges[3]
                        } else {
                          style.border = borderStyle
                        }
                      } else {
                        style.border = border
                      }

                      return <div key={fi} style={style} />
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="tutorial-code">
          <CodeBlock
            language="javascript"
            code={`// Face culling: remove internal faces
// If cube A is adjacent to cube B on the right,
// hide A's right face and B's left face.

if (hasNeighbor(x+1, y, z)) {
  // Don't render cube's right face
  // Don't render neighbor's left face
}

// Edge fusion: remove shared borders
// Two coplanar faces that touch share an
// edge. Remove that edge's border so they
// look like one continuous surface.

// Before: each face has border on all 4 sides
// After:  shared edges get border: transparent

face.style.borderRight = 'transparent';
neighborFace.style.borderLeft = 'transparent';`}
          />
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────
   Step 6: The Boxels Library Equivalent
   ──────────────────────────────────────────── */

function Step6() {
  return (
    <section className="tutorial-step">
      <div className="tutorial-step-header">
        <h2>Step 6: The boxels Library Equivalent</h2>
        <p className="tutorial-desc">
          All of the above -- cube construction, face positioning, world rotation, grid layout,
          face culling, and edge fusion -- is handled by the boxels library in a few lines.
          Here is the raw approach vs. the library side by side.
        </p>
      </div>
      <div className="tutorial-columns">
        <div className="tutorial-code" style={{ flex: 1 }}>
          <p style={{ color: '#888', fontSize: '1rem', marginBottom: 8, fontWeight: 600 }}>
            Raw CSS/JS (~100 lines)
          </p>
          <CodeBlock
            language="javascript"
            code={`// 1. Create perspective container
const scene = document.createElement('div');
scene.style.perspective = '800px';

// 2. Create world container
const world = document.createElement('div');
world.style.transformStyle = 'preserve-3d';
world.style.transform =
  'rotateX(-25deg) rotateY(35deg)';

// 3. For each cell in a 2x2x2 grid...
for (let x = 0; x < 2; x++)
 for (let y = 0; y < 2; y++)
  for (let z = 0; z < 2; z++) {
    const cube = document.createElement('div');
    cube.style.transformStyle = 'preserve-3d';
    cube.style.position = 'absolute';
    cube.style.transform = \`translate3d(
      \${x*52}px, \${-y*52}px, \${z*52}px)\`;

    // 4. Create 6 faces per cube
    const faces = [
      \`translateZ(25px)\`,
      \`rotateY(180deg) translateZ(25px)\`,
      \`rotateY(-90deg) translateZ(25px)\`,
      \`rotateY(90deg) translateZ(25px)\`,
      \`rotateX(90deg) translateZ(25px)\`,
      \`rotateX(-90deg) translateZ(25px)\`,
    ];

    // 5. Check neighbors, cull faces...
    // 6. Fuse shared edges...
    // 7. Apply textures, colors...
    // ... many more lines omitted
  }`}
          />
        </div>
        <div className="tutorial-code" style={{ flex: 1 }}>
          <p style={{ color: '#6cb6ff', fontSize: '1rem', marginBottom: 8, fontWeight: 600 }}>
            With boxels (~5 lines)
          </p>
          <CodeBlock
            language="javascript"
            code={`import { Boxels } from 'boxels';

const b = new Boxels({
  boxelSize: 50,
  camera: { rotation: [-25, 35] },
});

b.addBox({
  position: [0, 0, 0],
  size: [2, 2, 2],
});

b.mount(document.getElementById('scene'));
b.setTexture('glass', 220, 0.7);

// That's it. Face culling, edge fusion,
// 3D transforms, and positioning are
// all handled automatically.`}
          />
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────
   Main Tutorial Component
   ──────────────────────────────────────────── */

export function TutorialExample() {
  return (
    <div className="tutorial-page">
      <div className="tutorial-hero">
        <h1>How It Works</h1>
        <p>
          A step-by-step guide to building 3D boxels from scratch with CSS transforms.
          No library needed -- just HTML, CSS, and a little math.
        </p>
      </div>
      <Step1 />
      <Step2 />
      <Step3 />
      <Step4 />
      <Step5 />
      <Step6 />
      <div className="tutorial-footer">
        <p>
          That is the core of how CSS 3D boxels work.
          The <a href="#/basic">boxels library</a> wraps all of this into a clean API
          with textures, animations, click handling, and more.
        </p>
      </div>
    </div>
  )
}
