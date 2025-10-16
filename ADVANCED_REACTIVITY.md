# 🎛️ Advanced Audio Reactivity System

## Overview

The **Advanced Audio Reactivity System** is a next-generation multi-layer audio-to-visual mapping engine that provides deep, configurable audio reactivity for the VIB34D Choreography Engine.

Unlike simple audio reactivity that just modulates a few parameters, this system creates **intelligent, musical responses** across multiple dimensions of the visualization.

---

## 🎚️ Visualizer Control Bus

The new `VisualizerControlBus` routes every parameter change, gesture, and audio modulation through a shared channel system.

- **Channel Smoothing** – Each parameter defines its own smoothing curve, range, and audio mappings for hyper-musical motion.
- **Macro Capture** – Record live gestures as macros, then loop or blend them into performances without reprogramming.
- **Modulation Stack** – Pointer gestures, onsets, and choreography cues stack as additive modulations so user baselines stay intact.
- **Shared Access** – Quantum, Holographic, and Polychora systems now tap the same control surface to keep colour, geometry, and lighting choreographed together.

### 🎞️ Gesture Macro Recording

The control bus now acts as a **macro sequencer** that can capture pointer motion, touch swipes, scroll bursts, and any control channel in real time. A few highlights:

- **Beat-aware capture** – Every frame stores its elapsed beat so takes can be quantized on stop.
- **Channel & tag filters** – Record only colour channels, only geometry, or a custom set with `{ tags: ['color'] }` or `{ channels: ['hue', 'intensity'] }`.
- **Gesture timeline** – Pointer/touch events are logged alongside parameter frames so macros can redraw choreography, not just values.
- **Playback blending** – Loop macros with weight + blend values and they will merge with live modulations.

```js
// Record a 2-bar pointer solo on colour channels and quantize to 1/4 notes
system.startMacroRecording('colorOrbitSolo', {
  tags: ['color'],
  quantizeBeats: 0.25,
  description: 'Quarter-note ribbon orbit'
});

// ...perform pointer gestures & tweaks...

const macro = system.stopMacroRecording();
console.log('Captured macro duration', macro.duration);

// Play back with a gentle blend and loop it
const playbackId = system.playMacro('colorOrbitSolo', {
  blend: 0.65,
  loop: true
});

// Later, export for sharing or editing
const json = system.exportMacro('colorOrbitSolo');
```

During playback the base system automatically applies pointer gestures to the active visualizer. Custom gesture types (e.g., scroll wheels) can be injected by calling `controlBus.recordGesture(type, payload)` and handled through `BaseSystem.applyMacroGesture` or an override in subclasses.

## 🌟 Key Features

### 1. **7-Band Frequency Analysis**
Instead of just bass/mid/high, the system analyzes **7 distinct frequency bands**:

- **Sub-Bass** (20-60 Hz) - Deep kick drums, sub synths
- **Bass** (60-250 Hz) - Bass guitars, lower kick drums
- **Low-Mid** (250-500 Hz) - Lower vocals, guitars
- **Mid** (500-2000 Hz) - Main vocals, most instruments
- **High-Mid** (2000-4000 Hz) - Upper vocals, snares
- **High** (4000-8000 Hz) - Cymbals, hi-hats
- **Ultra-High** (8000-20000 Hz) - Air, shimmer, presence

Each band drives different visual parameters for rich, nuanced reactivity.

### 2. **Beat-Synced Geometry Cycling**
Geometry automatically cycles through all 8 types based on:
- **Time-based cycling**: Changes every 16 beats (4 measures) by default
- **Onset triggers**: Strong onsets can trigger random geometry jumps
- **Smooth transitions**: Geometry morphs smoothly between types

### 3. **Spectral Color Cycling**
Advanced color modulation system:
- **Hue velocity**: High frequencies accelerate hue rotation
- **Hue acceleration**: Bass frequencies slow/reverse hue
- **Onset jumps**: Strong transients cause hue leaps (60-180°)
- **Saturation from mids**: Vocal/synth energy increases color saturation

### 4. **Palette Director Sequencing**
The new lightweight `PaletteDirector` keeps demo surfaces in sync with the Hypercolor engine even when they are not running the full control bus.

- **Reactive Mode** – Waits for downbeat + transient spikes before rotating to the next palette in the playlist.
- **Interval Mode** – Steps through a curated list every _N_ seconds; perfect for ambient showcases.
- **Tempo Mode** – Divides the beat grid (e.g., every 8 beats) so palettes change on musically aligned phrases.
- **Energy Mode** – Surges to the next palette once RMS energy clears a configurable threshold.
- **Manual Mode** – Locks the current palette and hides the extra controls for focused grading sessions.

Every demo now exposes the playlist, auto-mode buttons, and thresholds so mobile and desktop consoles share the same colour vocabulary.
- **Brightness from RMS**: Overall loudness controls intensity

### 4b. **Scene Director Orchestration**

Palette shifts are only half of the cinematic story. The new lightweight `SceneDirector` sequences entire **visual scenes** across the demo surfaces, blending palette rotations with geometry swaps, baseline parameter curves, and colour grading envelopes.

- **Shared Scene Library** – Curate a list of scene objects that describe palette IDs, geometry indices, baseline parameter values, and vibrance/glitch accents.
- **Reactive Modes** – Drive scene changes from downbeat + transient spikes, beat divisions, pure time intervals, or energy thresholds just like the palette director.
- **Playlist Chips** – Toggle scenes in/out of the rotation with one tap; the director automatically falls back to all scenes if the selection would otherwise be empty.
- **State Application** – Each scene pushes new baseline values into the mobile and desktop consoles (slider positions, geometry chips, vibrance/moiré sliders) so future audio modulation and gestures blend on top of a consistent baseline.
- **Order Controls & Countdown** – Swap between in-order and shuffle rotations, fire manual next/previous triggers, and monitor the upcoming scene and countdown timer directly from the desktop and mobile status bars.
- **Weighted Shuffle & Queues** – Adjust per-scene weights, queue one-off scenes (immediate or delayed by the global minimum duration), and rely on the queue to override automation during special moments.
- **History Ledger** – Both consoles display a timestamped history of automatic and manual scene swaps so you can replay crowd favourites in a single tap.

```js
const sceneDirector = new SceneDirector({
  scenes: sceneLibrary,
  mode: 'reactive',
  intervalSeconds: 56,
  tempoDivision: 32,
  energyThreshold: 0.78,
  minDurationSeconds: 8,
  sceneWeights: {
    'aurora-orbit': 1,
    'neon-surge': 2.5
  }
});

const scene = sceneDirector.update(audioFrame, elapsedSeconds, activeSceneId);
if (scene) {
  applyScene(scene); // update sliders, geometry, palettes, vibrance, and UI
}

sceneDirector.queueScene('ember-throttle', { immediate: true });
```

The Ultimate Reactive console exposes the full scene grid with desktop-friendly cards, while the Mobile Maestro ships a condensed layout optimised for thumb reach. Both surfaces now keep **status readouts** for the active scene and honour manual selections by resetting the director timers.

### 4. **Motion Speed & Direction Modulation**
The visualization's motion responds to audio:
- **Speed boost**: Bass + energy increase animation speed (0.8x to 2.5x)
- **Direction reversal**: Strong sub-bass can reverse motion direction
- **Rotation speed**: Spectral complexity modulates 4D rotation speed
- **Smooth transitions**: All changes smoothed to avoid jarring jumps

### 5. **4D Rotation Audio Mapping**
Each 4D rotation plane responds to different frequencies:
- **XW plane**: Low-mids + bass swing (slow, heavy movements)
- **YW plane**: Mids + spectral centroid (vocal-driven)
- **ZW plane**: Highs + energy spin (fast, energetic)

### 6. **Smoothed Accumulator System**
Three smoothing rates for different response characteristics:
- **Fast** (0.3): Responsive to transients
- **Medium** (0.15): Balanced response
- **Slow** (0.05): Smooth, flowing changes

Accumulators track:
- Bass accumulator (decays slowly for sustained bass response)
- Mid accumulator (balanced decay)
- High accumulator (fast decay for crisp highs)
- Energy accumulator (overall loudness tracking)

---

### 7. **Hypercolor Palette Engine**
Colour is now orchestrated by a dedicated Hypercolor Palette Engine that feeds every visualizer:

- **Curated palette families** – Pastel kawaii, neon rave, deep space bloom, aurora dreams, and cosmic sorbet blends are resampled in CIE L\*a\*b\* space for velvety transitions even during wild jumps.
- **Audio-triggered swaps** – Downbeat spikes and transient bursts can pull in fresh palettes when the energy and chaos envelopes align, keeping long sets from feeling static.
- **Pointer + gesture routing** – Pointer orbit and distance modulate the palette sampler so live gestures bend hue ribbons, shimmer layers, and morph factors together.
- **Shadow-aware shading** – Each palette ships with a depth tone allowing shaders to mix primary, secondary, accent, and shadow channels for cinematic contrast.

The control bus exposes the palette state so Quantum, Holographic, and Polychora canvases stay colour-synced while still expressing their own dynamics.

### 8. **Adaptive Camera & Lighting Rails**
The shared `CameraLightingSystem` now pilots cinematic motion and lighting envelopes across every visualizer:

- **Preset rails** – Orbit Sparkle, Heart Glide, and Bass Drop Zoom define baseline orbit speeds, elevation curves, and dolly ranges tuned for each canvas.
- **Audio-driven motion** – Bass momentum, swing pulses, onset bursts, and colour accents nudge orbit, tilt, zoom, and roll so the framing moves with the groove.
- **Filmic lighting** – Exposure, shutter blur, bloom, key/fill/rim balance, and vignette intensity respond to energy and chaos, delivering tonemapped highlights straight in the shader.
- **Control bus offsets** – New `camera*` and `lighting` channels let macros and live gestures layer additional moves or lighting cues without breaking the audio choreography.
- **Preset morphing** – `transitionCameraPreset()` blends between presets over musical phrases so orbit, dolly, exposure, and rim highlights ease into new moods instead of cutting abruptly.
- **Auto directors** – Each system now evaluates energy, swing, colour ribbons, and dimensional surges every frame to queue cinematic preset swaps (e.g. glide → sparkle → drop) with sensible cooldowns.
- **Depth cinematography** – The shared state now emits focus distance, focus spread, parallax warp, chromatic aberration, colour temperature, fog density, shadow contrast, and godray intensity so each shader renders volumetric haze, bokeh-inspired falloff, and prismatic flares tied to the music.
- **Temperature aware tonemapping** – Light temperature tracks palette orbits and energy to tilt every canvas between icy blue rave lighting and warm sunrise glow while maintaining consistent exposure.
- **Fog + godray choreography** – Bass drops and downbeats bloom volumetric fog and godrays that sweep across Quantum, Holographic, and Polychora canvases in sync with lattice surges and colour ribbons.

- **Cinematic post-FX envelope** – New film grain, lens distortion, frame blending, light wrap, and colour bleed channels sit on the same camera rail so macros or audio bursts can push every canvas from glossy glass-box clarity to hazy anamorphic dreamscapes in perfect sync.

Quantum, Holographic, and Polychora shaders consume these uniforms to render consistent cinematic depth and glow regardless of which system is on screen.

---

## 🎨 Audio-to-Visual Mappings

### Density Reactivity
```
Grid Density = Base + (Bass × 40) + (Low-Mid × 15) + (Onset × 25)
```
- Bass creates dense, complex lattices
- Low-mids add pulse/breathing
- Onsets spike density for impact

### Morph Factor
```
Morph = Base + (Mid × 1.5) + (Spectral Centroid × 0.0002)
```
- Vocals and synths morph geometry
- Higher frequencies = more morphing

### Chaos
```
Chaos = Base + (Energy × 0.6) + (High × 0.4) + (Spread × 0.0001)
```
- Loudness adds randomness
- High frequencies add jitter
- Spectral spread increases complexity

### Speed Modulation
```
Speed = Base × Motion Speed + (Bass × 1.2) + (Energy × 0.8)
```
- Bass boosts animation speed
- Energy drives overall tempo
- Can range from 0.1x to 3.0x

### Color Cycling
```
Hue Velocity += (High × 300) - (Bass × 100)
Hue += Hue Velocity × deltaTime
Saturation = 0.5 + (Mid × 0.4) + (Energy × 0.3)
Brightness = 0.7 + (RMS × 0.6) + (Onset × 0.3)
```
- High frequencies accelerate hue rotation
- Bass decelerates/reverses hue
- Mids control color saturation
- RMS controls brightness

### 4D Rotation Modulation
```
XW = Base + (Low-Mid × 0.3) + (Bass × 0.8) × Direction
YW = Base + (Mid × 0.4) + (Spectral × 0.0001) × Rotation Speed
ZW = Base + (High × 0.6) + (Energy × 0.5) × Rotation Speed
```
- Each plane responds to different frequency ranges
- Direction and rotation speed modulated by audio

---

## 💾 Reactivity Presets

### Balanced (Default)
Works well for most music genres. Moderate reactivity across all parameters.
- **Best for**: Pop, rock, electronic, general use

### Heavy
Maximum impact on bass and sub-bass frequencies. Intense, powerful reactivity.
- **Bass multiplier**: 2x (80 vs 40)
- **Onset multiplier**: 2x (50 vs 25)
- **Speed boost**: 2x (2.0 vs 1.2)
- **Best for**: EDM, dubstep, metal, heavy bass music

### Subtle
Gentle, smooth reactivity. Minimal sudden changes.
- **All multipliers**: 0.5x
- **Smooth transitions**: Extra slow smoothing
- **Best for**: Ambient, classical, jazz, chill music

### Chaotic
Wild, unpredictable reactivity. Maximum chaos and randomness.
- **Chaos multiplier**: 2.5x (1.5 vs 0.6)
- **Hue multiplier**: 2x (400 vs 200)
- **Random geometry jumps**: More frequent
- **Best for**: Experimental, glitch, breakcore

### Smooth
Slow, flowing reactivity. Emphasizes smooth motion over impact.
- **Slower smoothing**: 0.6x on all smoothing factors
- **Reduced onset response**: 0.6x (15 vs 25)
- **Best for**: Downtempo, lo-fi, meditative music

### Explosive
Maximum impact on peaks and drops. Extreme reactivity.
- **All multipliers**: 2.5x
- **Density spike**: 100 (vs 40)
- **Hue jump**: 500 (vs 200)
- **Best for**: Bass drops, build-ups, dramatic moments

---

## 🎛️ Modern UI Design

### Panel Organization
The UI is organized into collapsible sections:

1. **🎵 Audio Input**
   - File loader
   - Play/pause controls
   - Frequency spectrum visualizer (real-time waveform)
   - 7-band level meters with bars

2. **⚡ Reactivity State**
   - Current geometry type
   - Motion speed multiplier
   - Current hue value
   - Motion direction (forward/backward)

3. **🎨 Visualizer System**
   - Quantum / Faceted / Holographic selector
   - System switching preserves parameters

4. **🎛️ Base Parameters**
   - Intensity, Density, Morph, Chaos, Speed, Hue
   - These are the BASE values before reactivity is applied
   - Sliders update in real-time

5. **🔀 Reactivity Layers**
   - Toggle switches to enable/disable each layer:
     - Density reactivity
     - Color cycling
     - Geometry cycling
     - Motion modulation
     - 4D rotation modulation

6. **🎬 Choreography**
   - Start/stop engine
   - BPM control (60-200)
   - Rotation pattern selector

7. **💾 Reactivity Presets**
   - 6 preset buttons
   - Balanced, Heavy, Subtle, Chaotic, Smooth, Explosive
   - Click to instantly apply preset

### Visual Feedback

**Frequency Spectrum Visualizer**
- Real-time waveform display
- Color gradient from cyan → green → yellow
- Smooth decay for visual persistence

**7-Band Level Meters**
- Vertical bars showing each band's level
- Color gradient: cyan → green → yellow
- Percentage display below each bar
- Updates 60 times per second

**Reactivity State Display**
- 4 live-updating values in a grid
- Geometry index (0-7)
- Speed multiplier (e.g., "1.45x")
- Current hue (e.g., "247°")
- Direction indicator (→ or ←)

**FPS Counter**
- Real-time frame rate display
- Updates every second
- Shows rendering performance

---

## 🔧 Technical Architecture

### AudioReactivityEngine Class

**Core Methods:**

```javascript
update(audioData, beatInfo, deltaTime)
```
Called every frame with fresh audio analysis. Updates all internal state.

```javascript
getReactiveParameters(baseParams)
```
Returns fully reactive parameters by applying mappings to base parameters.

```javascript
getState()
```
Returns current reactivity state for UI display.

```javascript
updateMapping(category, param, key, value)
```
Dynamically update mapping configurations.

**Internal State:**

- `bands`: 7 frequency band levels (0-1)
- `features`: RMS, energy, onset, spectral data
- `smoothed`: Accumulated/smoothed values
- `beatState`: Beat counting and phase
- `geometryState`: Current/target geometry and transition
- `colorState`: Hue, hue velocity, saturation, brightness
- `motionState`: Speed, direction, rotation speed
- `mappings`: All audio-to-visual mapping configurations

### Integration with Choreography Engine

The AudioReactivityEngine sits **alongside** the ChoreographyEngine, not inside it:

```
AudioAnalyzer → AudioReactivityEngine → Reactive Parameters
                        ↓
ChoreographyEngine → Choreographed Rotations
                        ↓
                   Visualizer
```

This separation allows:
- **Independent control**: Choreography and reactivity don't interfere
- **Toggle layers**: Can enable/disable reactivity per-parameter
- **Presets**: Can swap entire reactivity profiles
- **Base parameters**: User sets base, reactivity adds to it

### Render Loop Flow

```javascript
1. Get audio data from AudioAnalyzer
2. Update AudioReactivityEngine with audio + beat info
3. Get reactive parameters from engine
4. Apply based on toggle states
5. Update visualizer with final parameters
6. Update UI displays
7. Render frame
8. requestAnimationFrame
```

---

## 🎵 Musical Response Examples

### Example 1: Bass Drop
**Input Audio:**
- Sub-bass: 0.9 (very high)
- Bass: 0.85
- Onset: 0.95 (strong transient)

**System Response:**
- **Density**: Spikes from 20 → 60 instantly
- **Hue**: Jumps 120° in random direction
- **Speed**: Boosts to 2.3x
- **Geometry**: 30% chance of random geometry switch
- **Direction**: 45% chance of motion reversal
- **Chaos**: Increases to 0.8

### Example 2: Vocal Melody (Mid-Heavy)
**Input Audio:**
- Mid: 0.7
- High-Mid: 0.6
- Spectral Centroid: 1500 Hz

**System Response:**
- **Morph**: Smoothly increases to 2.0
- **Saturation**: Rises to 0.85
- **4D YW Rotation**: Modulates with vocal melody
- **Hue Velocity**: Slow drift
- **Chaos**: Stays low (0.3)

### Example 3: Hi-Hat Roll (High-Heavy)
**Input Audio:**
- High: 0.8
- Ultra-High: 0.75
- Onset: 0.6 (rapid transients)

**System Response:**
- **Hue**: Rapidly cycles through spectrum
- **4D ZW Rotation**: Fast spinning
- **Chaos**: Increases to 0.6
- **Density**: Minor pulses
- **Brightness**: High (1.4)

---

## 🚀 Usage Guide

### Getting Started

1. **Load the demo**: Open `examples/advanced-reactive.html`
2. **Load audio**: Click "📁 Load Audio File" and select your track
3. **Click Play**: Press "▶️ Play" to start audio
4. **Watch the magic**: The visualization will automatically react to your music

### Customizing Reactivity

**Try Different Presets:**
- Start with **Balanced**
- For heavy music, try **Heavy** or **Explosive**
- For calm music, try **Subtle** or **Smooth**
- For experimentation, try **Chaotic**

**Fine-Tune Base Parameters:**
- Adjust **Base Density** to set overall complexity
- Adjust **Base Hue** to shift color palette
- Adjust **Base Speed** to control overall tempo
- Other parameters set starting points for reactivity

**Toggle Layers On/Off:**
- Disable **Geometry Cycling** to keep one geometry
- Disable **Color Cycling** for static colors
- Disable **Motion Modulation** for constant speed
- Disable **4D Rotation Mod** for simpler rotation

### Advanced Customization

For developers who want to modify mappings:

```javascript
// Increase bass impact on density
reactivityEngine.updateMapping('density', 'bassBass', 'multiplier', 60);

// Change hue cycling speed
reactivityEngine.updateMapping('hue', 'high', 'multiplier', 300);

// Modify smoothing rate
reactivityEngine.smoothing.fast = 0.5;
```

---

## 📊 Performance

- **60 FPS** rendering on modern hardware
- **7-band FFT analysis** every frame
- **Smooth animations** with triple-rate smoothing system
- **Zero latency** audio-to-visual mapping
- **Efficient**: All calculations optimized for real-time performance

---

## 🎯 Design Philosophy

### Musical Intelligence
The system is designed to **understand music**, not just react to it:
- Bass drops should be **dramatic** (explosive preset)
- Ambient music should **flow** (subtle preset)
- Vocals should **morph geometry** (mid-frequency mapping)
- Percussion should **pulse density** (onset spike mapping)

### Layered Approach
Multiple independent layers create rich, complex visuals:
- **Choreography layer**: Scripted sequences and patterns
- **Reactivity layer**: Audio-driven modulation
- **Base parameters**: User-controlled foundations

### User Control
Users should feel **empowered**, not overwhelmed:
- **Presets** for instant results
- **Toggles** for granular control
- **Base parameters** for fine-tuning
- **Visual feedback** for understanding what's happening

### Musicality First
Every mapping is designed to **enhance musical experience**:
- Bass should feel **heavy**
- Highs should feel **bright**
- Vocals should feel **expressive**
- Drops should feel **explosive**

---

## 🔮 Future Enhancements

Potential additions to the system:

1. **Custom Mapping Editor**
   - Visual mapping curve editor
   - Save/load custom presets
   - Per-band multiplier controls

2. **Beat Detection Integration**
   - Automatic BPM detection
   - Downbeat detection
   - Measure-aware geometry changes

3. **ML-Based Reactivity**
   - Train on different music genres
   - Automatic preset selection
   - Predictive reactivity

4. **MIDI Integration**
   - Map MIDI controllers to parameters
   - Live performance mode
   - Real-time preset switching

5. **Advanced Spectral Analysis**
   - Harmonic/percussive separation
   - Chord detection
   - Genre classification

---

## 📁 File Structure

```
src/audio/
├── AudioReactivityEngine.js    (400+ lines) - Core reactivity engine
├── ReactivityPresets.js         (300+ lines) - Preset configurations
└── AudioAnalyzer.js             (existing)   - Raw audio analysis

examples/
└── advanced-reactive.html       (1000+ lines) - Full demo with UI

ADVANCED_REACTIVITY.md          (this file)   - Documentation
```

---

## 🌟 A Paul Phillips Manifestation

**Send Love, Hate, or Opportunity to:** Paul@clearseassolutions.com
**Join The Exoditical Moral Architecture Movement today:** [Parserator.com](https://parserator.com)

> *"The Revolution Will Not be in a Structured Format"*

---

**© 2025 Paul Phillips - Clear Seas Solutions LLC**
**All Rights Reserved - Proprietary Technology**
