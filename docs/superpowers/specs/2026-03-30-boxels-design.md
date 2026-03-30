# boxels — Design Specification

> A tiny, dual-renderer engine for composing 3D boxel scenes from DOM divs (or WebGL in a future milestone).
> "Voxels as a design primitive — not a game engine."

## Scope

### In Scope (This Milestone — DOM Renderer)

- **Core**: BoxelGrid, boolean ops (union/subtract/intersect/exclude), primitives (box/sphere/line), style system, edge fusion, 90° rotation
- **DOM Renderer**: CSS 3D divs, orbit controls, face culling, edge fusion borders
- **Styling**: Per-face functional styles, 8 built-in presets (heerich, rubik, gradient, wireframe, xray, glass, marble, neon)
- **Animations**: Explode/collapse, Rubik's-style layer rotation, gap tween, opacity tween, custom per-boxel animation
- **Image Mapping**: Map images across boxel faces (cross/strip/per-face layouts)
- **Events**: click, hover, pointerdown on individual faces
- **React 19+ Wrapper**: `<Boxels />` component
- **Docs App**: React showcase with 6 examples (basic, rubik, data-viz, architectural, glass, performance)
- **Plain JS as primary API**: React wrapper is a convenience layer

### Out of Scope

- WebGL / Three.js renderer (separate future milestone)
- `renderer: 'auto'` switching
- SVG / PNG / JSON export
- `setRenderer()` hot-swap

---

## Project Structure

Single npm package (`boxels`), micro-module internals. Follows the sonify-elements pattern: `src/lib/` for the library, `docs/` for the React showcase app, mode-based Vite config.

```
boxels-in-js/
├── src/lib/                          # The "boxels" library
│   ├── index.ts                      # Public API — Boxels class
│   ├── core/
│   │   ├── grid.ts                   # BoxelGrid — occupancy map, neighbor queries, bounds
│   │   ├── boolean.ts                # Union, subtract, intersect, exclude
│   │   ├── geometry.ts               # Box, sphere, line primitives
│   │   ├── style.ts                  # Style resolution, functional styles
│   │   ├── edge-fusion.ts            # Face culling + shared edge detection
│   │   ├── rotation.ts               # 90° axis rotation
│   │   └── image-mapper.ts           # Image → face texture slicing
│   ├── renderers/
│   │   ├── renderer.ts               # Lightweight renderer type definition
│   │   └── dom/
│   │       ├── dom-renderer.ts       # CSS 3D div renderer
│   │       ├── boxel-element.ts      # Creates div + face divs
│   │       ├── edge-borders.ts       # Per-border show/hide
│   │       └── orbit.ts              # Pointer drag orbit + scroll zoom
│   ├── animation/
│   │   ├── animator.ts               # RAF loop, easing functions
│   │   ├── explode.ts                # Explode/collapse
│   │   ├── layer-rotate.ts           # Rubik's-style layer animation
│   │   └── tweens.ts                 # Gap, opacity, per-boxel tweens
│   └── presets/
│       └── styles.ts                 # 8 built-in style presets
├── src/react/
│   └── Boxels.tsx                    # React 19+ wrapper component
├── docs/                             # React showcase app
│   ├── index.html
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── BasicExample.tsx
│   │   ├── RubikExample.tsx
│   │   ├── DataVizExample.tsx
│   │   ├── ArchitecturalExample.tsx
│   │   ├── GlassExample.tsx
│   │   └── PerformanceExample.tsx
│   └── styles/
├── vite.config.ts                    # Mode-based: lib build vs docs build
├── tsconfig.json                     # Project references
├── tsconfig.app.json                 # Docs + lib source
├── tsconfig.lib.json                 # Lib only, emits .d.ts
└── package.json
```

### Build Configuration

- **`npm run dev`** — Vite dev server for docs app
- **`npm run build`** — TypeScript check + build docs app
- **`npm run build:lib`** — Build library as ESM + CJS to `dist/lib/`
- **Vite config** switches on `mode === 'lib'`:
  - Lib mode: entry `src/lib/index.ts`, outputs `boxels.mjs` + `boxels.cjs` to `dist/lib/`
  - Default mode: builds docs app from `docs/` to `dist/app/`
- **Path alias**: `boxels` → `src/lib/index.ts` during dev so docs imports resolve to source
- **`package.json` files**: restricted to `dist/lib` for npm publish

---

## Core Data Model

### BoxelGrid (`core/grid.ts`)

The central data structure. A `Map<string, Boxel>` keyed by `"x,y,z"` string keys. Auto-expands bounds as boxels are added — no fixed size required.

```typescript
interface Boxel {
  position: [number, number, number]
  style: ResolvedStyle
  meta?: Record<string, any>
  opaque: boolean
}

interface BoxelGrid {
  data: Map<string, Boxel>
  hasBoxel(x: number, y: number, z: number): boolean
  getBoxel(x: number, y: number, z: number): Boxel | null
  setBoxel(x: number, y: number, z: number, boxel: Boxel | null): void
  getExposedFaces(x: number, y: number, z: number): FaceName[]
  getEdgeVisibility(x: number, y: number, z: number, face: FaceName): EdgeVisibility
  getNeighbors(x: number, y: number, z: number): Record<FaceName, Boxel | null>
  getExposure(x: number, y: number, z: number): number  // 0-6 open faces
  forEach(fn: (boxel: Boxel, pos: [number, number, number]) => void): void
  getBounds(): { min: [number, number, number], max: [number, number, number] }
}
```

### Types

```typescript
type FaceName = 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right'

interface EdgeVisibility {
  left: boolean
  right: boolean
  top: boolean
  bottom: boolean
}

type StyleValue = string | ((x: number, y: number, z: number) => string)

interface FaceStyle {
  fill?: StyleValue
  stroke?: StyleValue
  opacity?: number
  className?: string
  backdropFilter?: string  // DOM-only
}

interface BoxelStyle {
  default?: FaceStyle | ((x: number, y: number, z: number) => FaceStyle)
  top?: FaceStyle | ((x: number, y: number, z: number) => FaceStyle)
  bottom?: FaceStyle | ((x: number, y: number, z: number) => FaceStyle)
  front?: FaceStyle | ((x: number, y: number, z: number) => FaceStyle)
  back?: FaceStyle | ((x: number, y: number, z: number) => FaceStyle)
  left?: FaceStyle | ((x: number, y: number, z: number) => FaceStyle)
  right?: FaceStyle | ((x: number, y: number, z: number) => FaceStyle)
}
```

---

## Boolean Operations (`core/boolean.ts`)

`addBox`, `addSphere`, `addLine` each generate a set of `[x,y,z]` positions from their geometry parameters, then apply a mode:

- **`union`** (default): set each position into the grid
- **`subtract`**: remove each position from the grid
- **`intersect`**: keep only positions that exist in both the grid and the generated set
- **`exclude`**: symmetric difference — toggle each position

Shorthand methods: `removeBox()`, `removeSphere()` are equivalent to `addBox/addSphere` with `mode: 'subtract'`.

---

## Style System (`core/style.ts`)

### Resolution Order (highest to lowest priority)

1. Face-specific style (e.g., `style.top`)
2. Default style (`style.default`)
3. Constructor default style (passed to `new Boxels()`)
4. Library fallback: `{ fill: '#ddd', stroke: '#333' }`

If any level is a function, it is evaluated with `(x, y, z)` and the result is merged.

### Style Presets

8 built-in presets, each a function `(w, h, d) => BoxelStyle`:

| Preset | Description |
|--------|-------------|
| `heerich` | Muted cardboard tones |
| `rubik` | Classic Rubik's cube face colors |
| `gradient` | oklch position-based gradient |
| `wireframe` | Transparent faces, visible edges |
| `xray` | Distance-from-center opacity |
| `glass` | Translucent with backdrop blur |
| `marble` | White stone with subtle veining |
| `neon` | Dark with glowing edges |

---

## Edge Fusion (`core/edge-fusion.ts`)

When `gap: 0`, only outer silhouette edges are rendered.

### Algorithm

1. For each boxel, for each of 6 faces:
   - **Face culling**: If neighbor exists in that face's normal direction → skip face entirely (no DOM node created)
   - **Edge culling**: For each of the 4 CSS border sides of this face, check if the planar neighbor also has that same face exposed. If yes → hide that border (transparent/0)

### FACE_EDGES Mapping

Maps CSS border directions to 3D neighbor offsets per face, accounting for CSS transforms:

```typescript
const FACE_EDGES = {
  top:    { Left: [-1,0,0], Right: [1,0,0], Top: [0,0,-1], Bottom: [0,0,1] },
  bottom: { Left: [-1,0,0], Right: [1,0,0], Top: [0,0,1],  Bottom: [0,0,-1] },
  front:  { Left: [-1,0,0], Right: [1,0,0], Top: [0,1,0],  Bottom: [0,-1,0] },
  back:   { Left: [1,0,0],  Right: [-1,0,0], Top: [0,1,0], Bottom: [0,-1,0] },
  left:   { Left: [0,0,1],  Right: [0,0,-1], Top: [0,1,0], Bottom: [0,-1,0] },
  right:  { Left: [0,0,-1], Right: [0,0,1],  Top: [0,1,0], Bottom: [0,-1,0] },
}
```

---

## DOM Renderer (`renderers/dom/`)

### Structure

- **World container**: A div with `transform-style: preserve-3d`, `perspective` set from camera config
- **Per boxel**: 1 parent div (positioned with `translate3d` at grid coords × voxelSize + gap) + up to 6 child face divs (only exposed faces)
- **Face divs**: positioned with `rotateX`/`rotateY` for orientation, styled with resolved fill → `background`, stroke → `border-color`, border visibility from edge fusion

### Update Strategy (no unnecessary rebuilds)

| Change | Action |
|--------|--------|
| Camera rotation | Update world container `transform: rotateX() rotateY()` only |
| Gap (non-zero ↔ non-zero) | Update `translate3d` on boxel divs only |
| Gap (crossing 0 boundary) | Full rebuild (edge fusion logic changes) |
| Opacity | Set CSS variable `--face-opacity` on root |
| Style change | Rebuild affected boxel elements |
| Add/remove boxel | Create/destroy affected divs + update neighbor edge fusion |

### Orbit Controls (`renderers/dom/orbit.ts`)

- Pointer drag → rotates world container `rotateX`/`rotateY`
- Scroll → zoom via scale or perspective distance
- Touch support (single finger rotate, pinch zoom)

---

## Animations (`animation/`)

### Explode / Collapse (`animation/explode.ts`)

Scale gap from 0 to `factor`, staggered by distance from center. Easing via cubic-bezier or preset easings.

### Layer Rotation (`animation/layer-rotate.ts`)

Rubik's-style: collect all boxels where `position[axis] === layerIndex`, reparent to a temporary wrapper div, animate its CSS rotation, then reparent back and snap grid positions to new coordinates.

### Tweens (`animation/tweens.ts`)

- `animateGap({ from, to, duration })` — smooth gap interpolation
- `animateOpacity({ from, to, duration })` — fade via CSS variable
- `animateEach(callback, { duration, loop })` — per-boxel custom animation, callback receives `(boxel, [x,y,z], t)` where t is 0→1

### Animator (`animation/animator.ts`)

Shared RAF loop. Manages active tweens, easing functions, start/stop/cancel. Supports multiple concurrent animations.

---

## Image Mapping (`core/image-mapper.ts`)

Maps an image across boxel faces.

- **`layout: 'cross'`**: Standard cube net cross layout, image sliced into grid cells matching boxel positions
- **`layout: 'strip'`**: Six faces in a horizontal strip
- **`layout: 'per-face'`**: Separate image per face `{ top: img1, front: img2, ... }`

Each exposed face gets the correct cropped region as a CSS `background-image` with `background-position` and `background-size`.

---

## Events

```typescript
b.on('boxel:click', (e) => {
  // e.boxel, e.position, e.face, e.originalEvent
})
b.on('boxel:hover', (e) => { ... })
b.on('boxel:pointerdown', (e) => { ... })
b.on('rotate', (e) => { ... })
b.on('zoom', (e) => { ... })
b.on('render', (e) => { ... })
```

DOM renderer attaches native event listeners on face divs. Event object includes boxel data, grid position, face name, and original DOM event.

---

## Public API (`index.ts` — Boxels class)

```typescript
import { Boxels } from 'boxels'

const b = new Boxels({
  renderer: 'dom',
  container: document.body,
  voxelSize: 50,
  gap: 0,
  edgeWidth: 1,
  edgeColor: '#333',
  camera: {
    type: 'perspective',
    distance: 1200,
    rotation: [-25, 35],
  },
  style: {
    default: { fill: '#ddd', stroke: '#999' },
  },
  orbit: true,
  zoom: true,
})

// Manipulation
b.addBox({ position: [0,0,0], size: [3,3,3] })
b.addBox({ position: [1,1,1], size: [1,1,1], mode: 'subtract' })
b.addSphere({ center: [4,4,4], radius: 3 })
b.addLine({ from: [0,0,0], to: [8,8,8], radius: 1 })
b.removeBox({ position: [1,1,0], size: [1,3,1] })
b.removeSphere({ center: [3,3,3], radius: 2 })
b.setBoxel([x,y,z], true)
b.setBoxel([x,y,z], false)
b.hasBoxel([x,y,z])
b.getBoxel([x,y,z])
b.clear()

// Rotation
b.rotate({ axis: 'y', turns: 1 })
b.rotate({ axis: 'x', turns: 2, center: [5,5,5] })

// Iteration
b.forEach((boxel, [x,y,z]) => { ... })
b.getNeighbors([x,y,z])
b.getExposure([x,y,z])

// Styling
b.styleBox({ position: [0,0,0], size: [2,2,2], style: { ... } })

// Image mapping
b.mapImage({ src: 'texture.png', layout: 'cross' })

// Animation
b.explode({ factor: 2.2, stagger: 6, easing: 'cubic-bezier(0.34,1.56,0.64,1)' })
b.collapse()
b.rotateLayer({ axis: 'y', layer: 2, direction: 1, duration: 350 })
b.animateGap({ from: 0, to: 30, duration: 800 })
b.animateOpacity({ from: 1, to: 0.15, duration: 600 })
b.animateEach((boxel, [x,y,z], t) => ({ ... }), { duration: 2000, loop: true })

// Lifecycle
b.mount(container)
b.unmount()

// Events
b.on('boxel:click', (e) => { ... })
b.on('boxel:hover', (e) => { ... })
```

---

## React Wrapper (`src/react/Boxels.tsx`)

```tsx
import { Boxels } from 'boxels/react'

<Boxels
  boxes={[
    { position: [0,0,0], size: [3,3,3] },
    { position: [1,1,1], size: [1,1,1], mode: 'subtract' },
  ]}
  style={{ default: { fill: '#e8e0d4' } }}
  gap={0}
  voxelSize={50}
  camera={{ rotation: [-25, 35] }}
  orbit={true}
  onBoxelClick={(e) => { ... }}
/>
```

Internally uses `useRef` to hold the `Boxels` instance, `useEffect` for mount/unmount lifecycle, and reconciles prop changes to the underlying instance.

---

## Docs App (`docs/`)

React 19+ app with hash router. 6 example pages:

| Example | Demonstrates |
|---------|-------------|
| **Basic** | Minimal setup, addBox, orbit controls |
| **Rubik** | Image mapping, layer rotation animation |
| **Data Viz** | Bar chart as boxel grid, functional gradient styling |
| **Architectural** | Heerich-style sculpture, boolean subtract, muted presets |
| **Glass** | Translucent faces, `backdrop-filter: blur()`, glass preset |
| **Performance** | 10×10×10 (1000 boxels) with edge fusion, FPS counter |

Each example shows both the rendered scene and the code used to create it.

---

## Performance Targets

- DOM renderer bundle < 5KB gzipped (zero dependencies)
- 3×3×3 cube renders in < 5ms
- 10×10×10 cube (1,000 boxels) at 60fps with edge fusion
- Edge fusion culls internal faces from DOM entirely (1,000 boxels → ~600 exposed faces)
