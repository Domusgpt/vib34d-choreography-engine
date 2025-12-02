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

For UI surfaces that expose user controls, the helper `applyReactiveControls` can be used to gate those deltas and clamp the result:

```js
import { applyReactiveControls } from '../src/visualizers/shared/BehaviorSweepEngine.js';

const reactiveParams = applyReactiveControls({
  baseParams,
  deltas,
  intensity: reactivity.amount,
  controls: {
    density: { enabled: reactivity.enabled.density },
    morph: { enabled: reactivity.enabled.morph },
    color: { enabled: reactivity.enabled.color },
    chaos: { enabled: reactivity.enabled.chaos },
    rotation: { enabled: reactivity.enabled.rotation },
    camera: { enabled: true, amount: 1 },
  },
  limits: {
    gridDensity: { min: 0, max: 80 },
    morphFactor: { min: 0, max: 3 },
    saturation: { min: 0, max: 1 },
    chaos: { min: 0, max: 1 },
    speed: { min: 0, max: 3 },
  }
});
```

`applyReactiveControls` preserves `journeyPhase` and `journeySection` on the returned object so control panels can surface live phase readouts alongside the toggles.

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

## LLM-Friendly Prompt Template (No JSON Needed)

To avoid hand-crafting JSON, you can hand a language model a plain-text template and then parse the response directly into control toggles:

```js
import { createBehaviorPrompt, parseBehaviorPromptResponse } from '../src/visualizers/shared/BehaviorSweepEngine.js';

// 1) Copy/paste this prompt into your LLM along with your own creative ask
const prompt = createBehaviorPrompt('Make it feel like a sunrise in slow motion');

// 2) Paste the LLM response back into your app and parse it
const llmSettings = parseBehaviorPromptResponse(responseText);

// 3) Apply the parsed preset + per-control gates
if (llmSettings.preset) sweepEngine.setPreset(llmSettings.preset);
if (typeof llmSettings.intensity === 'number') reactivity.amount = llmSettings.intensity;
Object.entries(llmSettings.controls).forEach(([key, control]) => {
  if (typeof control.enabled === 'boolean') reactivity.enabled[key] = control.enabled;
  if (typeof control.amount === 'number') reactivity.controlAmount[key] = control.amount;
});
```

The prompt template lives in `LLM_BEHAVIOR_PROMPT_TEMPLATE` and asks the LLM to respond using simple colon-delimited text (no JSON). Supported keys: `Preset`, `Intensity`, `Density`, `Morph`, `Color`, `Chaos`, `Rotation`, `Camera`, and an optional `Notes` line for human operators.

### Validating and Surfacing LLM Output

`parseBehaviorPromptResponse` also returns:

- `warnings`: human-readable strings for unknown lines or missing values (e.g., intensity fallback).
- `matchedKeys`: an array of the keys that were successfully parsed, useful if you only want to apply user-provided values.
- `defaultedIntensity`: boolean flag telling UIs whether intensity was auto-filled.

The Ultimate and Mobile demos now surface these fields in-line via a “LLM PRESETS” block that:

1. Copies the template + user prompt to the clipboard (with a graceful message if clipboard access is blocked).
2. Lets you paste the LLM reply, previews the parsed preset/intensity/notes, and shows any warnings.
3. Applies the parsed control gates without requiring JSON.
