# Behavior Sweep Engine Runtime Interface

The **BehaviorSweepEngine** (located at `src/visualizers/shared/BehaviorSweepEngine.js`) centralizes the musical storytelling layer that was previously duplicated across consoles. It consumes per-frame audio analysis and optional beat/onset metadata, then emits normalized deltas for motion, geometry, and colour so that visual systems and UI surfaces can react consistently.

## Usage

```js
import { BehaviorSweepEngine } from '../src/visualizers/shared/BehaviorSweepEngine.js';

const sweepEngine = new BehaviorSweepEngine('hyper');
const deltas = sweepEngine.applyBehavioralReactivity({
  audioFrame: audioData,   // Analyzer output (bands can be numbers or `{ value }`)
  beatInfo: audioData?.beat,
  preset: 'cinematic' | 'hyper' | 'mellow',
  deltaTime: frameTimeMs,
});
```

The returned object contains:

- `motionRotation`: `{ xw, yw, zw }` 4D rotation deltas (apply to `rot4dXW`, `rot4dYW`, `rot4dZW`).
- `cameraDrift` and `cameraVelocity`: macro motion values useful for camera speed/chaos envelopes.
- `morphDelta` / `densityDelta`: geometry pushes you can add to morph and density uniforms.
- `color`: `{ hueShift, saturationPulse }` colour modulation suitable for hue and saturation inputs.
- `journey`: `{ phase, section, beatPulse, onset }` journey metadata for UI or sequencing.

All values are pre-scaled by the chosen preset; downstream systems should still clamp to their own safe ranges.

## Integrating Systems

Quantum, Faceted, and Holographic systems now instantiate the engine and merge its deltas into their per-frame parameter updates. When `audioEnabled` is true, they add:

- Density + morph pushes into `gridDensity` and `morphFactor`.
- 4D motion into rotation uniforms.
- Colour modulation into hue/saturation before passing values to `ColorSystem` and visualizer uniforms.
- Camera velocity drift into speed/chaos-style controls where applicable.

## Integrating UI Surfaces

Ultimate and Mobile consoles import the shared engine instead of duplicating logic. In their render loops they:

1. Request deltas via `applyBehavioralReactivity()` using the latest audio frame.
2. Respect user toggles (`reactivity.enabled`) to selectively apply density, morph, rotation, colour, or chaos adjustments.
3. Clamp resulting parameters and forward them to the active visualizer through `updateParameter`.

Any new UI surface should follow the same pattern: keep a base parameter set, fetch deltas every frame, and apply only the deltas that correspond to enabled controls.
