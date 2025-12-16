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

**🔴 LIVE DEMO**: https://domusgpt.github.io/vib34d-choreography-engine/

**🎚️ ENHANCED VERSION** (Recommended): Real-time threshold controls, audio level monitoring, instant parameter adjustment

**📱 BEST LOCAL DEMO**: Serve the repo root and open `examples/mobile-smart.html` for the latest calibrated, LLM-ready console.

**📚 [TUNING GUIDE](TUNING_GUIDE.md)**: Complete guide to optimizing for your music genre

```bash
# Clone repository
git clone https://github.com/Domusgpt/vib34d-choreography-engine.git
cd vib34d-choreography-engine

# Run local server
npx serve
# or
python3 -m http.server 8080

# Open http://localhost:8080/examples/real-visualizers.html

# Automated checks (smoke)
npm test
npm run build
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
│   │   ├── quantum/
│   │   │   ├── QuantumVisualizer.js       # 970 lines, 8 geometries, 5-layer color
│   │   │   ├── QuantumSystem.js           # System integration
│   │   │   └── QuantumEngine.js           # Physics engine
│   │   ├── faceted/
│   │   │   ├── FacetedVisualizer.js       # 714 lines, faceted geometry
│   │   │   └── FacetedSystem.js           # System integration
│   │   ├── holographic/
│   │   │   ├── HolographicVisualizer.js   # 964 lines, volumetric effects
│   │   │   └── HolographicSystem.js       # System integration
│   │   ├── polychora/
│   │   │   ├── PolychoraVisualizer.js     # Polychora geometry
│   │   │   └── Polychora4DPhysics.js      # 4D physics
│   │   └── shared/
│   │       ├── BaseVisualizer.js          # Base visualizer class
│   │       └── SystemRegistry.js          # System registry
│   └── utils/
│       ├── PhysicsEngine.js               # Fluid dynamics
│       └── EmotionDetector.js             # Semantic colors
├── shaders/
│   ├── quantum-enhanced.frag              # Quantum with choreography
│   ├── faceted-enhanced.frag              # Faceted with choreography
│   └── holographic-enhanced.frag          # Holographic with choreography
├── examples/
│   ├── real-visualizers.html              # 🔴 ACTUAL VIB34D visualizers
│   ├── basic-choreography.html            # Simplified 2D demo
│   ├── advanced-sequences.html            # Complex choreography (coming soon)
│   └── cross-system-sync.html             # Multi-visualizer (coming soon)
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

### V1.0 (Current - Deployed)
- [x] ChoreographyEngine core (timeline-based sequences)
- [x] ShaderChoreographer implementation
- [x] RotationChoreographer (8 patterns)
- [x] Sequence library (5 bass drop presets)
- [x] Beat sync engine
- [x] ACTUAL VIB34D visualizers integrated:
  - [x] QuantumHolographicVisualizer (970 lines)
  - [x] IntegratedHolographicVisualizer (714 lines)
  - [x] HolographicVisualizer (964 lines)
- [x] AudioAnalyzer integration (7-band frequency)
- [x] GeometryLibrary (hypercube, hypersphere, torus, Klein bottle, etc.)
- [x] Live demo with audio file upload
- [x] System switching (Quantum ↔ Faceted ↔ Holographic)
- [x] Real-time beat/sequence/onset logging

### V1.1 (Next)
- [ ] ColorChoreographer implementation
- [ ] GeometryChoreographer (geometric metamorphosis)
- [ ] More sequence presets (EDM, dubstep, ambient)
- [ ] Sequence trigger refinement
- [ ] Performance optimization

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

### 🎚️ Enhanced Demo: `examples/enhanced-visualizers.html` ⭐ RECOMMENDED
**🔴 [Try it now](https://domusgpt.github.io/vib34d-choreography-engine/)**

Advanced features:
- 🎚️ **Real-time Controls**: Adjust onset/bass thresholds while music plays
- 📊 **Live Audio Monitoring**: See bass/mid/high/energy/onset levels in real-time
- 🎛️ **Parameter Sliders**: Intensity (0.3-1.5), Grid Density (10-50)
- 🎨 **3 VIB34D Visualizers**: Quantum, Faceted, Holographic (actual WebGL systems)
- 🎵 **Audio Upload**: Load your own music files
- 🌀 **8 Rotation Patterns**: smooth, hyperspace_spiral, beat_locked, bass_momentum, spectral_orbit, energy_sweep, chaos_spin, onset_snap
- 💥 **5 Bass Drop Sequences**: cascade, explosion, freeze, spiral, pulse
- 🎬 **Advanced Controls**: Start/stop, clear sequences, manual triggers
- 📋 **Live Logging**: Beat detection, sequence execution, onset detection
- 🔄 **Instant Switching**: Change visualizers on the fly

### Basic Demo: `examples/real-visualizers.html`
Full-featured demo without advanced controls

### Debug Console: `examples/debug-visualizer.html`
Technical diagnostics and error detection

## 📚 Documentation

- **[🎚️ Tuning Guide](TUNING_GUIDE.md)** - How to optimize for your music genre
- [Getting Started](docs/GETTING_STARTED.md) - Quick integration guide
- [Deployment Info](DEPLOYMENT.md) - Live demo and technical details
- [Full Choreography Plan](docs/CHOREOGRAPHY_PLAN.md) - Complete vision and roadmap

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
