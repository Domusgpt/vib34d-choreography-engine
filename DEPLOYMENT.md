# 🚀 Deployment Information

## Live Demo

**GitHub Pages URL**: https://domusgpt.github.io/vib34d-choreography-engine/

The site automatically redirects to the working demo at:
https://domusgpt.github.io/vib34d-choreography-engine/examples/real-visualizers.html

## Repository

**GitHub Repo**: https://github.com/Domusgpt/vib34d-choreography-engine

## GitHub Pages Configuration

GitHub Pages can publish either the `main` branch or any feature branch directly from the repository root. To confirm that the current pull request branch deploys correctly from the root of the project:

1. Open the repository settings and navigate to **Pages → Build and deployment**.
2. Change **Source** to **Deploy from a branch**.
3. Select the working branch for this pull request (for example `work`) and set **Folder** to **/ (root)**.
4. Save the configuration and wait for the deployment banner to show "GitHub Pages is deploying".
5. Visit `https://<username>.github.io/vib34d-choreography-engine/` once the deploy completes and ensure it redirects to the Demo Atlas at `/examples/INDEX.html`.
6. Validate at least one visualizer (e.g., `examples/properly-reactive.html`) to confirm the build assets resolve under the branch deployment.

After merging, switch the configuration back to the production branch (usually `main`) to keep the live site in sync.

## What's Deployed

✅ **ChoreographyEngine** - Complete timeline-based sequence system
✅ **ShaderChoreographer** - GPU-level parameter control
✅ **RotationChoreographer** - 8 rotation patterns
✅ **Sequence Library** - 5 bass drop presets
✅ **Working Demo** - Interactive 4D visualization
✅ **Full Documentation** - Getting started + roadmap

## Demo Features

When you visit the live demo, you can:

1. **Start/Stop** - Control the choreography engine
2. **Switch Rotation Patterns** - Try 8 different patterns:
   - `smooth` - Continuous rotation
   - `hyperspace_spiral` - Multi-plane spirals
   - `beat_locked` - Quantized to beats
   - `bass_momentum` - Accumulates from bass
   - `spectral_orbit` - Frequency-based
   - `energy_sweep` - Energy-driven
   - `chaos_spin` - Unpredictable
   - `onset_snap` - Sudden changes

3. **Trigger Sequences** - Manually launch choreography:
   - `bass_drop_cascade` - Anticipation → Impact → Release
   - `bass_drop_explosion` - Explosive chaos
   - `bass_drop_freeze` - Freeze then release
   - `bass_drop_spiral` - Spiraling descent
   - `bass_drop_pulse` - Rhythmic pulsing

4. **Watch Live Logs** - See beat detection, sequences, and onsets in real-time

## Technical Details

- **Framework**: Pure JavaScript ES6 modules
- **Graphics**: HTML5 Canvas 2D (demo uses simplified visualization)
- **Audio**: Mock audio data (no actual audio input in demo)
- **Performance**: 60fps on modern browsers
- **Compatibility**: Chrome, Firefox, Safari, Edge

## Local Development

```bash
# Clone repository
git clone https://github.com/Domusgpt/vib34d-choreography-engine.git
cd vib34d-choreography-engine

# Serve locally
npx serve
# or
python3 -m http.server 8080

# Open http://localhost:8080/examples/basic-choreography.html
```

## Integration with Real Visualizers

The demo uses a simplified 2D visualization. To integrate with real VIB34D visualizers:

```javascript
import { ChoreographyEngine } from './src/core/ChoreographyEngine.js';
import { QuantumVisualizer } from './your-visualizers/QuantumVisualizer.js';

const quantumViz = new QuantumVisualizer('canvas1', 'content', 1.0, 0);

const engine = new ChoreographyEngine({
    visualizers: [quantumViz],
    audioAnalyzer: yourAudioAnalyzer,
    bpm: 128
});

await engine.loadSequenceLibrary('./src/sequences/presets/bass-drops.json');
engine.start();
```

## Deployment History

- **2025-10-11**: Initial deployment
  - ChoreographyEngine v1.0
  - 8 rotation patterns
  - 5 preset sequences
  - Working demo

## Status

🟢 **LIVE** - GitHub Pages deployment successful

Build time: ~34 seconds
Last deploy: 2025-10-11 20:23 UTC

---

**A Paul Phillips Manifestation**
Send Love, Hate, or Opportunity: Paul@clearseassolutions.com
Join The Exoditical Moral Architecture Movement: Parserator.com

© 2025 Paul Phillips - Clear Seas Solutions LLC
