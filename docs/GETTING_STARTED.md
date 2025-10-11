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

Then open `http://localhost:8080/examples/basic-choreography.html`

## 🎯 Quick Start Example

```javascript
import { ChoreographyEngine } from './src/core/ChoreographyEngine.js';
import { RotationChoreographer } from './src/choreographers/RotationChoreographer.js';

// Create your visualizer (must have updateParameter method)
const visualizer = {
    updateParameter: (name, value) => {
        console.log(`Setting ${name} = ${value}`);
        // Update your WebGL uniforms here
    }
};

// Initialize choreography engine
const engine = new ChoreographyEngine({
    visualizers: [visualizer],
    audioAnalyzer: yourAudioAnalyzer,  // or null for mock data
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

Your audio analyzer should provide:

```javascript
{
    bands: {
        bass: 0.0-1.0,
        mid: 0.0-1.0,
        high: 0.0-1.0
    },
    rms: 0.0-1.0,              // Overall energy
    onset: 0.0-1.0,            // Onset detection
    spectralCentroid: number,  // Hz (optional)
    spectralRolloff: number,   // Hz (optional)
    bpm: number                // Detected BPM (optional)
}
```

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
