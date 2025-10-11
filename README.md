# 🌌 VIB34D Choreography Engine

**Revolutionary 4D Audio-Reactive Choreography System**

Transform basic audio reactivity into cinematic 4D choreographic storytelling with dramatic sequences, 4D rotation sweeps, color progressions, and multi-parameter coordination.

## 🎯 What This Is

A comprehensive audio choreography engine that creates **sequences** not just **reactions**:

- **Shader-level choreography** - GPU-accelerated parameter control
- **Cross-system synchronization** - Coordinate multiple visualizers
- **Predictive choreography** - Anticipate drops and build tension
- **4D rotation sequences** - Dramatic sweeps through hyperspace
- **Color progressions** - Emotional color journeys
- **Multi-parameter coordination** - Everything responds together
- **Beat synchronization** - Locked to musical structure
- **Memory & evolution** - System learns and adapts

## 📊 The Problem We Solve

**Before**: Basic linear additions
```javascript
gridDensity += bass * 40;
hue += high * 120;
```

**After**: Cinematic choreographed sequences
```javascript
// Bass drop cascade - 4-beat sequence with anticipation, impact, release
executeSequence("bass_drop_cascade", {
    trigger: bass > 0.7,
    stages: [
        { anticipation: { rot4dXW: sweep(0, π/2), gridDensity: ramp(2x) }},
        { impact: { chaos: spike(1.0), geometry: jump(next) }},
        { release: { rot4dYW: sweep(-π), morphFactor: ease(1.5) }}
    ]
});
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## 📁 Project Structure

```
vib34d-choreography-engine/
├── src/
│   ├── core/
│   │   ├── ChoreographyEngine.js          # Main timeline engine
│   │   ├── SequenceManager.js             # Sequence orchestration
│   │   └── InterpolationSystem.js         # Easing & curves
│   ├── choreographers/
│   │   ├── ShaderChoreographer.js         # GPU-level choreography
│   │   ├── RotationChoreographer.js       # 4D rotation patterns
│   │   ├── ColorChoreographer.js          # Color progressions
│   │   ├── GeometryChoreographer.js       # Geometric metamorphosis
│   │   └── CrossSystemChoreographer.js    # Multi-visualizer sync
│   ├── analysis/
│   │   ├── BeatSyncEngine.js              # Beat detection & sync
│   │   ├── PredictiveChoreographer.js     # Structure prediction
│   │   └── SpectralAnalyzer.js            # Advanced audio features
│   ├── sequences/
│   │   ├── presets/                       # Pre-built sequences
│   │   └── SequenceLibrary.js             # Sequence registry
│   ├── visualizers/
│   │   ├── QuantumVisualizer.js           # Enhanced Quantum
│   │   ├── FacetedVisualizer.js           # Enhanced Faceted
│   │   └── HolographicVisualizer.js       # Enhanced Holographic
│   └── utils/
│       ├── PhysicsEngine.js               # Fluid dynamics
│       └── EmotionDetector.js             # Semantic colors
├── shaders/
│   ├── quantum-enhanced.frag              # Quantum with choreography
│   ├── faceted-enhanced.frag              # Faceted with choreography
│   └── holographic-enhanced.frag          # Holographic with choreography
├── examples/
│   ├── basic-choreography.html            # Simple example
│   ├── advanced-sequences.html            # Complex choreography
│   └── cross-system-sync.html             # Multi-visualizer
├── docs/
│   ├── API.md                             # API documentation
│   ├── SEQUENCES.md                       # Sequence format
│   ├── SHADERS.md                         # Shader integration
│   └── CHOREOGRAPHY_PLAN.md               # Full expansion plan
└── tests/
    └── choreography.test.js               # Unit tests
```

## 🎼 Core Features

### 1. Sequence System
Multi-stage choreographed sequences that unfold over time:
```javascript
{
    name: "Bass Drop Cascade",
    trigger: "bass > 0.7",
    duration: 4 * beatDuration,
    stages: [
        { anticipation: { /* ramp up */ }},
        { impact: { /* explosive change */ }},
        { release: { /* settle down */ }}
    ]
}
```

### 2. 4D Rotation Choreography
Dynamic sweeps through hyperspace:
- Hyperspace spirals
- Beat-locked rotations
- Bass momentum spin
- Spectral orbits

### 3. Color Progression
Cinematic color journeys:
- Sunrise to sunset
- Bass pulse rainbow
- Spectral mapping
- Complementary flips

### 4. Shader-Level Choreography
GPU-accelerated effects:
- Rotation speed/phase/momentum
- Layer-specific choreography
- Particle explosions
- RGB glitch sequences

### 5. Cross-System Coordination
All visualizers dance together:
- Unified bass drops
- Synchronized builds
- Coordinated breakdowns

## 🎯 Usage

### Basic Choreography
```javascript
import { ChoreographyEngine } from './src/core/ChoreographyEngine.js';

const engine = new ChoreographyEngine({
    visualizers: [quantumViz, facetedViz, holographicViz],
    audioAnalyzer: audioAnalyzer,
    bpm: 128
});

// Load preset sequences
engine.loadSequenceLibrary('presets/edm-drops.json');

// Start choreography
engine.start();
```

### Custom Sequences
```javascript
engine.defineSequence({
    name: "My Custom Drop",
    trigger: (audio) => audio.bass > 0.8 && audio.onset > 0.5,
    duration: 4000,
    choreography: {
        quantum: {
            rot4dZW: { sweep: [0, Math.PI * 2], easing: "easeInOut" },
            gridDensity: { spike: 2.5, decay: 0.93 }
        },
        faceted: {
            hue: { shift: 180 },
            intensity: { flash: 1.5, duration: 200 }
        }
    }
});
```

### Gesture Recording
```javascript
const recorder = new GestureChoreographyRecorder();

// Start recording
recorder.startRecording(audio.currentTime);

// User performs gestures during playback
// ...

// Stop and compile
const choreography = recorder.stopRecording();
engine.addSequence(choreography);
```

## 📈 Roadmap

### MVP (Complete)
- [x] Shader choreography uniforms
- [x] Cross-system synchronization
- [x] Basic sequence system
- [x] Beat-locked rotation
- [x] Color progression

### V1.0 (Current)
- [ ] ShaderChoreographer implementation
- [ ] ChoreographyEngine core
- [ ] Sequence library (10+ presets)
- [ ] Rotation pattern library
- [ ] Color journey system
- [ ] Beat sync engine
- [ ] Multi-parameter coordination

### V2.0 (Future)
- [ ] Predictive choreography
- [ ] Fluid dynamics physics
- [ ] Semantic emotion detection
- [ ] Gesture recording
- [ ] Neural network generation

### V3.0+ (Vision)
- [ ] VR/AR integration
- [ ] Multiplayer sync
- [ ] Audio stem separation
- [ ] Haptic feedback
- [ ] Biometric integration

## 🎨 Examples

See `examples/` directory for:
- Basic choreography setup
- Advanced multi-stage sequences
- Cross-system synchronization
- Custom sequence creation
- Gesture recording

## 📚 Documentation

- [API Documentation](docs/API.md)
- [Sequence Format](docs/SEQUENCES.md)
- [Shader Integration](docs/SHADERS.md)
- [Full Choreography Plan](docs/CHOREOGRAPHY_PLAN.md)

## 🤝 Contributing

This is the revolutionary choreography system for VIB34D. Contributions welcome!

## 📄 License

MIT License - See LICENSE file

---

**A Paul Phillips Manifestation**
Send Love, Hate, or Opportunity: Paul@clearseassolutions.com
Join The Exoditical Moral Architecture Movement: Parserator.com
*"The Revolution Will Not be in a Structured Format"*

© 2025 Paul Phillips - Clear Seas Solutions LLC
