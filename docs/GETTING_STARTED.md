# 🚀 Getting Started with VIB34D Choreography Engine

Welcome to the revolutionary 4D audio-reactive choreography system!

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Domusgpt/vib34d-choreography-engine.git
cd vib34d-choreography-engine

# Install dependencies (if using npm)
npm install

# Run the demo
# Option 1: Using npx serve
npx serve

# Option 2: Using Python
python3 -m http.server 8080

# Option 3: Using Node http-server
npx http-server
```

Then open `http://localhost:8080/examples/INDEX.html`

> 💡 The root `index.html` already redirects to the atlas, so pointing your browser at `http://localhost:8080/` is enough once the dev server is running.

## 🗺️ Master Demo Atlas

The repository now ships with a searchable “Demo Atlas” at [`examples/INDEX.html`](../examples/INDEX.html). It lists every active HTML entry point, including production-ready canvases, analyzer harnesses, diagnostics, and archival demos. Use it to:

- Jump straight to the **Final Ultimate** cinematic showcase or other flagship experiences.
- Launch **properly-reactive.html** to validate the looping groove, analyzer telemetry, and audio permissions before testing other surfaces.
- Filter by category (Production Suites, Reactive Harnesses, Diagnostics, Legacy Archives, or Quick Links) or search by tags such as `audio`, `macro`, `mobile`, or `ci`.

Because the atlas renders from a JavaScript dataset, totals for demos, visualizer systems, reactivity modes, and macro harnesses stay accurate as we add or retire HTML entry points.

## 🎯 Quick Start Example

```javascript
import { ChoreographyEngine } from './src/core/ChoreographyEngine.js';
import { RotationChoreographer } from './src/choreographers/RotationChoreographer.js';
import { AudioAnalyzer } from './src/audio/AudioAnalyzer.js';

// Create your visualizer (must have updateParameter method)
const visualizer = {
    updateParameter: (name, value) => {
        console.log(`Setting ${name} = ${value}`);
        // Update your WebGL uniforms here
    }
};

// Hook up real audio (file, microphone, etc.)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const audioElement = document.querySelector('audio');
const sourceNode = audioContext.createMediaElementSource(audioElement);
const audioAnalyzer = new AudioAnalyzer(audioContext, { fftSize: 2048 });

sourceNode.connect(audioAnalyzer.analyser);
audioAnalyzer.analyser.connect(audioContext.destination);

// Initialize choreography engine
const engine = new ChoreographyEngine({
    visualizers: [visualizer],
    audioAnalyzer,
    bpm: 128
});

// Load preset sequences
await engine.loadSequenceLibrary('./src/sequences/presets/bass-drops.json');

// Start choreography
engine.start();

// Create rotation choreographer
const rotationChoreographer = new RotationChoreographer();
rotationChoreographer.setPattern('hyperspace_spiral');

// In your render loop
function render() {
    const audioData = audioAnalyzer.analyze();

    // Update rotation
    const rotations = rotationChoreographer.update(
        audioData,
        time,
        beat,
        deltaTime
    );

    // Apply to visualizer
    visualizer.updateParameter('rot4dXW', rotations.rot4dXW);
    visualizer.updateParameter('rot4dYW', rotations.rot4dYW);
    visualizer.updateParameter('rot4dZW', rotations.rot4dZW);

    requestAnimationFrame(render);
}
render();
```

## 🎨 Palette Styles Across Visualizers

The unified console at [`examples/ultimate-reactive.html`](../examples/ultimate-reactive.html) (and the mobile-first [`examples/mobile-smart.html`](../examples/mobile-smart.html) entry, which mounts the same module in deck mode) surfaces a **Hypercolor ↔ Uniform** toggle that applies to Quantum, Holographic, and Faceted visualizers alike. A few tips when testing the new colour flow:

- **Hypercolor** keeps the original multi-spectrum gradients alive, leaning on the Hypercolor engine for evolving highlights, shadows, and glass refraction.
- **Uniform** locks each system to curated palette families from `src/color/UniformPaletteLibrary.js`, perfect for brandable or monochromatic looks.
- The `colorStyle`, `colorProfile`, and `colorVibrance` sliders are wired through the shared control bus, so manual picks, auto-rotating playlists, and scene presets stay synced even while audio choreography is modulating density, hue orbit, and accent pulses.
- Audio reactivity is still in charge—bass, mid, and high bands continue to push vibrance, shimmer, and lattice motion in both styles, so switching palettes never mutes the groove.
- Need the touch-optimized layout on desktop? Append `?layout=mobile` to the URL to force the bottom-sheet presentation while debugging.

Want to drop the console into your own HTML wrapper? Import `launchUltimateConsole` from [`examples/js/ultimateConsole.js`](../examples/js/ultimateConsole.js) and call it with your canvas and host element IDs.

## 🎼 Creating Custom Sequences

```javascript
// Define a custom sequence
engine.defineSequence({
    name: "my_custom_drop",
    description: "My amazing bass drop",
    trigger: "bass > 0.8 && onset > 0.5",
    duration: 4000,  // 4 seconds
    stages: [
        {
            start: 0,
            duration: 1000,
            // Anticipation phase
            rot4dXW: { from: 0, to: Math.PI/2, easing: "easeIn" },
            gridDensity: { from: "current", to: 50, easing: "easeIn" }
        },
        {
            start: 1000,
            duration: 500,
            // Impact phase
            chaos: { spike: 1.0 },
            intensity: { spike: 1.5 }
        },
        {
            start: 1500,
            duration: 2500,
            // Release phase
            rot4dYW: { from: 0, to: -Math.PI, easing: "easeOut" },
            morphFactor: { from: "current", to: 1.5, easing: "easeOut" }
        }
    ]
});
```

## 🌀 Available Rotation Patterns

```javascript
const patterns = [
    'smooth',              // Continuous smooth rotation
    'hyperspace_spiral',   // Spiral through all 3 4D planes
    'beat_locked',         // Snaps to beat divisions
    'bass_momentum',       // Accumulates momentum from bass
    'spectral_orbit',      // Speed based on spectral centroid
    'energy_sweep',        // Dramatic sweeps with energy
    'chaos_spin',          // Unpredictable rotations
    'onset_snap'           // Sudden rotation on onsets
];

// Set pattern
rotationChoreographer.setPattern('hyperspace_spiral');
```

## 📊 Audio Data Format

The built-in analyzer (and any custom analyzer) should provide:

```javascript
{
    bands: {                 // Normalized energy per band (0-1)
        subBass: 0.34,
        bass: 0.51,
        lowMid: 0.22,
        mid: 0.40,
        highMid: 0.28,
        high: 0.18,
        air: 0.09,
        ultraHigh: 0.09      // Auto-filled from "air" when absent
    },
    bandDetails: {           // Optional metadata for UI / analysis tools
        bass: { low: 60, high: 250, value: 0.51 },
        mid: { low: 500, high: 2000, value: 0.40 },
        // ...remaining bands
    },
    rms: 0.0-1.0,            // Overall loudness
    onset: 0.0-1.0,          // Onset strength this frame
    onsetEvent: {            // Detailed onset event information
        detected: true|false,
        strength: 0.0-1.0,
        time: Date.now()
    },
    spectralCentroid: 0.0-1.0,
    spectralRolloff: 0.0-1.0,
    spectralFlux: 0.0-1.0,
    bpm: number              // Optional BPM estimate
}
```

## 🎥 Cinematic Camera Channels

The shared `CameraLightingSystem` now outputs a richer state so you can render filmic depth directly in your shaders. Alongside orbit, elevation, dolly, roll, exposure, shutter, bloom, and key/fill/rim/ambient/vignette, every update includes:

- `parallax` – Stereo-style warp amount that follows pointer gestures, chaos bursts, and macro overrides.
- `focus` / `focusSpread` – A beat-aware focal distance plus falloff curve you can feed into depth-of-field math or intensity envelopes.
- `chromaticAberration` – Music-driven chroma separation intensity for prismatic fringes.
- `lightTemperature` – Warm ↔ cool tilt derived from palette orbit and energy for colour grading.
- `shadowContrast` – Accent-weighted contrast multiplier for shadow mixing or gamma tweaks.
- `fogDensity` – Bass + dimensional lift aware volumetric haze strength.
- `godrayIntensity` – Downbeat and accent luma surge mapped to volumetric beam highlights.
- `filmGrain` – Noise amplitude that follows chaos surges and macros for grit-on-demand.
- `lensDistortion` – Radial warp offset tied to dimensional lift for subtle anamorphic pulls.
- `frameBlend` – Motion streak blend factor that tightens during accents and motion velocity spikes.
- `lightWrap` – Edge wrap intensity blending scene lighting back onto silhouettes.
- `colorBleed` – Palette bleed ratio pushing channel cross-talk during high-energy passages.

All fields are smoothed inside the camera system, so you can read them every frame via `system.getCameraState()` or from your visualizer's `setCameraLighting(state)` hook without extra easing.

> **Tip:** When no audio is available, the engine automatically provides a silent frame with all values set to 0 so visualizers can handle the transition gracefully.

## 🎨 Parameter Names

Standard parameters that sequences can control:

- **Rotation**: `rot4dXW`, `rot4dYW`, `rot4dZW`
- **Geometry**: `geometry` (0-7), `gridDensity`, `morphFactor`
- **Visual**: `hue`, `saturation`, `intensity`, `chaos`
- **Animation**: `speed`

## 🔧 Easing Functions

Available easing functions for smooth transitions:

- `linear` - Constant speed
- `easeIn` - Slow start, fast end
- `easeOut` - Fast start, slow end
- `easeInOut` - Slow start and end, fast middle
- `exponential` - Exponential acceleration

## 🎯 Trigger Expressions

Sequences can be triggered by expressions:

```javascript
"bass > 0.7"                          // Simple threshold
"bass > 0.7 && onset > 0.5"          // Combine conditions
"bass > 0.8 && energy > 0.7"         // Multiple audio features
```

Or use a function:

```javascript
trigger: (audioData, memory) => {
    return audioData.bands.bass > 0.7 && memory.energyTrend === "building";
}
```

## 🎞️ Capture Macro Gestures

Want to replay a pointer solo or share an expressive modulation pass?

```javascript
// Begin recording colour + lighting channels and quantize to eighth-notes
polychoraSystem.startMacroRecording('sunriseSweep', {
  tags: ['color', 'lighting'],
  quantizeBeats: 0.5
});

// ...perform gestures for two measures...

const macro = polychoraSystem.stopMacroRecording();
console.log(`Captured ${macro.frames.length} frames over ${macro.duration}s`);

// Loop it back with a soft blend
polychoraSystem.playMacro('sunriseSweep', { blend: 0.5, loop: true });
```

`BaseSystem` automatically routes pointer/touch gestures to the active visualizer during playback, and macros can be exported/imported as JSON for collaborating with other performers.

## 📚 Next Steps

1. **Explore examples/** - See working demos
2. **Read docs/API.md** - Full API documentation
3. **Check docs/CHOREOGRAPHY_PLAN.md** - Complete expansion roadmap
4. **Customize sequences/** - Create your own choreography

## 🤝 Integration with Existing Visualizers

If you have existing Quantum/Faceted/Holographic visualizers:

```javascript
// Wrap your existing visualizer
const wrappedVisualizer = {
    updateParameter: (name, value) => {
        // Map to your existing parameter system
        yourVisualizer.params[name] = value;

        // Or call your specific methods
        if (name === 'rot4dXW') {
            yourVisualizer.setRotationXW(value);
        }
    }
};

// Use with choreography engine
const engine = new ChoreographyEngine({
    visualizers: [wrappedVisualizer]
});
```

## 🎪 Live Demo

The `examples/basic-choreography.html` shows:
- ✅ Real-time beat detection
- ✅ Automatic sequence triggering
- ✅ Manual sequence launching
- ✅ Rotation pattern switching
- ✅ Live logging
- ✅ 4D visualization

## 💡 Tips

1. **Start simple** - Use preset sequences first
2. **Test without audio** - Mock data works great for development
3. **Iterate on timing** - Adjust stage durations for your music
4. **Layer sequences** - Multiple sequences can be active
5. **Monitor performance** - Keep render loop fast

## 🐛 Troubleshooting

**Sequences not triggering?**
- Check trigger threshold (bass > 0.7 might be too high)
- Verify audio data format matches expected structure
- Use mock data to test triggers

**Choppy animation?**
- Reduce number of active sequences
- Simplify easing calculations
- Check render loop performance

**Parameters not updating?**
- Ensure visualizer has `updateParameter` method
- Check parameter names match
- Verify values are in correct range

---

**Ready to create cinematic 4D choreography!** 🌌

See [CHOREOGRAPHY_PLAN.md](./CHOREOGRAPHY_PLAN.md) for the complete vision.
