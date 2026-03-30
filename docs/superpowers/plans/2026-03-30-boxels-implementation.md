# boxels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a DOM-based 3D boxel rendering library with edge fusion, per-face styling, animations, image mapping, a React 19+ wrapper, and a docs showcase app.

**Architecture:** Single npm package with micro-module internals. Core logic (grid, boolean ops, styles, edge fusion) is renderer-agnostic. DOM renderer creates CSS 3D `preserve-3d` div hierarchies. Animation system uses shared RAF loop. React wrapper is a thin layer over the vanilla JS API. Docs app follows sonify-elements pattern (mode-based Vite config).

**Tech Stack:** TypeScript (strict), Vite 8 (lib + app builds), Vitest (tests), React 19, react-router-dom (hash router)

---

## File Structure

```
boxels-in-js/
├── src/lib/
│   ├── index.ts                      # Boxels class — public API facade
│   ├── types.ts                      # All shared types (Boxel, FaceName, BoxelStyle, etc.)
│   ├── core/
│   │   ├── grid.ts                   # BoxelGrid class
│   │   ├── boolean.ts                # applyBoolean() — union/subtract/intersect/exclude
│   │   ├── geometry.ts               # generateBox(), generateSphere(), generateLine()
│   │   ├── style.ts                  # resolveStyle() — 4-level merge with function evaluation
│   │   ├── edge-fusion.ts            # FACE_EDGES map, getExposedFaces(), getEdgeVisibility()
│   │   ├── rotation.ts              # rotateGrid() — 90° axis rotation
│   │   └── image-mapper.ts           # mapImageToFaces() — cross/strip/per-face slicing
│   ├── renderers/
│   │   ├── renderer.ts               # BoxelRenderer interface type
│   │   └── dom/
│   │       ├── dom-renderer.ts       # DOMRenderer class — mount/render/update/dispose
│   │       ├── boxel-element.ts      # createBoxelElement() — div + face divs
│   │       ├── edge-borders.ts       # applyEdgeBorders() — per-border CSS
│   │       └── orbit.ts              # OrbitControls class — drag/scroll/touch
│   ├── animation/
│   │   ├── animator.ts               # Animator class — RAF loop, easing registry
│   │   ├── explode.ts                # createExplodeAnimation() / createCollapseAnimation()
│   │   ├── layer-rotate.ts           # createLayerRotateAnimation()
│   │   └── tweens.ts                 # createGapTween(), createOpacityTween(), createEachTween()
│   └── presets/
│       └── styles.ts                 # Boxels.presets — 8 named style generators
├── src/react/
│   └── Boxels.tsx                    # <Boxels /> React component
├── docs/
│   ├── index.html                    # HTML shell
│   ├── main.tsx                      # React bootstrap
│   ├── App.tsx                       # Hash router, nav, layout
│   ├── components/
│   │   ├── BasicExample.tsx
│   │   ├── RubikExample.tsx
│   │   ├── DataVizExample.tsx
│   │   ├── ArchitecturalExample.tsx
│   │   ├── GlassExample.tsx
│   │   └── PerformanceExample.tsx
│   └── styles/
│       └── app.css
├── tests/
│   ├── core/
│   │   ├── grid.test.ts
│   │   ├── boolean.test.ts
│   │   ├── geometry.test.ts
│   │   ├── style.test.ts
│   │   ├── edge-fusion.test.ts
│   │   └── rotation.test.ts
│   ├── renderers/
│   │   └── dom-renderer.test.ts
│   └── animation/
│       ├── animator.test.ts
│       └── explode.test.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.lib.json
├── tsconfig.node.json
└── .gitignore
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.lib.json`
- Create: `tsconfig.node.json`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "boxels",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/lib/boxels.cjs",
  "module": "./dist/lib/boxels.mjs",
  "types": "./dist/lib/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/lib/boxels.mjs",
      "require": "./dist/lib/boxels.cjs",
      "types": "./dist/lib/index.d.ts"
    }
  },
  "files": [
    "dist/lib"
  ],
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "build:lib": "vite build --mode lib && tsc -p tsconfig.lib.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "sideEffects": false,
  "dependencies": {
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-router-dom": "^7.13.2"
  },
  "devDependencies": {
    "@types/node": "^24.12.0",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "typescript": "~5.9.3",
    "vite": "^8.0.1",
    "vitest": "^3.2.1",
    "happy-dom": "^18.0.1"
  }
}
```

- [ ] **Step 2: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  if (mode === 'lib') {
    return {
      build: {
        lib: {
          entry: resolve(__dirname, 'src/lib/index.ts'),
          formats: ['es', 'cjs'],
          fileName: (format) => `boxels.${format === 'es' ? 'mjs' : 'cjs'}`,
        },
        outDir: 'dist/lib',
        emptyOutDir: true,
        rollupOptions: {
          external: ['react', 'react-dom'],
        },
      },
    }
  }

  return {
    root: 'docs',
    base: '/boxels-in-js/',
    plugins: [react()],
    resolve: {
      alias: {
        'boxels': resolve(__dirname, 'src/lib/index.ts'),
      },
    },
    build: {
      outDir: resolve(__dirname, 'dist/app'),
    },
  }
})
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

- [ ] **Step 4: Create tsconfig.app.json**

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2023",
    "useDefineForClassFields": true,
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "types": ["vite/client"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "paths": {
      "boxels": ["./src/lib/index.ts"]
    },
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src/lib", "src/react", "docs"]
}
```

- [ ] **Step 5: Create tsconfig.lib.json**

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.lib.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationDir": "./dist/lib",
    "emitDeclarationOnly": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/lib"]
}
```

- [ ] **Step 6: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 7: Create .gitignore**

```
node_modules/
dist/
*.tsbuildinfo
.DS_Store
```

- [ ] **Step 8: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, `package-lock.json` generated

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json tsconfig.app.json tsconfig.lib.json tsconfig.node.json .gitignore
git commit -m "feat: project scaffolding — vite, typescript, vitest config"
```

---

### Task 2: Types

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Create types.ts with all shared type definitions**

```typescript
export type FaceName = 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right'

export interface EdgeVisibility {
  left: boolean
  right: boolean
  top: boolean
  bottom: boolean
}

export type StyleValue = string | ((x: number, y: number, z: number) => string)

export interface FaceStyle {
  fill?: StyleValue
  stroke?: StyleValue
  opacity?: number
  className?: string
  backdropFilter?: string
}

export type FaceStyleOrFn = FaceStyle | ((x: number, y: number, z: number) => FaceStyle)

export interface BoxelStyle {
  default?: FaceStyleOrFn
  top?: FaceStyleOrFn
  bottom?: FaceStyleOrFn
  front?: FaceStyleOrFn
  back?: FaceStyleOrFn
  left?: FaceStyleOrFn
  right?: FaceStyleOrFn
}

export interface ResolvedFaceStyle {
  fill: string
  stroke: string
  opacity: number
  className?: string
  backdropFilter?: string
}

export interface Boxel {
  position: [number, number, number]
  style?: BoxelStyle
  meta?: Record<string, unknown>
  opaque: boolean
}

export type Vec3 = [number, number, number]

export type BooleanMode = 'union' | 'subtract' | 'intersect' | 'exclude'

export interface AddBoxOptions {
  position: Vec3
  size: Vec3
  mode?: BooleanMode
  style?: BoxelStyle
}

export interface AddSphereOptions {
  center: Vec3
  radius: number
  mode?: BooleanMode
  style?: BoxelStyle
}

export interface AddLineOptions {
  from: Vec3
  to: Vec3
  radius?: number
  mode?: BooleanMode
  style?: BoxelStyle
}

export interface RemoveBoxOptions {
  position: Vec3
  size: Vec3
}

export interface RemoveSphereOptions {
  center: Vec3
  radius: number
}

export interface StyleBoxOptions {
  position: Vec3
  size: Vec3
  style: BoxelStyle
}

export interface RotateOptions {
  axis: 'x' | 'y' | 'z'
  turns: number
  center?: Vec3
}

export interface CameraOptions {
  type?: 'perspective' | 'orthographic'
  distance?: number
  rotation?: [number, number]
}

export interface BoxelsOptions {
  renderer?: 'dom'
  container?: HTMLElement
  voxelSize?: number
  gap?: number
  edgeWidth?: number
  edgeColor?: string
  camera?: CameraOptions
  style?: BoxelStyle
  orbit?: boolean
  zoom?: boolean
}

export interface BoxelEvent {
  boxel: Boxel
  position: Vec3
  face: FaceName
  originalEvent: Event
}

export type BoxelEventType =
  | 'boxel:click'
  | 'boxel:hover'
  | 'boxel:pointerdown'
  | 'rotate'
  | 'zoom'
  | 'render'

export interface ExplodeOptions {
  factor?: number
  stagger?: number
  easing?: string
  duration?: number
}

export interface LayerRotateOptions {
  axis: 'x' | 'y' | 'z'
  layer: number
  direction: 1 | -1
  duration?: number
}

export interface TweenOptions {
  from: number
  to: number
  duration?: number
  easing?: string
}

export interface AnimateEachCallback {
  (boxel: Boxel, position: Vec3, t: number): {
    translate?: Vec3
    opacity?: number
    scale?: number
  }
}

export interface AnimateEachOptions {
  duration?: number
  loop?: boolean
  easing?: string
}

export interface ImageMapOptions {
  src: string | HTMLImageElement | HTMLCanvasElement
  layout: 'cross' | 'strip' | 'per-face'
  faces?: Partial<Record<FaceName, string | HTMLImageElement | HTMLCanvasElement>>
}

export interface BoxelRenderer {
  mount(container: HTMLElement): void
  unmount(): void
  render(options: RenderOptions): void
  updateTransform(rotX: number, rotY: number): void
  updateGap(gap: number): void
  updateOpacity(opacity: number): void
  setBoxelTransform(key: string, translate: Vec3, scale?: number, opacity?: number): void
  getWorldContainer(): HTMLElement | null
  dispose(): void
}

export interface RenderOptions {
  grid: import('./core/grid').BoxelGrid
  voxelSize: number
  gap: number
  edgeWidth: number
  edgeColor: string
  globalStyle?: BoxelStyle
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add shared type definitions"
```

---

### Task 3: BoxelGrid

**Files:**
- Create: `src/lib/core/grid.ts`
- Create: `tests/core/grid.test.ts`

- [ ] **Step 1: Write failing tests for BoxelGrid**

```typescript
import { describe, it, expect } from 'vitest'
import { BoxelGrid } from '../../src/lib/core/grid'

describe('BoxelGrid', () => {
  it('starts empty', () => {
    const grid = new BoxelGrid()
    expect(grid.count).toBe(0)
  })

  it('sets and gets a boxel', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(1, 2, 3, { position: [1, 2, 3], opaque: true })
    expect(grid.hasBoxel(1, 2, 3)).toBe(true)
    expect(grid.getBoxel(1, 2, 3)?.position).toEqual([1, 2, 3])
  })

  it('removes a boxel by setting null', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    grid.setBoxel(0, 0, 0, null)
    expect(grid.hasBoxel(0, 0, 0)).toBe(false)
    expect(grid.count).toBe(0)
  })

  it('returns null for empty positions', () => {
    const grid = new BoxelGrid()
    expect(grid.getBoxel(5, 5, 5)).toBeNull()
    expect(grid.hasBoxel(5, 5, 5)).toBe(false)
  })

  it('tracks bounds as boxels are added', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(1, 2, 3, { position: [1, 2, 3], opaque: true })
    grid.setBoxel(5, 0, 1, { position: [5, 0, 1], opaque: true })
    const bounds = grid.getBounds()
    expect(bounds.min).toEqual([1, 0, 1])
    expect(bounds.max).toEqual([5, 2, 3])
  })

  it('returns empty bounds for empty grid', () => {
    const grid = new BoxelGrid()
    const bounds = grid.getBounds()
    expect(bounds.min).toEqual([0, 0, 0])
    expect(bounds.max).toEqual([0, 0, 0])
  })

  it('iterates all boxels with forEach', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    grid.setBoxel(1, 1, 1, { position: [1, 1, 1], opaque: true })
    const positions: [number, number, number][] = []
    grid.forEach((_boxel, pos) => positions.push(pos))
    expect(positions).toHaveLength(2)
    expect(positions).toContainEqual([0, 0, 0])
    expect(positions).toContainEqual([1, 1, 1])
  })

  it('gets neighbors for a position', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(1, 0, 0, { position: [1, 0, 0], opaque: true })
    grid.setBoxel(0, 1, 0, { position: [0, 1, 0], opaque: true })
    const neighbors = grid.getNeighbors(0, 0, 0)
    expect(neighbors.right).not.toBeNull()
    expect(neighbors.top).not.toBeNull()
    expect(neighbors.left).toBeNull()
    expect(neighbors.bottom).toBeNull()
    expect(neighbors.front).toBeNull()
    expect(neighbors.back).toBeNull()
  })

  it('counts exposure (open faces)', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    expect(grid.getExposure(0, 0, 0)).toBe(6) // fully exposed

    grid.setBoxel(1, 0, 0, { position: [1, 0, 0], opaque: true })
    expect(grid.getExposure(0, 0, 0)).toBe(5) // right face hidden
    expect(grid.getExposure(1, 0, 0)).toBe(5) // left face hidden
  })

  it('clears all boxels', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    grid.setBoxel(1, 1, 1, { position: [1, 1, 1], opaque: true })
    grid.clear()
    expect(grid.count).toBe(0)
    expect(grid.hasBoxel(0, 0, 0)).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/core/grid.test.ts`
Expected: FAIL — module `../../src/lib/core/grid` not found

- [ ] **Step 3: Implement BoxelGrid**

```typescript
import type { Boxel, FaceName, Vec3 } from '../types'

const FACE_NORMALS: Record<FaceName, Vec3> = {
  right:  [1, 0, 0],
  left:   [-1, 0, 0],
  top:    [0, 1, 0],
  bottom: [0, -1, 0],
  front:  [0, 0, 1],
  back:   [0, 0, -1],
}

const ALL_FACES: FaceName[] = ['top', 'bottom', 'front', 'back', 'left', 'right']

function key(x: number, y: number, z: number): string {
  return `${x},${y},${z}`
}

export class BoxelGrid {
  readonly data: Map<string, Boxel> = new Map()

  get count(): number {
    return this.data.size
  }

  hasBoxel(x: number, y: number, z: number): boolean {
    return this.data.has(key(x, y, z))
  }

  getBoxel(x: number, y: number, z: number): Boxel | null {
    return this.data.get(key(x, y, z)) ?? null
  }

  setBoxel(x: number, y: number, z: number, boxel: Boxel | null): void {
    const k = key(x, y, z)
    if (boxel === null) {
      this.data.delete(k)
    } else {
      this.data.set(k, boxel)
    }
  }

  getNeighbors(x: number, y: number, z: number): Record<FaceName, Boxel | null> {
    const result = {} as Record<FaceName, Boxel | null>
    for (const face of ALL_FACES) {
      const [dx, dy, dz] = FACE_NORMALS[face]
      result[face] = this.getBoxel(x + dx, y + dy, z + dz)
    }
    return result
  }

  getExposure(x: number, y: number, z: number): number {
    let count = 0
    for (const face of ALL_FACES) {
      const [dx, dy, dz] = FACE_NORMALS[face]
      if (!this.hasBoxel(x + dx, y + dy, z + dz)) {
        count++
      }
    }
    return count
  }

  forEach(fn: (boxel: Boxel, pos: Vec3) => void): void {
    for (const [k, boxel] of this.data) {
      const parts = k.split(',').map(Number) as Vec3
      fn(boxel, parts)
    }
  }

  getBounds(): { min: Vec3; max: Vec3 } {
    if (this.data.size === 0) {
      return { min: [0, 0, 0], max: [0, 0, 0] }
    }
    let minX = Infinity, minY = Infinity, minZ = Infinity
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
    for (const k of this.data.keys()) {
      const [x, y, z] = k.split(',').map(Number)
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (z < minZ) minZ = z
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
      if (z > maxZ) maxZ = z
    }
    return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] }
  }

  clear(): void {
    this.data.clear()
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/core/grid.test.ts`
Expected: All 9 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/core/grid.ts tests/core/grid.test.ts
git commit -m "feat: BoxelGrid — occupancy map with neighbor queries and bounds"
```

---

### Task 4: Geometry Primitives

**Files:**
- Create: `src/lib/core/geometry.ts`
- Create: `tests/core/geometry.test.ts`

- [ ] **Step 1: Write failing tests for geometry generators**

```typescript
import { describe, it, expect } from 'vitest'
import { generateBox, generateSphere, generateLine } from '../../src/lib/core/geometry'

describe('generateBox', () => {
  it('generates positions for a 2x2x2 box at origin', () => {
    const positions = generateBox([0, 0, 0], [2, 2, 2])
    expect(positions).toHaveLength(8)
    expect(positions).toContainEqual([0, 0, 0])
    expect(positions).toContainEqual([1, 1, 1])
  })

  it('generates positions offset from origin', () => {
    const positions = generateBox([3, 3, 3], [2, 1, 1])
    expect(positions).toHaveLength(2)
    expect(positions).toContainEqual([3, 3, 3])
    expect(positions).toContainEqual([4, 3, 3])
  })

  it('generates single voxel for size [1,1,1]', () => {
    const positions = generateBox([5, 5, 5], [1, 1, 1])
    expect(positions).toHaveLength(1)
    expect(positions).toContainEqual([5, 5, 5])
  })
})

describe('generateSphere', () => {
  it('generates a sphere of radius 1 (7 voxels — cross shape)', () => {
    const positions = generateSphere([5, 5, 5], 1)
    // radius 1: center + 6 neighbors = 7
    expect(positions.length).toBeGreaterThanOrEqual(7)
    expect(positions).toContainEqual([5, 5, 5])
  })

  it('generates a sphere of radius 2', () => {
    const positions = generateSphere([5, 5, 5], 2)
    // All positions should be within radius 2 of center
    for (const [x, y, z] of positions) {
      const dist = Math.sqrt((x - 5) ** 2 + (y - 5) ** 2 + (z - 5) ** 2)
      expect(dist).toBeLessThanOrEqual(2 + 0.5) // +0.5 for voxel center rounding
    }
  })

  it('is symmetric', () => {
    const positions = generateSphere([5, 5, 5], 3)
    const set = new Set(positions.map(([x, y, z]) => `${x},${y},${z}`))
    // Check a few symmetric pairs
    for (const [x, y, z] of positions) {
      const mirror = `${10 - x},${10 - y},${10 - z}` // mirror about center [5,5,5]
      expect(set.has(mirror)).toBe(true)
    }
  })
})

describe('generateLine', () => {
  it('generates a line along x-axis', () => {
    const positions = generateLine([0, 0, 0], [4, 0, 0], 0)
    expect(positions).toHaveLength(5) // 0,1,2,3,4
    for (let x = 0; x <= 4; x++) {
      expect(positions).toContainEqual([x, 0, 0])
    }
  })

  it('generates a diagonal line', () => {
    const positions = generateLine([0, 0, 0], [3, 3, 3], 0)
    expect(positions.length).toBeGreaterThanOrEqual(4) // at least the endpoints + intermediates
    expect(positions).toContainEqual([0, 0, 0])
    expect(positions).toContainEqual([3, 3, 3])
  })

  it('generates a thick line with radius', () => {
    const positions = generateLine([0, 0, 0], [4, 0, 0], 1)
    expect(positions.length).toBeGreaterThan(5) // thicker than 1-voxel line
    // Should include some positions off the axis
    const hasOffAxis = positions.some(([_x, y, z]) => y !== 0 || z !== 0)
    expect(hasOffAxis).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/core/geometry.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement geometry generators**

```typescript
import type { Vec3 } from '../types'

export function generateBox(position: Vec3, size: Vec3): Vec3[] {
  const [px, py, pz] = position
  const [sx, sy, sz] = size
  const positions: Vec3[] = []
  for (let x = px; x < px + sx; x++) {
    for (let y = py; y < py + sy; y++) {
      for (let z = pz; z < pz + sz; z++) {
        positions.push([x, y, z])
      }
    }
  }
  return positions
}

export function generateSphere(center: Vec3, radius: number): Vec3[] {
  const [cx, cy, cz] = center
  const r = radius
  const positions: Vec3[] = []
  for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++) {
        const dx = x - cx
        const dy = y - cy
        const dz = z - cz
        if (dx * dx + dy * dy + dz * dz <= r * r) {
          positions.push([x, y, z])
        }
      }
    }
  }
  return positions
}

export function generateLine(from: Vec3, to: Vec3, radius: number = 0): Vec3[] {
  const [x0, y0, z0] = from
  const [x1, y1, z1] = to
  const dx = x1 - x0
  const dy = y1 - y0
  const dz = z1 - z0
  const steps = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz))

  if (steps === 0) {
    return radius === 0 ? [from] : generateSphere(from, radius)
  }

  // Generate center line positions using DDA
  const centerPositions: Vec3[] = []
  const seen = new Set<string>()
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = Math.round(x0 + dx * t)
    const y = Math.round(y0 + dy * t)
    const z = Math.round(z0 + dz * t)
    const key = `${x},${y},${z}`
    if (!seen.has(key)) {
      seen.add(key)
      centerPositions.push([x, y, z])
    }
  }

  if (radius === 0) {
    return centerPositions
  }

  // Expand each center position by radius
  const allPositions = new Set<string>()
  const result: Vec3[] = []
  for (const center of centerPositions) {
    const sphere = generateSphere(center, radius)
    for (const pos of sphere) {
      const key = `${pos[0]},${pos[1]},${pos[2]}`
      if (!allPositions.has(key)) {
        allPositions.add(key)
        result.push(pos)
      }
    }
  }
  return result
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/core/geometry.test.ts`
Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/core/geometry.ts tests/core/geometry.test.ts
git commit -m "feat: geometry primitives — generateBox, generateSphere, generateLine"
```

---

### Task 5: Boolean Operations

**Files:**
- Create: `src/lib/core/boolean.ts`
- Create: `tests/core/boolean.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest'
import { BoxelGrid } from '../../src/lib/core/grid'
import { applyBoolean } from '../../src/lib/core/boolean'
import type { Vec3, BoxelStyle } from '../../src/lib/types'

describe('applyBoolean', () => {
  it('union adds all positions to grid', () => {
    const grid = new BoxelGrid()
    const positions: Vec3[] = [[0, 0, 0], [1, 0, 0], [2, 0, 0]]
    applyBoolean(grid, positions, 'union')
    expect(grid.count).toBe(3)
    expect(grid.hasBoxel(0, 0, 0)).toBe(true)
    expect(grid.hasBoxel(1, 0, 0)).toBe(true)
    expect(grid.hasBoxel(2, 0, 0)).toBe(true)
  })

  it('union with style applies style to new boxels', () => {
    const grid = new BoxelGrid()
    const style: BoxelStyle = { default: { fill: 'red' } }
    applyBoolean(grid, [[0, 0, 0]], 'union', style)
    expect(grid.getBoxel(0, 0, 0)?.style).toEqual(style)
  })

  it('subtract removes positions from grid', () => {
    const grid = new BoxelGrid()
    applyBoolean(grid, [[0, 0, 0], [1, 0, 0], [2, 0, 0]], 'union')
    applyBoolean(grid, [[1, 0, 0]], 'subtract')
    expect(grid.count).toBe(2)
    expect(grid.hasBoxel(1, 0, 0)).toBe(false)
  })

  it('subtract ignores positions not in grid', () => {
    const grid = new BoxelGrid()
    applyBoolean(grid, [[0, 0, 0]], 'union')
    applyBoolean(grid, [[5, 5, 5]], 'subtract')
    expect(grid.count).toBe(1)
  })

  it('intersect keeps only overlapping positions', () => {
    const grid = new BoxelGrid()
    applyBoolean(grid, [[0, 0, 0], [1, 0, 0], [2, 0, 0]], 'union')
    applyBoolean(grid, [[1, 0, 0], [2, 0, 0], [3, 0, 0]], 'intersect')
    expect(grid.count).toBe(2)
    expect(grid.hasBoxel(0, 0, 0)).toBe(false)
    expect(grid.hasBoxel(1, 0, 0)).toBe(true)
    expect(grid.hasBoxel(2, 0, 0)).toBe(true)
    expect(grid.hasBoxel(3, 0, 0)).toBe(false)
  })

  it('exclude toggles positions (symmetric difference)', () => {
    const grid = new BoxelGrid()
    applyBoolean(grid, [[0, 0, 0], [1, 0, 0]], 'union')
    applyBoolean(grid, [[1, 0, 0], [2, 0, 0]], 'exclude')
    expect(grid.count).toBe(2)
    expect(grid.hasBoxel(0, 0, 0)).toBe(true)  // was in grid, not in new set
    expect(grid.hasBoxel(1, 0, 0)).toBe(false)  // was in both → removed
    expect(grid.hasBoxel(2, 0, 0)).toBe(true)   // was only in new set → added
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/core/boolean.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement applyBoolean**

```typescript
import type { Vec3, BooleanMode, BoxelStyle } from '../types'
import type { BoxelGrid } from './grid'

export function applyBoolean(
  grid: BoxelGrid,
  positions: Vec3[],
  mode: BooleanMode,
  style?: BoxelStyle,
): void {
  switch (mode) {
    case 'union':
      for (const [x, y, z] of positions) {
        grid.setBoxel(x, y, z, { position: [x, y, z], opaque: true, style })
      }
      break

    case 'subtract':
      for (const [x, y, z] of positions) {
        grid.setBoxel(x, y, z, null)
      }
      break

    case 'intersect': {
      const posSet = new Set(positions.map(([x, y, z]) => `${x},${y},${z}`))
      const toRemove: Vec3[] = []
      grid.forEach((_boxel, pos) => {
        const key = `${pos[0]},${pos[1]},${pos[2]}`
        if (!posSet.has(key)) {
          toRemove.push(pos)
        }
      })
      for (const [x, y, z] of toRemove) {
        grid.setBoxel(x, y, z, null)
      }
      break
    }

    case 'exclude': {
      for (const [x, y, z] of positions) {
        if (grid.hasBoxel(x, y, z)) {
          grid.setBoxel(x, y, z, null)
        } else {
          grid.setBoxel(x, y, z, { position: [x, y, z], opaque: true, style })
        }
      }
      break
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/core/boolean.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/core/boolean.ts tests/core/boolean.test.ts
git commit -m "feat: boolean operations — union, subtract, intersect, exclude"
```

---

### Task 6: Style Resolution

**Files:**
- Create: `src/lib/core/style.ts`
- Create: `tests/core/style.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest'
import { resolveStyle } from '../../src/lib/core/style'
import type { BoxelStyle, ResolvedFaceStyle } from '../../src/lib/types'

describe('resolveStyle', () => {
  it('returns library fallback when no styles provided', () => {
    const result = resolveStyle('top', 0, 0, 0)
    expect(result.fill).toBe('#ddd')
    expect(result.stroke).toBe('#333')
    expect(result.opacity).toBe(1)
  })

  it('uses constructor default style', () => {
    const global: BoxelStyle = { default: { fill: 'red', stroke: 'blue' } }
    const result = resolveStyle('top', 0, 0, 0, undefined, global)
    expect(result.fill).toBe('red')
    expect(result.stroke).toBe('blue')
  })

  it('boxel default overrides constructor default', () => {
    const global: BoxelStyle = { default: { fill: 'red' } }
    const boxel: BoxelStyle = { default: { fill: 'green' } }
    const result = resolveStyle('top', 0, 0, 0, boxel, global)
    expect(result.fill).toBe('green')
  })

  it('face-specific overrides default', () => {
    const boxel: BoxelStyle = {
      default: { fill: 'red' },
      top: { fill: 'blue' },
    }
    const result = resolveStyle('top', 0, 0, 0, boxel)
    expect(result.fill).toBe('blue')
    // front should still use default
    const front = resolveStyle('front', 0, 0, 0, boxel)
    expect(front.fill).toBe('red')
  })

  it('evaluates functional styles with position', () => {
    const boxel: BoxelStyle = {
      default: (x, _y, _z) => ({ fill: x > 2 ? 'red' : 'blue' }),
    }
    expect(resolveStyle('top', 0, 0, 0, boxel).fill).toBe('blue')
    expect(resolveStyle('top', 5, 0, 0, boxel).fill).toBe('red')
  })

  it('evaluates functional StyleValue within FaceStyle', () => {
    const boxel: BoxelStyle = {
      default: { fill: (x, _y, _z) => `hsl(${x * 10}, 50%, 50%)` },
    }
    const result = resolveStyle('top', 10, 0, 0, boxel)
    expect(result.fill).toBe('hsl(100, 50%, 50%)')
  })

  it('merges partial styles — unset properties fall through', () => {
    const global: BoxelStyle = { default: { fill: 'red', stroke: 'blue' } }
    const boxel: BoxelStyle = { default: { fill: 'green' } }
    const result = resolveStyle('top', 0, 0, 0, boxel, global)
    expect(result.fill).toBe('green')
    expect(result.stroke).toBe('blue') // from global
  })

  it('preserves className and backdropFilter', () => {
    const boxel: BoxelStyle = {
      top: { fill: 'red', className: 'highlight', backdropFilter: 'blur(4px)' },
    }
    const result = resolveStyle('top', 0, 0, 0, boxel)
    expect(result.className).toBe('highlight')
    expect(result.backdropFilter).toBe('blur(4px)')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/core/style.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement resolveStyle**

```typescript
import type { BoxelStyle, FaceStyle, FaceStyleOrFn, FaceName, ResolvedFaceStyle, StyleValue } from '../types'

const LIBRARY_FALLBACK: ResolvedFaceStyle = {
  fill: '#ddd',
  stroke: '#333',
  opacity: 1,
}

function evaluateStyleValue(value: StyleValue, x: number, y: number, z: number): string {
  return typeof value === 'function' ? value(x, y, z) : value
}

function evaluateFaceStyleOrFn(
  styleOrFn: FaceStyleOrFn | undefined,
  x: number,
  y: number,
  z: number,
): FaceStyle | undefined {
  if (styleOrFn === undefined) return undefined
  if (typeof styleOrFn === 'function') return styleOrFn(x, y, z)
  return styleOrFn
}

function resolveFaceStyle(style: FaceStyle | undefined, x: number, y: number, z: number): Partial<ResolvedFaceStyle> {
  if (!style) return {}
  const result: Partial<ResolvedFaceStyle> = {}
  if (style.fill !== undefined) result.fill = evaluateStyleValue(style.fill, x, y, z)
  if (style.stroke !== undefined) result.stroke = evaluateStyleValue(style.stroke, x, y, z)
  if (style.opacity !== undefined) result.opacity = style.opacity
  if (style.className !== undefined) result.className = style.className
  if (style.backdropFilter !== undefined) result.backdropFilter = style.backdropFilter
  return result
}

export function resolveStyle(
  face: FaceName,
  x: number,
  y: number,
  z: number,
  boxelStyle?: BoxelStyle,
  globalStyle?: BoxelStyle,
): ResolvedFaceStyle {
  // Layer 4: library fallback
  const result: ResolvedFaceStyle = { ...LIBRARY_FALLBACK }

  // Layer 3: constructor default
  if (globalStyle) {
    const globalDefault = evaluateFaceStyleOrFn(globalStyle.default, x, y, z)
    Object.assign(result, resolveFaceStyle(globalDefault, x, y, z))

    const globalFace = evaluateFaceStyleOrFn(globalStyle[face], x, y, z)
    Object.assign(result, resolveFaceStyle(globalFace, x, y, z))
  }

  // Layer 2: boxel default
  if (boxelStyle) {
    const boxelDefault = evaluateFaceStyleOrFn(boxelStyle.default, x, y, z)
    Object.assign(result, resolveFaceStyle(boxelDefault, x, y, z))

    // Layer 1: face-specific
    const boxelFace = evaluateFaceStyleOrFn(boxelStyle[face], x, y, z)
    Object.assign(result, resolveFaceStyle(boxelFace, x, y, z))
  }

  return result
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/core/style.test.ts`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/core/style.ts tests/core/style.test.ts
git commit -m "feat: style resolution — 4-level merge with functional style evaluation"
```

---

### Task 7: Edge Fusion

**Files:**
- Create: `src/lib/core/edge-fusion.ts`
- Create: `tests/core/edge-fusion.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest'
import { BoxelGrid } from '../../src/lib/core/grid'
import { getExposedFaces, getEdgeVisibility } from '../../src/lib/core/edge-fusion'

describe('getExposedFaces', () => {
  it('returns all 6 faces for an isolated boxel', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    const faces = getExposedFaces(grid, 0, 0, 0)
    expect(faces).toHaveLength(6)
    expect(faces).toContain('top')
    expect(faces).toContain('bottom')
    expect(faces).toContain('front')
    expect(faces).toContain('back')
    expect(faces).toContain('left')
    expect(faces).toContain('right')
  })

  it('culls face when neighbor exists in that direction', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    grid.setBoxel(1, 0, 0, { position: [1, 0, 0], opaque: true })  // right neighbor
    const faces = getExposedFaces(grid, 0, 0, 0)
    expect(faces).toHaveLength(5)
    expect(faces).not.toContain('right')
  })

  it('fully enclosed boxel has no exposed faces', () => {
    const grid = new BoxelGrid()
    // center + all 6 neighbors
    grid.setBoxel(1, 1, 1, { position: [1, 1, 1], opaque: true })
    grid.setBoxel(0, 1, 1, { position: [0, 1, 1], opaque: true })
    grid.setBoxel(2, 1, 1, { position: [2, 1, 1], opaque: true })
    grid.setBoxel(1, 0, 1, { position: [1, 0, 1], opaque: true })
    grid.setBoxel(1, 2, 1, { position: [1, 2, 1], opaque: true })
    grid.setBoxel(1, 1, 0, { position: [1, 1, 0], opaque: true })
    grid.setBoxel(1, 1, 2, { position: [1, 1, 2], opaque: true })
    const faces = getExposedFaces(grid, 1, 1, 1)
    expect(faces).toHaveLength(0)
  })
})

describe('getEdgeVisibility', () => {
  it('shows all edges for isolated boxel face', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    const edges = getEdgeVisibility(grid, 0, 0, 0, 'top')
    expect(edges).toEqual({ left: true, right: true, top: true, bottom: true })
  })

  it('hides edge when planar neighbor shares the same exposed face', () => {
    const grid = new BoxelGrid()
    // Two boxels side by side — both have top face exposed
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    grid.setBoxel(1, 0, 0, { position: [1, 0, 0], opaque: true })

    // For top face of (0,0,0): right edge should be hidden (neighbor at [1,0,0] also has top)
    const edges0 = getEdgeVisibility(grid, 0, 0, 0, 'top')
    expect(edges0.right).toBe(false) // Right border: neighbor [1,0,0] also has top face

    // For top face of (1,0,0): left edge should be hidden
    const edges1 = getEdgeVisibility(grid, 1, 0, 0, 'top')
    expect(edges1.left).toBe(false)
  })

  it('shows edge when planar neighbor does NOT have that face exposed', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    grid.setBoxel(1, 0, 0, { position: [1, 0, 0], opaque: true })
    // Stack something on top of the right neighbor — its top face is now culled
    grid.setBoxel(1, 1, 0, { position: [1, 1, 0], opaque: true })

    const edges = getEdgeVisibility(grid, 0, 0, 0, 'top')
    // Right neighbor (1,0,0) no longer has top face exposed, so show the border
    expect(edges.right).toBe(true)
  })

  it('fuses edges correctly for front face', () => {
    const grid = new BoxelGrid()
    // Two boxels stacked vertically, both have front face exposed
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    grid.setBoxel(0, 1, 0, { position: [0, 1, 0], opaque: true })

    // Front face of bottom boxel: top border hidden (neighbor above also has front)
    const edgesBottom = getEdgeVisibility(grid, 0, 0, 0, 'front')
    expect(edgesBottom.top).toBe(false)

    // Front face of top boxel: bottom border hidden
    const edgesTop = getEdgeVisibility(grid, 0, 1, 0, 'front')
    expect(edgesTop.bottom).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/core/edge-fusion.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement edge fusion**

```typescript
import type { FaceName, EdgeVisibility, Vec3 } from '../types'
import type { BoxelGrid } from './grid'

const FACE_NORMALS: Record<FaceName, Vec3> = {
  right:  [1, 0, 0],
  left:   [-1, 0, 0],
  top:    [0, 1, 0],
  bottom: [0, -1, 0],
  front:  [0, 0, 1],
  back:   [0, 0, -1],
}

// Maps CSS border direction → 3D neighbor offset for each face type.
// "Left" means CSS border-left of the face div after its transform.
const FACE_EDGES: Record<FaceName, Record<'Left' | 'Right' | 'Top' | 'Bottom', Vec3>> = {
  top:    { Left: [-1, 0, 0], Right: [1, 0, 0], Top: [0, 0, -1], Bottom: [0, 0, 1] },
  bottom: { Left: [-1, 0, 0], Right: [1, 0, 0], Top: [0, 0, 1],  Bottom: [0, 0, -1] },
  front:  { Left: [-1, 0, 0], Right: [1, 0, 0], Top: [0, 1, 0],  Bottom: [0, -1, 0] },
  back:   { Left: [1, 0, 0],  Right: [-1, 0, 0], Top: [0, 1, 0], Bottom: [0, -1, 0] },
  left:   { Left: [0, 0, 1],  Right: [0, 0, -1], Top: [0, 1, 0], Bottom: [0, -1, 0] },
  right:  { Left: [0, 0, -1], Right: [0, 0, 1],  Top: [0, 1, 0], Bottom: [0, -1, 0] },
}

const ALL_FACES: FaceName[] = ['top', 'bottom', 'front', 'back', 'left', 'right']

export function getExposedFaces(grid: BoxelGrid, x: number, y: number, z: number): FaceName[] {
  const exposed: FaceName[] = []
  for (const face of ALL_FACES) {
    const [dx, dy, dz] = FACE_NORMALS[face]
    if (!grid.hasBoxel(x + dx, y + dy, z + dz)) {
      exposed.push(face)
    }
  }
  return exposed
}

export function getEdgeVisibility(
  grid: BoxelGrid,
  x: number,
  y: number,
  z: number,
  face: FaceName,
): EdgeVisibility {
  const edges = FACE_EDGES[face]
  return {
    left: !neighborHasFaceExposed(grid, x, y, z, face, edges.Left),
    right: !neighborHasFaceExposed(grid, x, y, z, face, edges.Right),
    top: !neighborHasFaceExposed(grid, x, y, z, face, edges.Top),
    bottom: !neighborHasFaceExposed(grid, x, y, z, face, edges.Bottom),
  }
}

function neighborHasFaceExposed(
  grid: BoxelGrid,
  x: number,
  y: number,
  z: number,
  face: FaceName,
  offset: Vec3,
): boolean {
  const nx = x + offset[0]
  const ny = y + offset[1]
  const nz = z + offset[2]
  if (!grid.hasBoxel(nx, ny, nz)) return false
  // Check if that neighbor also has the same face exposed
  const normal = FACE_NORMALS[face]
  return !grid.hasBoxel(nx + normal[0], ny + normal[1], nz + normal[2])
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/core/edge-fusion.test.ts`
Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/core/edge-fusion.ts tests/core/edge-fusion.test.ts
git commit -m "feat: edge fusion — face culling and per-border visibility detection"
```

---

### Task 8: Rotation

**Files:**
- Create: `src/lib/core/rotation.ts`
- Create: `tests/core/rotation.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest'
import { BoxelGrid } from '../../src/lib/core/grid'
import { rotateGrid } from '../../src/lib/core/rotation'

describe('rotateGrid', () => {
  it('rotates a single boxel 90° around Y axis', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(1, 0, 0, { position: [1, 0, 0], opaque: true })
    rotateGrid(grid, 'y', 1) // 1 turn = 90° CW when looking down Y
    // (1,0,0) rotated 90° CW around Y → (0,0,-1)
    expect(grid.hasBoxel(1, 0, 0)).toBe(false)
    expect(grid.hasBoxel(0, 0, -1)).toBe(true)
  })

  it('rotates 2 turns (180°)', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(1, 0, 0, { position: [1, 0, 0], opaque: true })
    rotateGrid(grid, 'y', 2)
    // 180° around Y: (1,0,0) → (-1,0,0)
    expect(grid.hasBoxel(-1, 0, 0)).toBe(true)
  })

  it('rotates around X axis', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(0, 1, 0, { position: [0, 1, 0], opaque: true })
    rotateGrid(grid, 'x', 1)
    // 90° CW around X: (0,1,0) → (0,0,1)
    expect(grid.hasBoxel(0, 0, 1)).toBe(true)
  })

  it('rotates around Z axis', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(1, 0, 0, { position: [1, 0, 0], opaque: true })
    rotateGrid(grid, 'z', 1)
    // 90° CW around Z: (1,0,0) → (0,1,0)
    expect(grid.hasBoxel(0, 1, 0)).toBe(true)
  })

  it('rotates around a custom center', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(2, 0, 0, { position: [2, 0, 0], opaque: true })
    rotateGrid(grid, 'y', 1, [1, 0, 0])
    // Relative to center [1,0,0]: offset is (1,0,0), rotated 90° CW around Y → (0,0,-1)
    // Absolute: (1+0, 0, 0-1) = (1,0,-1)
    expect(grid.hasBoxel(1, 0, -1)).toBe(true)
  })

  it('preserves boxel count after rotation', () => {
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    grid.setBoxel(1, 0, 0, { position: [1, 0, 0], opaque: true })
    grid.setBoxel(2, 0, 0, { position: [2, 0, 0], opaque: true })
    rotateGrid(grid, 'y', 1)
    expect(grid.count).toBe(3)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/core/rotation.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement rotateGrid**

```typescript
import type { Vec3 } from '../types'
import type { BoxelGrid } from './grid'
import type { Boxel } from '../types'

// 90° rotation matrices for each axis (applied `turns` times)
// CW when looking down the positive axis
function rotate90(axis: 'x' | 'y' | 'z', x: number, y: number, z: number): Vec3 {
  switch (axis) {
    case 'x': return [x, -z, y]
    case 'y': return [z, y, -x]
    case 'z': return [-y, x, z]
  }
}

export function rotateGrid(
  grid: BoxelGrid,
  axis: 'x' | 'y' | 'z',
  turns: number,
  center: Vec3 = [0, 0, 0],
): void {
  // Normalize turns to 0-3
  const t = ((turns % 4) + 4) % 4
  if (t === 0) return

  const entries: [Vec3, Boxel][] = []
  grid.forEach((boxel, pos) => {
    entries.push([pos, boxel])
  })

  grid.clear()

  for (const [pos, boxel] of entries) {
    let rx = pos[0] - center[0]
    let ry = pos[1] - center[1]
    let rz = pos[2] - center[2]

    for (let i = 0; i < t; i++) {
      [rx, ry, rz] = rotate90(axis, rx, ry, rz)
    }

    const newPos: Vec3 = [
      Math.round(rx + center[0]),
      Math.round(ry + center[1]),
      Math.round(rz + center[2]),
    ]
    grid.setBoxel(newPos[0], newPos[1], newPos[2], {
      ...boxel,
      position: newPos,
    })
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/core/rotation.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/core/rotation.ts tests/core/rotation.test.ts
git commit -m "feat: 90° grid rotation around any axis with custom center"
```

---

### Task 9: Style Presets

**Files:**
- Create: `src/lib/presets/styles.ts`

- [ ] **Step 1: Implement all 8 style presets**

```typescript
import type { BoxelStyle } from '../types'

export const presets = {
  heerich(_w: number, _h: number, _d: number): BoxelStyle {
    return {
      default: (_x, y, _z) => {
        const base = 0.75 + y * 0.02
        return {
          fill: `oklch(${base} 0.03 80)`,
          stroke: `oklch(${base - 0.15} 0.03 80)`,
        }
      },
      top: { fill: `oklch(0.85 0.02 80)`, stroke: `oklch(0.65 0.03 80)` },
    }
  },

  rubik(w: number, h: number, d: number): BoxelStyle {
    const colors: Record<string, string> = {
      top: '#ffff00',
      bottom: '#ffffff',
      front: '#ff0000',
      back: '#ff8c00',
      left: '#00ff00',
      right: '#0000ff',
    }
    return {
      default: { fill: '#111', stroke: '#000' },
      top: { fill: colors.top, stroke: '#333' },
      bottom: { fill: colors.bottom, stroke: '#333' },
      front: { fill: colors.front, stroke: '#333' },
      back: { fill: colors.back, stroke: '#333' },
      left: { fill: colors.left, stroke: '#333' },
      right: { fill: colors.right, stroke: '#333' },
    }
  },

  gradient(w: number, h: number, d: number): BoxelStyle {
    return {
      default: (x, y, z) => {
        const hue = (x / Math.max(w, 1)) * 360
        const lightness = 0.4 + (y / Math.max(h, 1)) * 0.4
        const chroma = 0.1 + (z / Math.max(d, 1)) * 0.1
        return {
          fill: `oklch(${lightness} ${chroma} ${hue})`,
          stroke: `oklch(${lightness - 0.1} ${chroma} ${hue})`,
        }
      },
    }
  },

  wireframe(_w: number, _h: number, _d: number): BoxelStyle {
    return {
      default: {
        fill: 'transparent',
        stroke: '#666',
        opacity: 1,
      },
    }
  },

  xray(w: number, h: number, d: number): BoxelStyle {
    const cx = w / 2
    const cy = h / 2
    const cz = d / 2
    const maxDist = Math.sqrt(cx * cx + cy * cy + cz * cz)
    return {
      default: (x, y, z) => {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2)
        const opacity = 0.1 + (dist / Math.max(maxDist, 1)) * 0.6
        return {
          fill: `oklch(0.7 0.12 220)`,
          stroke: `oklch(0.5 0.12 220)`,
          opacity,
        }
      },
    }
  },

  glass(_w: number, _h: number, _d: number): BoxelStyle {
    return {
      default: {
        fill: 'rgba(200, 220, 240, 0.15)',
        stroke: 'rgba(100, 140, 180, 0.4)',
        opacity: 0.8,
        backdropFilter: 'blur(4px)',
      },
    }
  },

  marble(_w: number, _h: number, _d: number): BoxelStyle {
    return {
      default: (x, y, z) => {
        // Pseudo-random veining based on position
        const noise = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453
        const vein = (noise - Math.floor(noise)) * 0.08
        const lightness = 0.88 + vein
        return {
          fill: `oklch(${lightness} 0.005 90)`,
          stroke: `oklch(${lightness - 0.12} 0.01 90)`,
        }
      },
    }
  },

  neon(_w: number, _h: number, _d: number): BoxelStyle {
    return {
      default: {
        fill: 'rgba(10, 10, 15, 0.9)',
        stroke: '#0ff',
        opacity: 1,
      },
    }
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/presets/styles.ts
git commit -m "feat: 8 built-in style presets — heerich, rubik, gradient, wireframe, xray, glass, marble, neon"
```

---

### Task 10: Renderer Interface + Boxel Element Builder

**Files:**
- Create: `src/lib/renderers/renderer.ts`
- Create: `src/lib/renderers/dom/boxel-element.ts`
- Create: `src/lib/renderers/dom/edge-borders.ts`

- [ ] **Step 1: Create renderer.ts** (the type is already in types.ts — this re-exports it for clarity)

```typescript
export type { BoxelRenderer, RenderOptions } from '../types'
```

- [ ] **Step 2: Create edge-borders.ts**

```typescript
import type { EdgeVisibility } from '../../types'

export function applyEdgeBorders(
  faceEl: HTMLElement,
  edges: EdgeVisibility,
  edgeWidth: number,
  edgeColor: string,
): void {
  faceEl.style.borderStyle = 'solid'

  faceEl.style.borderLeftWidth = edges.left ? `${edgeWidth}px` : '0'
  faceEl.style.borderRightWidth = edges.right ? `${edgeWidth}px` : '0'
  faceEl.style.borderTopWidth = edges.top ? `${edgeWidth}px` : '0'
  faceEl.style.borderBottomWidth = edges.bottom ? `${edgeWidth}px` : '0'

  faceEl.style.borderLeftColor = edges.left ? edgeColor : 'transparent'
  faceEl.style.borderRightColor = edges.right ? edgeColor : 'transparent'
  faceEl.style.borderTopColor = edges.top ? edgeColor : 'transparent'
  faceEl.style.borderBottomColor = edges.bottom ? edgeColor : 'transparent'
}
```

- [ ] **Step 3: Create boxel-element.ts**

```typescript
import type { FaceName, ResolvedFaceStyle, EdgeVisibility, Vec3 } from '../../types'
import { applyEdgeBorders } from './edge-borders'

const FACE_TRANSFORMS: Record<FaceName, (size: number) => string> = {
  front:  (s) => `translateZ(${s / 2}px)`,
  back:   (s) => `rotateY(180deg) translateZ(${s / 2}px)`,
  left:   (s) => `rotateY(-90deg) translateZ(${s / 2}px)`,
  right:  (s) => `rotateY(90deg) translateZ(${s / 2}px)`,
  top:    (s) => `rotateX(90deg) translateZ(${s / 2}px)`,
  bottom: (s) => `rotateX(-90deg) translateZ(${s / 2}px)`,
}

export function createFaceElement(
  face: FaceName,
  voxelSize: number,
  style: ResolvedFaceStyle,
  edges: EdgeVisibility,
  edgeWidth: number,
  edgeColor: string,
): HTMLDivElement {
  const el = document.createElement('div')
  el.dataset.face = face
  el.style.position = 'absolute'
  el.style.width = `${voxelSize}px`
  el.style.height = `${voxelSize}px`
  el.style.transform = FACE_TRANSFORMS[face](voxelSize)
  el.style.backfaceVisibility = 'hidden'
  el.style.boxSizing = 'border-box'

  // Apply style
  el.style.backgroundColor = style.fill
  el.style.opacity = String(style.opacity)
  if (style.backdropFilter) {
    el.style.backdropFilter = style.backdropFilter
  }
  if (style.className) {
    el.className = style.className
  }

  // Apply edge borders
  const resolvedColor = style.stroke !== 'transparent' ? style.stroke : edgeColor
  applyEdgeBorders(el, edges, edgeWidth, resolvedColor)

  return el
}

export function createBoxelElement(
  position: Vec3,
  voxelSize: number,
  gap: number,
  faces: Array<{
    name: FaceName
    style: ResolvedFaceStyle
    edges: EdgeVisibility
  }>,
  edgeWidth: number,
  edgeColor: string,
): HTMLDivElement {
  const container = document.createElement('div')
  container.dataset.boxel = `${position[0]},${position[1]},${position[2]}`
  container.style.position = 'absolute'
  container.style.width = `${voxelSize}px`
  container.style.height = `${voxelSize}px`
  container.style.transformStyle = 'preserve-3d'

  const [x, y, z] = position
  const offset = voxelSize + gap
  container.style.transform = `translate3d(${x * offset}px, ${-y * offset}px, ${z * offset}px)`

  for (const face of faces) {
    const faceEl = createFaceElement(face.name, voxelSize, face.style, face.edges, edgeWidth, edgeColor)
    container.appendChild(faceEl)
  }

  return container
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/renderers/renderer.ts src/lib/renderers/dom/boxel-element.ts src/lib/renderers/dom/edge-borders.ts
git commit -m "feat: DOM boxel element builder with face transforms and edge borders"
```

---

### Task 11: Orbit Controls

**Files:**
- Create: `src/lib/renderers/dom/orbit.ts`

- [ ] **Step 1: Implement orbit controls**

```typescript
export interface OrbitState {
  rotX: number
  rotY: number
  scale: number
}

export type OrbitChangeCallback = (state: OrbitState) => void

export class OrbitControls {
  private rotX: number
  private rotY: number
  private scale: number
  private isDragging = false
  private lastPointerX = 0
  private lastPointerY = 0
  private onChange: OrbitChangeCallback
  private container: HTMLElement | null = null

  private boundPointerDown = this.onPointerDown.bind(this)
  private boundPointerMove = this.onPointerMove.bind(this)
  private boundPointerUp = this.onPointerUp.bind(this)
  private boundWheel = this.onWheel.bind(this)

  constructor(
    initialRotation: [number, number] = [-25, 35],
    onChange: OrbitChangeCallback,
  ) {
    this.rotX = initialRotation[0]
    this.rotY = initialRotation[1]
    this.scale = 1
    this.onChange = onChange
  }

  attach(container: HTMLElement): void {
    this.container = container
    container.addEventListener('pointerdown', this.boundPointerDown)
    container.addEventListener('wheel', this.boundWheel, { passive: false })
  }

  detach(): void {
    if (!this.container) return
    this.container.removeEventListener('pointerdown', this.boundPointerDown)
    this.container.removeEventListener('wheel', this.boundWheel)
    document.removeEventListener('pointermove', this.boundPointerMove)
    document.removeEventListener('pointerup', this.boundPointerUp)
    this.container = null
  }

  getState(): OrbitState {
    return { rotX: this.rotX, rotY: this.rotY, scale: this.scale }
  }

  private onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return
    this.isDragging = true
    this.lastPointerX = e.clientX
    this.lastPointerY = e.clientY
    document.addEventListener('pointermove', this.boundPointerMove)
    document.addEventListener('pointerup', this.boundPointerUp)
    e.preventDefault()
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.isDragging) return
    const dx = e.clientX - this.lastPointerX
    const dy = e.clientY - this.lastPointerY
    this.lastPointerX = e.clientX
    this.lastPointerY = e.clientY

    this.rotY += dx * 0.5
    this.rotX -= dy * 0.5
    // Clamp rotX to prevent flipping
    this.rotX = Math.max(-90, Math.min(90, this.rotX))

    this.onChange({ rotX: this.rotX, rotY: this.rotY, scale: this.scale })
  }

  private onPointerUp(): void {
    this.isDragging = false
    document.removeEventListener('pointermove', this.boundPointerMove)
    document.removeEventListener('pointerup', this.boundPointerUp)
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.95 : 1.05
    this.scale = Math.max(0.1, Math.min(5, this.scale * delta))
    this.onChange({ rotX: this.rotX, rotY: this.rotY, scale: this.scale })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/renderers/dom/orbit.ts
git commit -m "feat: orbit controls — pointer drag rotation and scroll zoom"
```

---

### Task 12: DOM Renderer

**Files:**
- Create: `src/lib/renderers/dom/dom-renderer.ts`
- Create: `tests/renderers/dom-renderer.test.ts`

- [ ] **Step 1: Write failing tests for DOMRenderer**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { DOMRenderer } from '../../src/lib/renderers/dom/dom-renderer'
import { BoxelGrid } from '../../src/lib/core/grid'

describe('DOMRenderer', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('mounts a scene container into the target element', () => {
    const renderer = new DOMRenderer({ orbit: false, zoom: false })
    renderer.mount(container)
    expect(container.children.length).toBe(1)
    const scene = container.children[0] as HTMLElement
    expect(scene.style.transformStyle).toBe('preserve-3d')
    renderer.dispose()
  })

  it('renders boxels as div elements with face children', () => {
    const renderer = new DOMRenderer({ orbit: false, zoom: false })
    renderer.mount(container)
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    renderer.render({
      grid,
      voxelSize: 50,
      gap: 0,
      edgeWidth: 1,
      edgeColor: '#333',
    })
    // 1 boxel container with 6 face divs (isolated, all faces exposed)
    const scene = container.querySelector('[data-boxel]')
    expect(scene).not.toBeNull()
    expect(scene!.children.length).toBe(6)
    renderer.dispose()
  })

  it('culls internal faces between adjacent boxels', () => {
    const renderer = new DOMRenderer({ orbit: false, zoom: false })
    renderer.mount(container)
    const grid = new BoxelGrid()
    grid.setBoxel(0, 0, 0, { position: [0, 0, 0], opaque: true })
    grid.setBoxel(1, 0, 0, { position: [1, 0, 0], opaque: true })
    renderer.render({
      grid,
      voxelSize: 50,
      gap: 0,
      edgeWidth: 1,
      edgeColor: '#333',
    })
    const boxels = container.querySelectorAll('[data-boxel]')
    expect(boxels.length).toBe(2)
    // Each should have 5 faces (shared face culled)
    expect(boxels[0].children.length).toBe(5)
    expect(boxels[1].children.length).toBe(5)
    renderer.dispose()
  })

  it('unmounts and cleans up', () => {
    const renderer = new DOMRenderer({ orbit: false, zoom: false })
    renderer.mount(container)
    renderer.unmount()
    expect(container.children.length).toBe(0)
  })

  it('updates rotation transform without rebuild', () => {
    const renderer = new DOMRenderer({ orbit: false, zoom: false })
    renderer.mount(container)
    renderer.updateTransform(-30, 45)
    const world = renderer.getWorldContainer()!
    expect(world.style.transform).toContain('rotateX(-30deg)')
    expect(world.style.transform).toContain('rotateY(45deg)')
    renderer.dispose()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/renderers/dom-renderer.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement DOMRenderer**

```typescript
import type { BoxelRenderer, RenderOptions, BoxelStyle, FaceName, Vec3 } from '../../types'
import { BoxelGrid } from '../../core/grid'
import { getExposedFaces, getEdgeVisibility } from '../../core/edge-fusion'
import { resolveStyle } from '../../core/style'
import { createBoxelElement } from './boxel-element'
import { OrbitControls } from './orbit'

interface DOMRendererOptions {
  orbit?: boolean
  zoom?: boolean
  cameraRotation?: [number, number]
  cameraDistance?: number
}

export class DOMRenderer implements BoxelRenderer {
  private sceneEl: HTMLDivElement | null = null
  private worldEl: HTMLDivElement | null = null
  private containerEl: HTMLElement | null = null
  private orbit: OrbitControls | null = null
  private options: DOMRendererOptions

  constructor(options: DOMRendererOptions = {}) {
    this.options = options
  }

  mount(container: HTMLElement): void {
    this.containerEl = container

    // Scene wrapper — handles perspective
    this.sceneEl = document.createElement('div')
    this.sceneEl.style.width = '100%'
    this.sceneEl.style.height = '100%'
    this.sceneEl.style.perspective = `${this.options.cameraDistance ?? 1200}px`
    this.sceneEl.style.overflow = 'hidden'
    this.sceneEl.style.position = 'relative'

    // World container — rotated by orbit, contains all boxels
    this.worldEl = document.createElement('div')
    this.worldEl.style.position = 'absolute'
    this.worldEl.style.top = '50%'
    this.worldEl.style.left = '50%'
    this.worldEl.style.transformStyle = 'preserve-3d'

    const [rx, ry] = this.options.cameraRotation ?? [-25, 35]
    this.worldEl.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`

    this.sceneEl.style.transformStyle = 'preserve-3d'
    this.sceneEl.appendChild(this.worldEl)
    container.appendChild(this.sceneEl)

    // Set up orbit
    if (this.options.orbit !== false) {
      this.orbit = new OrbitControls(
        this.options.cameraRotation ?? [-25, 35],
        (state) => {
          if (this.worldEl) {
            this.worldEl.style.transform = `rotateX(${state.rotX}deg) rotateY(${state.rotY}deg) scale(${state.scale})`
          }
        },
      )
      this.orbit.attach(this.sceneEl)
    }
  }

  unmount(): void {
    if (this.orbit) {
      this.orbit.detach()
      this.orbit = null
    }
    if (this.sceneEl && this.containerEl) {
      this.containerEl.removeChild(this.sceneEl)
    }
    this.sceneEl = null
    this.worldEl = null
    this.containerEl = null
  }

  render(options: RenderOptions): void {
    if (!this.worldEl) return

    // Clear existing boxels
    this.worldEl.innerHTML = ''

    const { grid, voxelSize, gap, edgeWidth, edgeColor, globalStyle } = options

    grid.forEach((boxel, pos) => {
      const [x, y, z] = pos
      const exposedFaces = getExposedFaces(grid, x, y, z)
      if (exposedFaces.length === 0) return

      const faceData = exposedFaces.map((face) => {
        const edges = gap === 0
          ? getEdgeVisibility(grid, x, y, z, face)
          : { left: true, right: true, top: true, bottom: true }
        const style = resolveStyle(face, x, y, z, boxel.style, globalStyle)
        return { name: face, style, edges }
      })

      const el = createBoxelElement(pos, voxelSize, gap, faceData, edgeWidth, edgeColor)
      this.worldEl!.appendChild(el)
    })
  }

  updateTransform(rotX: number, rotY: number): void {
    if (this.worldEl) {
      this.worldEl.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`
    }
  }

  updateGap(gap: number): void {
    // Gap changes require re-render (position recalculation + possible edge fusion change)
    // The Boxels class handles calling render() after gap change
  }

  updateOpacity(opacity: number): void {
    if (this.worldEl) {
      this.worldEl.style.setProperty('--face-opacity', String(opacity))
    }
  }

  setBoxelTransform(key: string, translate: Vec3, scale?: number, opacity?: number): void {
    if (!this.worldEl) return
    const el = this.worldEl.querySelector(`[data-boxel="${key}"]`) as HTMLElement | null
    if (!el) return
    const current = el.style.transform
    // Append additional transform
    if (translate[0] !== 0 || translate[1] !== 0 || translate[2] !== 0) {
      el.style.transform = current + ` translate3d(${translate[0]}px, ${-translate[1]}px, ${translate[2]}px)`
    }
    if (scale !== undefined) {
      el.style.transform += ` scale(${scale})`
    }
    if (opacity !== undefined) {
      el.style.opacity = String(opacity)
    }
  }

  getWorldContainer(): HTMLElement | null {
    return this.worldEl
  }

  dispose(): void {
    this.unmount()
  }
}
```

- [ ] **Step 4: Add vitest config for happy-dom**

Create `vitest.config.ts` in project root:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
  },
})
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/renderers/dom-renderer.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/renderers/dom/dom-renderer.ts tests/renderers/dom-renderer.test.ts vitest.config.ts
git commit -m "feat: DOM renderer — CSS 3D preserve-3d rendering with face culling and edge fusion"
```

---

### Task 13: Animator

**Files:**
- Create: `src/lib/animation/animator.ts`
- Create: `tests/animation/animator.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { Animator, type AnimationHandle } from '../../src/lib/animation/animator'

describe('Animator', () => {
  it('calls tick callback with progress 0 to 1', () => {
    const animator = new Animator()
    const ticks: number[] = []

    // Mock requestAnimationFrame
    let rafCallback: ((time: number) => void) | null = null
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb
      return 1
    })
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {})

    animator.add({
      duration: 100,
      tick: (t) => { ticks.push(t) },
    })

    // Simulate frames
    rafCallback!(0)    // start
    rafCallback!(50)   // midpoint
    rafCallback!(100)  // end

    expect(ticks.length).toBeGreaterThanOrEqual(2)
    expect(ticks[ticks.length - 1]).toBe(1) // final tick is always 1

    vi.restoreAllMocks()
  })

  it('supports cancel', () => {
    const animator = new Animator()
    const ticks: number[] = []

    let rafCallback: ((time: number) => void) | null = null
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb
      return 1
    })
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {})

    const handle = animator.add({
      duration: 1000,
      tick: (t) => { ticks.push(t) },
    })

    rafCallback!(0)
    handle.cancel()
    rafCallback!(500)

    // Should have stopped after cancel
    expect(ticks.length).toBe(1)

    vi.restoreAllMocks()
  })

  it('calls onComplete when animation finishes', () => {
    const animator = new Animator()
    let completed = false

    let rafCallback: ((time: number) => void) | null = null
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb
      return 1
    })
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {})

    animator.add({
      duration: 100,
      tick: () => {},
      onComplete: () => { completed = true },
    })

    rafCallback!(0)
    rafCallback!(200) // past duration

    expect(completed).toBe(true)

    vi.restoreAllMocks()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/animation/animator.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement Animator**

```typescript
export interface AnimationConfig {
  duration: number
  tick: (t: number) => void
  onComplete?: () => void
  easing?: (t: number) => number
  loop?: boolean
}

export interface AnimationHandle {
  cancel: () => void
  readonly done: boolean
}

// Built-in easing functions
export const easings = {
  linear: (t: number) => t,
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2,
  easeOut: (t: number) => 1 - (1 - t) ** 3,
  easeIn: (t: number) => t * t * t,
  bounce: (t: number) => {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) return n1 * t * t
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  },
}

export function parseCubicBezier(str: string): ((t: number) => number) | null {
  const match = str.match(/cubic-bezier\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/)
  if (!match) return null
  const [, x1s, y1s, x2s, y2s] = match
  const x1 = parseFloat(x1s), y1 = parseFloat(y1s)
  const x2 = parseFloat(x2s), y2 = parseFloat(y2s)
  // Simple cubic bezier approximation
  return (t: number) => {
    const ct = 1 - t
    const b1 = 3 * ct * ct * t
    const b2 = 3 * ct * t * t
    const b3 = t * t * t
    return b1 * y1 + b2 * y2 + b3
  }
}

interface ActiveAnimation {
  config: AnimationConfig
  startTime: number | null
  cancelled: boolean
}

export class Animator {
  private animations: ActiveAnimation[] = []
  private rafId: number | null = null

  add(config: AnimationConfig): AnimationHandle {
    const anim: ActiveAnimation = {
      config,
      startTime: null,
      cancelled: false,
    }
    this.animations.push(anim)
    this.start()

    return {
      cancel: () => {
        anim.cancelled = true
      },
      get done() {
        return anim.cancelled || anim.startTime !== null
      },
    }
  }

  cancelAll(): void {
    for (const anim of this.animations) {
      anim.cancelled = true
    }
    this.animations = []
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private start(): void {
    if (this.rafId !== null) return
    this.rafId = requestAnimationFrame(this.tick)
  }

  private tick = (time: number): void => {
    const toRemove: number[] = []

    for (let i = 0; i < this.animations.length; i++) {
      const anim = this.animations[i]
      if (anim.cancelled) {
        toRemove.push(i)
        continue
      }

      if (anim.startTime === null) {
        anim.startTime = time
      }

      const elapsed = time - anim.startTime
      const duration = anim.config.duration
      let rawT = Math.min(elapsed / duration, 1)

      if (anim.config.loop && rawT >= 1) {
        anim.startTime = time
        rawT = 0
      }

      const easing = anim.config.easing ?? easings.linear
      const t = easing(rawT)
      anim.config.tick(t)

      if (rawT >= 1 && !anim.config.loop) {
        anim.config.tick(1) // ensure final frame
        anim.config.onComplete?.()
        toRemove.push(i)
      }
    }

    // Remove completed/cancelled in reverse order
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.animations.splice(toRemove[i], 1)
    }

    if (this.animations.length > 0) {
      this.rafId = requestAnimationFrame(this.tick)
    } else {
      this.rafId = null
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/animation/animator.test.ts`
Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/animation/animator.ts tests/animation/animator.test.ts
git commit -m "feat: animator — RAF loop with easing, cancel, and completion callbacks"
```

---

### Task 14: Explode / Collapse Animation

**Files:**
- Create: `src/lib/animation/explode.ts`
- Create: `tests/animation/explode.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest'
import { computeExplodeOffsets } from '../../src/lib/animation/explode'
import type { Vec3 } from '../../src/lib/types'

describe('computeExplodeOffsets', () => {
  it('computes offset directions from center', () => {
    const positions: Vec3[] = [[0, 0, 0], [2, 0, 0], [0, 2, 0]]
    const center: Vec3 = [1, 1, 0]
    const offsets = computeExplodeOffsets(positions, center, 2.0)

    // Each position should have an offset away from center
    expect(offsets).toHaveLength(3)
    // Position [0,0,0] is at [-1,-1,0] from center, offset should point that way
    expect(offsets[0][0]).toBeLessThan(0) // x offset negative
    expect(offsets[0][1]).toBeLessThan(0) // y offset negative
  })

  it('returns zero offset for boxel at center', () => {
    const positions: Vec3[] = [[5, 5, 5]]
    const center: Vec3 = [5, 5, 5]
    const offsets = computeExplodeOffsets(positions, center, 2.0)
    expect(offsets[0]).toEqual([0, 0, 0])
  })

  it('scales offsets by factor', () => {
    const positions: Vec3[] = [[2, 0, 0]]
    const center: Vec3 = [0, 0, 0]
    const offsets1 = computeExplodeOffsets(positions, center, 1.0)
    const offsets2 = computeExplodeOffsets(positions, center, 3.0)
    expect(Math.abs(offsets2[0][0])).toBeGreaterThan(Math.abs(offsets1[0][0]))
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/animation/explode.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement explode**

```typescript
import type { Vec3 } from '../types'
import type { BoxelGrid } from '../core/grid'
import type { Animator, AnimationHandle } from './animator'
import type { BoxelRenderer } from '../types'
import { easings, parseCubicBezier } from './animator'

export function computeExplodeOffsets(
  positions: Vec3[],
  center: Vec3,
  factor: number,
): Vec3[] {
  return positions.map(([x, y, z]) => {
    const dx = x - center[0]
    const dy = y - center[1]
    const dz = z - center[2]
    return [dx * factor, dy * factor, dz * factor] as Vec3
  })
}

export function createExplodeAnimation(
  grid: BoxelGrid,
  renderer: BoxelRenderer,
  animator: Animator,
  voxelSize: number,
  options: {
    factor?: number
    stagger?: number
    easing?: string
    duration?: number
  } = {},
): AnimationHandle {
  const factor = options.factor ?? 2.0
  const duration = options.duration ?? 800

  const positions: Vec3[] = []
  grid.forEach((_boxel, pos) => positions.push(pos))

  const bounds = grid.getBounds()
  const center: Vec3 = [
    (bounds.min[0] + bounds.max[0]) / 2,
    (bounds.min[1] + bounds.max[1]) / 2,
    (bounds.min[2] + bounds.max[2]) / 2,
  ]

  const offsets = computeExplodeOffsets(positions, center, factor)

  let easingFn = easings.easeOut
  if (options.easing) {
    const parsed = parseCubicBezier(options.easing)
    if (parsed) easingFn = parsed
  }

  return animator.add({
    duration,
    easing: easingFn,
    tick: (t) => {
      for (let i = 0; i < positions.length; i++) {
        const [ox, oy, oz] = offsets[i]
        const key = `${positions[i][0]},${positions[i][1]},${positions[i][2]}`
        renderer.setBoxelTransform(
          key,
          [ox * t * voxelSize, oy * t * voxelSize, oz * t * voxelSize],
        )
      }
    },
  })
}

export function createCollapseAnimation(
  grid: BoxelGrid,
  renderer: BoxelRenderer,
  animator: Animator,
  voxelSize: number,
  options: {
    duration?: number
    easing?: string
  } = {},
): AnimationHandle {
  const duration = options.duration ?? 800

  // Collapse re-renders the grid at default positions
  return animator.add({
    duration,
    easing: easings.easeOut,
    tick: (_t) => {
      // Collapse is handled by re-rendering at gap=0
    },
    onComplete: () => {
      // Force re-render to snap positions
    },
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/animation/explode.test.ts`
Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/animation/explode.ts tests/animation/explode.test.ts
git commit -m "feat: explode/collapse animation with configurable factor and easing"
```

---

### Task 15: Tweens (Gap, Opacity, Per-Boxel)

**Files:**
- Create: `src/lib/animation/tweens.ts`

- [ ] **Step 1: Implement tweens**

```typescript
import type { Boxel, Vec3, AnimateEachCallback, AnimateEachOptions, TweenOptions } from '../types'
import type { BoxelGrid } from '../core/grid'
import type { Animator, AnimationHandle } from './animator'
import type { BoxelRenderer } from '../types'
import { easings, parseCubicBezier } from './animator'

function resolveEasing(easingStr?: string): (t: number) => number {
  if (!easingStr) return easings.easeInOut
  if (easingStr in easings) return easings[easingStr as keyof typeof easings]
  const parsed = parseCubicBezier(easingStr)
  return parsed ?? easings.easeInOut
}

export function createGapTween(
  animator: Animator,
  onGapChange: (gap: number) => void,
  options: TweenOptions,
): AnimationHandle {
  const { from, to, duration = 600 } = options
  const easingFn = resolveEasing(options.easing)
  return animator.add({
    duration,
    easing: easingFn,
    tick: (t) => {
      const gap = from + (to - from) * t
      onGapChange(gap)
    },
  })
}

export function createOpacityTween(
  animator: Animator,
  renderer: BoxelRenderer,
  options: TweenOptions,
): AnimationHandle {
  const { from, to, duration = 600 } = options
  const easingFn = resolveEasing(options.easing)
  return animator.add({
    duration,
    easing: easingFn,
    tick: (t) => {
      const opacity = from + (to - from) * t
      renderer.updateOpacity(opacity)
    },
  })
}

export function createEachTween(
  grid: BoxelGrid,
  renderer: BoxelRenderer,
  animator: Animator,
  voxelSize: number,
  callback: AnimateEachCallback,
  options: AnimateEachOptions = {},
): AnimationHandle {
  const { duration = 2000, loop = false } = options
  const easingFn = resolveEasing(options.easing)

  return animator.add({
    duration,
    easing: easingFn,
    loop,
    tick: (t) => {
      grid.forEach((boxel, pos) => {
        const result = callback(boxel, pos, t)
        const key = `${pos[0]},${pos[1]},${pos[2]}`
        renderer.setBoxelTransform(
          key,
          result.translate ?? [0, 0, 0],
          result.scale,
          result.opacity,
        )
      })
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/animation/tweens.ts
git commit -m "feat: gap, opacity, and per-boxel tween animations"
```

---

### Task 16: Layer Rotation

**Files:**
- Create: `src/lib/animation/layer-rotate.ts`

- [ ] **Step 1: Implement layer rotation animation**

```typescript
import type { Vec3, LayerRotateOptions } from '../types'
import type { BoxelGrid } from '../core/grid'
import type { Animator, AnimationHandle } from './animator'
import type { BoxelRenderer } from '../types'
import { easings } from './animator'
import { rotateGrid } from '../core/rotation'

export function createLayerRotateAnimation(
  grid: BoxelGrid,
  renderer: BoxelRenderer,
  animator: Animator,
  options: LayerRotateOptions,
  onComplete: () => void,
): AnimationHandle {
  const { axis, layer, direction, duration = 350 } = options
  const worldContainer = renderer.getWorldContainer()
  if (!worldContainer) {
    return { cancel: () => {}, done: true }
  }

  // Find all boxels in this layer
  const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
  const layerBoxels: Vec3[] = []
  grid.forEach((_boxel, pos) => {
    if (pos[axisIndex] === layer) {
      layerBoxels.push(pos)
    }
  })

  if (layerBoxels.length === 0) {
    return { cancel: () => {}, done: true }
  }

  // Create a temporary wrapper div for the layer
  const wrapper = document.createElement('div')
  wrapper.style.position = 'absolute'
  wrapper.style.transformStyle = 'preserve-3d'
  worldContainer.appendChild(wrapper)

  // Reparent layer boxel elements into wrapper
  const elements: HTMLElement[] = []
  for (const pos of layerBoxels) {
    const key = `${pos[0]},${pos[1]},${pos[2]}`
    const el = worldContainer.querySelector(`[data-boxel="${key}"]`) as HTMLElement | null
    if (el) {
      elements.push(el)
      wrapper.appendChild(el)
    }
  }

  const rotateAxis = axis === 'x' ? 'rotateX' : axis === 'y' ? 'rotateY' : 'rotateZ'
  const targetAngle = direction * 90

  return animator.add({
    duration,
    easing: easings.easeInOut,
    tick: (t) => {
      wrapper.style.transform = `${rotateAxis}(${targetAngle * t}deg)`
    },
    onComplete: () => {
      // Move elements back to world container
      for (const el of elements) {
        worldContainer.appendChild(el)
      }
      wrapper.remove()

      // Update grid positions: rotate the layer in the data model
      // Create a temporary grid with just this layer, rotate it, merge back
      const tempGrid = new BoxelGrid()
      for (const pos of layerBoxels) {
        const boxel = grid.getBoxel(pos[0], pos[1], pos[2])
        if (boxel) {
          tempGrid.setBoxel(pos[0], pos[1], pos[2], boxel)
          grid.setBoxel(pos[0], pos[1], pos[2], null)
        }
      }
      rotateGrid(tempGrid, axis, direction)
      tempGrid.forEach((boxel, pos) => {
        grid.setBoxel(pos[0], pos[1], pos[2], boxel)
      })

      onComplete()
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/animation/layer-rotate.ts
git commit -m "feat: Rubik's-style layer rotation animation with DOM reparenting"
```

---

### Task 17: Image Mapper

**Files:**
- Create: `src/lib/core/image-mapper.ts`

- [ ] **Step 1: Implement image mapper**

```typescript
import type { FaceName, Vec3 } from '../types'
import type { BoxelGrid } from './grid'
import { getExposedFaces } from './edge-fusion'

interface ImageMapResult {
  position: Vec3
  face: FaceName
  backgroundImage: string
  backgroundPosition: string
  backgroundSize: string
}

export function mapImageToFaces(
  grid: BoxelGrid,
  img: HTMLImageElement | HTMLCanvasElement,
  layout: 'cross' | 'strip' | 'per-face',
  faces?: Partial<Record<FaceName, HTMLImageElement | HTMLCanvasElement>>,
): ImageMapResult[] {
  const results: ImageMapResult[] = []
  const bounds = grid.getBounds()
  const w = bounds.max[0] - bounds.min[0] + 1
  const h = bounds.max[1] - bounds.min[1] + 1
  const d = bounds.max[2] - bounds.min[2] + 1

  grid.forEach((_boxel, pos) => {
    const [x, y, z] = pos
    const exposed = getExposedFaces(grid, x, y, z)

    for (const face of exposed) {
      let faceImg: HTMLImageElement | HTMLCanvasElement = img
      let uvX = 0, uvY = 0, uvW = 1, uvH = 1

      if (layout === 'per-face' && faces?.[face]) {
        faceImg = faces[face]!
        // For per-face, map based on position within the face's 2D plane
        const { u, v, gridW, gridH } = getFaceUV(face, x, y, z, bounds.min, w, h, d)
        uvX = u / gridW
        uvY = v / gridH
        uvW = gridW
        uvH = gridH
      } else if (layout === 'cross') {
        // Standard cube cross layout (4 cols × 3 rows):
        //       [top]
        // [left][front][right][back]
        //       [bottom]
        const facePos = CROSS_LAYOUT[face]
        const { u, v, gridW, gridH } = getFaceUV(face, x, y, z, bounds.min, w, h, d)
        const cellW = 1 / 4
        const cellH = 1 / 3
        uvX = (facePos.col + u / gridW) * cellW
        uvY = (facePos.row + v / gridH) * cellH
        uvW = 1 / cellW / gridW
        uvH = 1 / cellH / gridH
      } else if (layout === 'strip') {
        // 6 faces in horizontal strip
        const faceIndex = STRIP_ORDER.indexOf(face)
        const { u, v, gridW, gridH } = getFaceUV(face, x, y, z, bounds.min, w, h, d)
        uvX = (faceIndex + u / gridW) / 6
        uvY = v / gridH
        uvW = 6 * gridW
        uvH = gridH
      }

      const src = faceImg instanceof HTMLCanvasElement
        ? faceImg.toDataURL()
        : faceImg.src

      results.push({
        position: pos,
        face,
        backgroundImage: `url(${src})`,
        backgroundPosition: `${-uvX * 100}% ${-uvY * 100}%`,
        backgroundSize: `${uvW * 100}% ${uvH * 100}%`,
      })
    }
  })

  return results
}

const CROSS_LAYOUT: Record<FaceName, { row: number; col: number }> = {
  top:    { row: 0, col: 1 },
  left:   { row: 1, col: 0 },
  front:  { row: 1, col: 1 },
  right:  { row: 1, col: 2 },
  back:   { row: 1, col: 3 },
  bottom: { row: 2, col: 1 },
}

const STRIP_ORDER: FaceName[] = ['front', 'back', 'left', 'right', 'top', 'bottom']

function getFaceUV(
  face: FaceName,
  x: number, y: number, z: number,
  min: Vec3,
  w: number, h: number, d: number,
): { u: number; v: number; gridW: number; gridH: number } {
  const rx = x - min[0]
  const ry = y - min[1]
  const rz = z - min[2]

  switch (face) {
    case 'front':  return { u: rx, v: h - 1 - ry, gridW: w, gridH: h }
    case 'back':   return { u: w - 1 - rx, v: h - 1 - ry, gridW: w, gridH: h }
    case 'left':   return { u: rz, v: h - 1 - ry, gridW: d, gridH: h }
    case 'right':  return { u: d - 1 - rz, v: h - 1 - ry, gridW: d, gridH: h }
    case 'top':    return { u: rx, v: rz, gridW: w, gridH: d }
    case 'bottom': return { u: rx, v: d - 1 - rz, gridW: w, gridH: d }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/core/image-mapper.ts
git commit -m "feat: image mapper — cross, strip, and per-face image slicing for boxel faces"
```

---

### Task 18: Boxels Public API Class

**Files:**
- Create: `src/lib/index.ts`

- [ ] **Step 1: Implement the Boxels facade class**

```typescript
import type {
  BoxelsOptions, BoxelStyle, BoxelEvent, BoxelEventType, Vec3,
  AddBoxOptions, AddSphereOptions, AddLineOptions,
  RemoveBoxOptions, RemoveSphereOptions, StyleBoxOptions,
  RotateOptions, ExplodeOptions, LayerRotateOptions, TweenOptions,
  AnimateEachCallback, AnimateEachOptions, ImageMapOptions,
  Boxel, FaceName, BoxelRenderer,
} from './types'
import { BoxelGrid } from './core/grid'
import { applyBoolean } from './core/boolean'
import { generateBox, generateSphere, generateLine } from './core/geometry'
import { resolveStyle } from './core/style'
import { rotateGrid } from './core/rotation'
import { DOMRenderer } from './renderers/dom/dom-renderer'
import { Animator } from './animation/animator'
import { createExplodeAnimation } from './animation/explode'
import { createLayerRotateAnimation } from './animation/layer-rotate'
import { createGapTween, createOpacityTween, createEachTween } from './animation/tweens'
import { presets } from './presets/styles'

export type { BoxelStyle, BoxelEvent, Boxel, FaceName, Vec3 }

type EventCallback = (event: BoxelEvent | Event) => void

export class Boxels {
  static presets = presets

  private grid: BoxelGrid
  private renderer: BoxelRenderer
  private animator: Animator
  private options: Required<Pick<BoxelsOptions, 'voxelSize' | 'gap' | 'edgeWidth' | 'edgeColor'>>
  private globalStyle?: BoxelStyle
  private listeners: Map<BoxelEventType, Set<EventCallback>> = new Map()
  private mounted = false

  constructor(options: BoxelsOptions = {}) {
    this.grid = new BoxelGrid()
    this.animator = new Animator()
    this.options = {
      voxelSize: options.voxelSize ?? 50,
      gap: options.gap ?? 0,
      edgeWidth: options.edgeWidth ?? 1,
      edgeColor: options.edgeColor ?? '#333',
    }
    this.globalStyle = options.style

    this.renderer = new DOMRenderer({
      orbit: options.orbit ?? true,
      zoom: options.zoom ?? true,
      cameraRotation: options.camera?.rotation,
      cameraDistance: options.camera?.distance,
    })

    if (options.container) {
      this.mount(options.container)
    }
  }

  // ── Lifecycle ──

  mount(container: HTMLElement): void {
    this.renderer.mount(container)
    this.mounted = true
    this.renderScene()
  }

  unmount(): void {
    this.animator.cancelAll()
    this.renderer.unmount()
    this.mounted = false
  }

  // ── Manipulation ──

  addBox(opts: AddBoxOptions): void {
    const positions = generateBox(opts.position, opts.size)
    applyBoolean(this.grid, positions, opts.mode ?? 'union', opts.style)
    this.renderScene()
  }

  removeBox(opts: RemoveBoxOptions): void {
    const positions = generateBox(opts.position, opts.size)
    applyBoolean(this.grid, positions, 'subtract')
    this.renderScene()
  }

  addSphere(opts: AddSphereOptions): void {
    const positions = generateSphere(opts.center, opts.radius)
    applyBoolean(this.grid, positions, opts.mode ?? 'union', opts.style)
    this.renderScene()
  }

  removeSphere(opts: RemoveSphereOptions): void {
    const positions = generateSphere(opts.center, opts.radius)
    applyBoolean(this.grid, positions, 'subtract')
    this.renderScene()
  }

  addLine(opts: AddLineOptions): void {
    const positions = generateLine(opts.from, opts.to, opts.radius)
    applyBoolean(this.grid, positions, opts.mode ?? 'union', opts.style)
    this.renderScene()
  }

  setBoxel(position: Vec3, value: boolean): void {
    const [x, y, z] = position
    if (value) {
      this.grid.setBoxel(x, y, z, { position, opaque: true })
    } else {
      this.grid.setBoxel(x, y, z, null)
    }
    this.renderScene()
  }

  hasBoxel(position: Vec3): boolean {
    return this.grid.hasBoxel(position[0], position[1], position[2])
  }

  getBoxel(position: Vec3): Boxel | null {
    return this.grid.getBoxel(position[0], position[1], position[2])
  }

  clear(): void {
    this.grid.clear()
    this.renderScene()
  }

  // ── Rotation ──

  rotate(opts: RotateOptions): void {
    rotateGrid(this.grid, opts.axis, opts.turns, opts.center)
    this.renderScene()
  }

  // ── Iteration ──

  forEach(fn: (boxel: Boxel, position: Vec3) => void): void {
    this.grid.forEach(fn)
  }

  getNeighbors(position: Vec3): Record<FaceName, Boxel | null> {
    return this.grid.getNeighbors(position[0], position[1], position[2])
  }

  getExposure(position: Vec3): number {
    return this.grid.getExposure(position[0], position[1], position[2])
  }

  // ── Styling ──

  styleBox(opts: StyleBoxOptions): void {
    const positions = generateBox(opts.position, opts.size)
    for (const [x, y, z] of positions) {
      const existing = this.grid.getBoxel(x, y, z)
      if (existing) {
        this.grid.setBoxel(x, y, z, { ...existing, style: opts.style })
      }
    }
    this.renderScene()
  }

  // ── Image mapping ──

  mapImage(opts: ImageMapOptions): void {
    const loadAndApply = (img: HTMLImageElement | HTMLCanvasElement) => {
      const { mapImageToFaces } = require('./core/image-mapper')
      const results = mapImageToFaces(this.grid, img, opts.layout, opts.faces)
      const world = this.renderer.getWorldContainer()
      if (!world) return
      for (const result of results) {
        const key = `${result.position[0]},${result.position[1]},${result.position[2]}`
        const faceEl = world.querySelector(
          `[data-boxel="${key}"] [data-face="${result.face}"]`,
        ) as HTMLElement | null
        if (faceEl) {
          faceEl.style.backgroundImage = result.backgroundImage
          faceEl.style.backgroundPosition = result.backgroundPosition
          faceEl.style.backgroundSize = result.backgroundSize
        }
      }
    }

    if (typeof opts.src === 'string') {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => loadAndApply(img)
      img.src = opts.src
    } else {
      loadAndApply(opts.src)
    }
  }

  // ── Animation ──

  explode(opts: ExplodeOptions = {}): void {
    createExplodeAnimation(
      this.grid, this.renderer, this.animator,
      this.options.voxelSize, opts,
    )
  }

  collapse(): void {
    this.renderScene()
  }

  rotateLayer(opts: LayerRotateOptions): void {
    createLayerRotateAnimation(
      this.grid, this.renderer, this.animator, opts,
      () => this.renderScene(),
    )
  }

  animateGap(opts: TweenOptions): void {
    createGapTween(this.animator, (gap) => {
      this.options.gap = gap
      this.renderScene()
    }, opts)
  }

  animateOpacity(opts: TweenOptions): void {
    createOpacityTween(this.animator, this.renderer, opts)
  }

  animateEach(callback: AnimateEachCallback, opts?: AnimateEachOptions): void {
    createEachTween(
      this.grid, this.renderer, this.animator,
      this.options.voxelSize, callback, opts,
    )
  }

  // ── Events ──

  on(event: BoxelEventType, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: BoxelEventType, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback)
  }

  // ── Private ──

  private renderScene(): void {
    if (!this.mounted) return
    this.renderer.render({
      grid: this.grid,
      voxelSize: this.options.voxelSize,
      gap: this.options.gap,
      edgeWidth: this.options.edgeWidth,
      edgeColor: this.options.edgeColor,
      globalStyle: this.globalStyle,
    })
    this.setupFaceEvents()
    this.emit('render', new Event('render'))
  }

  private setupFaceEvents(): void {
    const world = this.renderer.getWorldContainer()
    if (!world) return

    world.addEventListener('click', (e) => {
      const faceEl = (e.target as HTMLElement).closest('[data-face]') as HTMLElement | null
      if (!faceEl) return
      const boxelEl = faceEl.closest('[data-boxel]') as HTMLElement | null
      if (!boxelEl) return
      const pos = boxelEl.dataset.boxel!.split(',').map(Number) as Vec3
      const face = faceEl.dataset.face as FaceName
      const boxel = this.grid.getBoxel(pos[0], pos[1], pos[2])
      if (boxel) {
        this.emit('boxel:click', { boxel, position: pos, face, originalEvent: e })
      }
    })

    world.addEventListener('pointerover', (e) => {
      const faceEl = (e.target as HTMLElement).closest('[data-face]') as HTMLElement | null
      if (!faceEl) return
      const boxelEl = faceEl.closest('[data-boxel]') as HTMLElement | null
      if (!boxelEl) return
      const pos = boxelEl.dataset.boxel!.split(',').map(Number) as Vec3
      const face = faceEl.dataset.face as FaceName
      const boxel = this.grid.getBoxel(pos[0], pos[1], pos[2])
      if (boxel) {
        this.emit('boxel:hover', { boxel, position: pos, face, originalEvent: e })
      }
    })

    world.addEventListener('pointerdown', (e) => {
      const faceEl = (e.target as HTMLElement).closest('[data-face]') as HTMLElement | null
      if (!faceEl) return
      const boxelEl = faceEl.closest('[data-boxel]') as HTMLElement | null
      if (!boxelEl) return
      const pos = boxelEl.dataset.boxel!.split(',').map(Number) as Vec3
      const face = faceEl.dataset.face as FaceName
      const boxel = this.grid.getBoxel(pos[0], pos[1], pos[2])
      if (boxel) {
        this.emit('boxel:pointerdown', { boxel, position: pos, face, originalEvent: e })
      }
    })
  }

  private emit(event: BoxelEventType, data: BoxelEvent | Event): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      for (const cb of callbacks) {
        cb(data)
      }
    }
  }
}
```

- [ ] **Step 2: Verify the library compiles**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/index.ts
git commit -m "feat: Boxels public API — facade class with full manipulation, styling, animation, and events"
```

---

### Task 19: Fix mapImage Dynamic Import

The `mapImage` method in `index.ts` uses `require()` which won't work in ESM. Fix it to use a static import.

**Files:**
- Modify: `src/lib/index.ts`

- [ ] **Step 1: Replace require with static import**

At the top of `src/lib/index.ts`, add the import:

```typescript
import { mapImageToFaces } from './core/image-mapper'
```

Then in the `mapImage` method, remove the `require` line and use the imported function directly:

```typescript
  mapImage(opts: ImageMapOptions): void {
    const loadAndApply = (img: HTMLImageElement | HTMLCanvasElement) => {
      const results = mapImageToFaces(this.grid, img, opts.layout, opts.faces)
      const world = this.renderer.getWorldContainer()
      if (!world) return
      for (const result of results) {
        const key = `${result.position[0]},${result.position[1]},${result.position[2]}`
        const faceEl = world.querySelector(
          `[data-boxel="${key}"] [data-face="${result.face}"]`,
        ) as HTMLElement | null
        if (faceEl) {
          faceEl.style.backgroundImage = result.backgroundImage
          faceEl.style.backgroundPosition = result.backgroundPosition
          faceEl.style.backgroundSize = result.backgroundSize
        }
      }
    }

    if (typeof opts.src === 'string') {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => loadAndApply(img)
      img.src = opts.src
    } else {
      loadAndApply(opts.src)
    }
  }
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/index.ts
git commit -m "fix: replace require() with static import for image-mapper"
```

---

### Task 20: React Wrapper

**Files:**
- Create: `src/react/Boxels.tsx`

- [ ] **Step 1: Implement React wrapper component**

```tsx
import { useRef, useEffect, type CSSProperties } from 'react'
import {
  Boxels as BoxelsCore,
  type BoxelsOptions,
  type BoxelStyle,
  type BoxelEvent,
  type AddBoxOptions,
  type AddSphereOptions,
  type AddLineOptions,
  type ExplodeOptions,
  type LayerRotateOptions,
  type TweenOptions,
  type AnimateEachCallback,
  type AnimateEachOptions,
  type ImageMapOptions,
} from '../lib/index'

export interface BoxelsProps {
  boxes?: AddBoxOptions[]
  spheres?: AddSphereOptions[]
  lines?: AddLineOptions[]
  style?: BoxelStyle
  gap?: number
  voxelSize?: number
  edgeWidth?: number
  edgeColor?: string
  camera?: BoxelsOptions['camera']
  orbit?: boolean
  zoom?: boolean
  onBoxelClick?: (e: BoxelEvent) => void
  onBoxelHover?: (e: BoxelEvent) => void
  onBoxelPointerDown?: (e: BoxelEvent) => void
  className?: string
  containerStyle?: CSSProperties
}

export function Boxels({
  boxes = [],
  spheres = [],
  lines = [],
  style,
  gap = 0,
  voxelSize = 50,
  edgeWidth = 1,
  edgeColor = '#333',
  camera,
  orbit = true,
  zoom = true,
  onBoxelClick,
  onBoxelHover,
  onBoxelPointerDown,
  className,
  containerStyle,
}: BoxelsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<BoxelsCore | null>(null)

  // Initialize
  useEffect(() => {
    if (!containerRef.current) return

    const b = new BoxelsCore({
      renderer: 'dom',
      voxelSize,
      gap,
      edgeWidth,
      edgeColor,
      camera,
      orbit,
      zoom,
      style,
    })

    b.mount(containerRef.current)
    instanceRef.current = b

    return () => {
      b.unmount()
      instanceRef.current = null
    }
  // Only re-create on mount config changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orbit, zoom, camera?.distance, camera?.rotation?.[0], camera?.rotation?.[1]])

  // Sync geometry
  useEffect(() => {
    const b = instanceRef.current
    if (!b) return

    b.clear()
    for (const box of boxes) {
      b.addBox(box)
    }
    for (const sphere of spheres) {
      b.addSphere(sphere)
    }
    for (const line of lines) {
      b.addLine(line)
    }
  }, [boxes, spheres, lines])

  // Sync events
  useEffect(() => {
    const b = instanceRef.current
    if (!b) return

    if (onBoxelClick) b.on('boxel:click', onBoxelClick as (e: BoxelEvent | Event) => void)
    if (onBoxelHover) b.on('boxel:hover', onBoxelHover as (e: BoxelEvent | Event) => void)
    if (onBoxelPointerDown) b.on('boxel:pointerdown', onBoxelPointerDown as (e: BoxelEvent | Event) => void)

    return () => {
      if (onBoxelClick) b.off('boxel:click', onBoxelClick as (e: BoxelEvent | Event) => void)
      if (onBoxelHover) b.off('boxel:hover', onBoxelHover as (e: BoxelEvent | Event) => void)
      if (onBoxelPointerDown) b.off('boxel:pointerdown', onBoxelPointerDown as (e: BoxelEvent | Event) => void)
    }
  }, [onBoxelClick, onBoxelHover, onBoxelPointerDown])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '400px',
        ...containerStyle,
      }}
    />
  )
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/react/Boxels.tsx
git commit -m "feat: React 19+ <Boxels /> wrapper component"
```

---

### Task 21: Docs App Scaffold

**Files:**
- Create: `docs/index.html`
- Create: `docs/main.tsx`
- Create: `docs/App.tsx`
- Create: `docs/styles/app.css`

- [ ] **Step 1: Create docs/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>boxels — Voxels as a design primitive</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

- [ ] **Step 2: Create docs/main.tsx**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/app.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 3: Create docs/styles/app.css**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0a0a0f;
  color: #e0e0e0;
  min-height: 100vh;
}

#root {
  min-height: 100vh;
}

a {
  color: #6cb6ff;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.app-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background: #111118;
  border-right: 1px solid #222;
  padding: 24px 16px;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
}

.sidebar h1 {
  font-size: 20px;
  margin-bottom: 4px;
  color: #fff;
}

.sidebar .tagline {
  font-size: 12px;
  color: #888;
  margin-bottom: 24px;
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar nav a {
  padding: 8px 12px;
  border-radius: 6px;
  color: #bbb;
  font-size: 14px;
  transition: background 0.15s;
}

.sidebar nav a:hover,
.sidebar nav a.active {
  background: #1a1a24;
  color: #fff;
  text-decoration: none;
}

.main-content {
  margin-left: 220px;
  flex: 1;
  padding: 40px;
}

.example-page {
  max-width: 900px;
}

.example-page h2 {
  font-size: 28px;
  margin-bottom: 8px;
}

.example-page .description {
  color: #999;
  margin-bottom: 24px;
  font-size: 15px;
}

.scene-container {
  width: 100%;
  height: 500px;
  background: #0d0d14;
  border: 1px solid #222;
  border-radius: 12px;
  margin-bottom: 24px;
  overflow: hidden;
}

.code-block {
  background: #111118;
  border: 1px solid #222;
  border-radius: 8px;
  padding: 16px 20px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
  color: #ccc;
}
```

- [ ] **Step 4: Create docs/App.tsx**

```tsx
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import { BasicExample } from './components/BasicExample'
import { RubikExample } from './components/RubikExample'
import { DataVizExample } from './components/DataVizExample'
import { ArchitecturalExample } from './components/ArchitecturalExample'
import { GlassExample } from './components/GlassExample'
import { PerformanceExample } from './components/PerformanceExample'

const examples = [
  { path: '/', label: 'Basic', component: BasicExample },
  { path: '/rubik', label: 'Rubik\'s Cube', component: RubikExample },
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
          <p className="tagline">Voxels as a design primitive</p>
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
```

- [ ] **Step 5: Commit**

```bash
git add docs/index.html docs/main.tsx docs/App.tsx docs/styles/app.css
git commit -m "feat: docs app scaffold — sidebar nav, hash router, dark theme"
```

---

### Task 22: Basic Example

**Files:**
- Create: `docs/components/BasicExample.tsx`

- [ ] **Step 1: Implement BasicExample**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add docs/components/BasicExample.tsx
git commit -m "feat: basic example — 3x3x3 cube with orbit controls"
```

---

### Task 23: Rubik Example

**Files:**
- Create: `docs/components/RubikExample.tsx`

- [ ] **Step 1: Implement RubikExample**

```tsx
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

// Click to rotate a random layer
document.addEventListener('click', () => {
  const axis = ['x', 'y', 'z'][Math.floor(Math.random() * 3)]
  const layer = Math.floor(Math.random() * 3)
  b.rotateLayer({ axis, layer, direction: 1, duration: 400 })
})`

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

    // Auto-rotate a layer every 2 seconds
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
```

- [ ] **Step 2: Commit**

```bash
git add docs/components/RubikExample.tsx
git commit -m "feat: Rubik's cube example with auto layer rotation"
```

---

### Task 24: Data Viz Example

**Files:**
- Create: `docs/components/DataVizExample.tsx`

- [ ] **Step 1: Implement DataVizExample**

```tsx
import { useRef, useEffect } from 'react'
import { Boxels } from 'boxels'

const CODE = `import { Boxels } from 'boxels'

const b = new Boxels({
  voxelSize: 30,
  gap: 2,
  camera: { rotation: [-30, 45] },
})

// Bar chart: 6 columns with different heights
const data = [3, 7, 5, 9, 4, 6]
data.forEach((height, i) => {
  b.addBox({
    position: [i * 2, 0, 0],
    size: [1, height, 1],
    style: Boxels.presets.gradient(6, 10, 1),
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
          default: (_x, y, _z) => {
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
```

- [ ] **Step 2: Commit**

```bash
git add docs/components/DataVizExample.tsx
git commit -m "feat: data viz example — 3D bar chart with gradient styling"
```

---

### Task 25: Architectural Example

**Files:**
- Create: `docs/components/ArchitecturalExample.tsx`

- [ ] **Step 1: Implement ArchitecturalExample**

```tsx
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

    // Solid block with carved interior
    b.addBox({ position: [0, 0, 0], size: [8, 8, 8] })
    b.addBox({ position: [1, 1, 1], size: [6, 7, 6], mode: 'subtract' })

    // Window openings
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
```

- [ ] **Step 2: Commit**

```bash
git add docs/components/ArchitecturalExample.tsx
git commit -m "feat: architectural example — Heerich-style hollowed sculpture"
```

---

### Task 26: Glass Example

**Files:**
- Create: `docs/components/GlassExample.tsx`

- [ ] **Step 1: Implement GlassExample**

```tsx
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
        Translucent boxels with backdrop-filter blur and a carved sphere. Best viewed with a background that shows through.
      </p>
      <div ref={containerRef} className="scene-container" />
      <pre className="code-block">{CODE}</pre>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add docs/components/GlassExample.tsx
git commit -m "feat: glass example — translucent boxels with backdrop blur"
```

---

### Task 27: Performance Example

**Files:**
- Create: `docs/components/PerformanceExample.tsx`

- [ ] **Step 1: Implement PerformanceExample**

```tsx
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

    // Count boxels and faces
    let count = 0
    b.forEach(() => count++)
    setBoxelCount(count)

    // Count rendered face divs
    const faces = containerRef.current.querySelectorAll('[data-face]')
    setFaceCount(faces.length)

    // FPS counter
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
```

- [ ] **Step 2: Commit**

```bash
git add docs/components/PerformanceExample.tsx
git commit -m "feat: performance example — 10x10x10 cube with FPS counter and face count"
```

---

### Task 28: Run All Tests + Build Verification

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Type-check the full project**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: No type errors

- [ ] **Step 3: Build the library**

Run: `npm run build:lib`
Expected: `dist/lib/boxels.mjs` and `dist/lib/boxels.cjs` created

- [ ] **Step 4: Start the dev server and verify docs app loads**

Run: `npm run dev`
Expected: Dev server starts, docs app loads at localhost URL, basic example renders a 3D cube

- [ ] **Step 5: Commit any fixes needed**

If any issues were found in steps 1-4, fix and commit them.

---

### Task 29: Final Integration Verification

- [ ] **Step 1: Verify all 6 example pages render**

Navigate to each example in the docs app:
- `/#/` — Basic: 3x3x3 cube with orbit
- `/#/rubik` — Rubik's: colored cube with layer rotations
- `/#/data-viz` — Bar chart with gradients
- `/#/architectural` — Hollowed sculpture with edge fusion
- `/#/glass` — Translucent boxels
- `/#/performance` — 10x10x10 with FPS counter

- [ ] **Step 2: Verify edge fusion works**

The Basic and Architectural examples should show only outer silhouette edges (no internal grid lines visible).

- [ ] **Step 3: Verify orbit controls**

Drag to rotate and scroll to zoom on any example.

- [ ] **Step 4: Commit and tag**

```bash
git add -A
git commit -m "feat: boxels v0.1.0 — DOM renderer with edge fusion, styling, animations, React wrapper, and docs"
git tag v0.1.0
```
