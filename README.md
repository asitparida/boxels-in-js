# boxels

A tiny CSS 3D library for composing interactive boxel scenes from DOM divs. Per-face styling, edge fusion, textures, image mapping, click interactions, and spin animation — zero dependencies.

**[Live Demo](https://asitparida.github.io/boxels-in-js/)**

## Quick Start

```js
import { Boxels } from 'boxels'

const b = new Boxels({
  boxelSize: 100,
  gap: 1,
  edgeWidth: 1,
  camera: { rotation: [-25, 35] },
})

b.addBox({ position: [0, 0, 0], size: [2, 2, 2] })
b.mount(document.getElementById('scene'))
b.setTexture('glass', 220, 0.70)
```

## Features

### Textures

5 built-in material textures, controlled by hue and opacity:

```js
b.setTexture('solid', 220, 1.0)    // Opaque blocks with visible edges
b.setTexture('hollow', 220, 1.0)   // Wireframe — transparent fill, colored edges
b.setTexture('glass', 220, 0.7)    // Translucent with backdrop blur
b.setTexture('frosted', 220, 0.8)  // Heavy blur, milky
b.setTexture('neon', 220, 1.0)     // Dark blocks with bright glowing edges
```

### Geometry & Boolean Operations

```js
b.addBox({ position: [0, 0, 0], size: [4, 4, 4] })
b.addSphere({ center: [2, 2, 2], radius: 1.5, mode: 'subtract' })
b.addLine({ from: [0, 0, 0], to: [5, 5, 5], radius: 1 })
b.removeBox({ position: [1, 1, 0], size: [2, 2, 1] })

// Boolean modes: 'union' (default), 'subtract', 'intersect', 'exclude'
```

### Per-Face Styling

```js
b.addBox({
  position: [0, 0, 0],
  size: [3, 3, 3],
  style: {
    front:  { fill: '#ff0000', stroke: '#333' },
    back:   { fill: '#ff8c00', stroke: '#333' },
    left:   { fill: '#00cc00', stroke: '#333' },
    right:  { fill: '#0000ff', stroke: '#333' },
    top:    { fill: '#ffff00', stroke: '#333' },
    bottom: { fill: '#ffffff', stroke: '#333' },
  }
})
```

### Functional Styles

```js
b.addBox({
  position: [0, 0, 0],
  size: [6, 6, 6],
  style: {
    default: (x, y, z) => ({
      fill: `oklch(${0.4 + y / 12} 0.15 ${x / 6 * 360})`,
      stroke: 'transparent',
    })
  }
})
```

### Image Mapping

```js
// One image distributed across all exposed faces
b.mapImage('landscape.jpg')

// Different image per face type
b.mapImage('icon-x.png', 'front')
b.mapImage('icon-github.png', 'back')
```

### Edge Fusion

When `gap: 0`, internal faces between adjacent boxels are culled and shared edges merge — only the outer silhouette remains. A 10x10x10 cube (1,000 boxels) renders ~600 faces instead of 6,000.

### Animation

```js
// Continuous spin
b.startSpin({ x: true, y: true, speed: 3 })
b.stopSpin()

// Gap animation
b.animateGap({ from: 0, to: 10, duration: 800 })
```

### Click Interaction

```js
b.enableClick(({ boxel, face }) => {
  console.log(`Clicked ${face} face at [${boxel}]`)
})
// Plays a dip animation + active flash on the clicked face
// Pauses spin during interaction, resumes after

b.disableClick()
```

### Axes

```js
b.showAxes()  // L/R (red), T/B (blue), F/Bk (green) through center
b.hideAxes()
```

### Positioning

```js
// Fixed position on page
const b = new Boxels({
  position: { x: '50%', y: 100, zIndex: 999, fixed: true }
})

// Update at runtime
b.setPosition({ x: 200, y: 300 })
```

### Camera

```js
b.updateTransform(-30, 45)  // rotateX, rotateY in degrees
b.getRotation()             // { rotX, rotY }
```

## Constructor Options

```js
new Boxels({
  boxelSize: 50,           // Size of each boxel in px
  gap: 0,                  // Gap between boxels in px
  edgeWidth: 1,            // Border width in px
  edgeColor: '#333',       // Default border color
  camera: {
    type: 'perspective',
    distance: 1200,
    rotation: [-25, 35],   // [rotX, rotY] in degrees
  },
  orbit: true,             // Drag to rotate
  zoom: true,              // Scroll to zoom
  showBackfaces: false,    // Show internal faces for translucent styles
})
```

## Project Structure

```
boxels-in-js/
  src/lib/           # The library (zero dependencies)
    core/            # Grid, boolean ops, geometry, style, edge fusion, textures
    renderers/dom/   # CSS 3D renderer, orbit controls, axes
    animation/       # RAF animator, explode, tweens, layer rotation
    presets/         # Built-in style presets
  src/react/         # React 19+ wrapper
  docs/              # Interactive showcase app
```

## Development

```bash
npm install
npm run dev          # Docs app at localhost:5173
npm run build:lib    # Build library to dist/lib/
npm test             # Run tests
```

## License

MIT
