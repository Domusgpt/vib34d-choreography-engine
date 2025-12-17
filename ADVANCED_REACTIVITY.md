# 🎛️ Advanced Audio Reactivity System

## Overview

The **Advanced Audio Reactivity System** is a next-generation multi-layer audio-to-visual mapping engine that provides deep, configurable audio reactivity for the VIB34D Choreography Engine.

Unlike simple audio reactivity that just modulates a few parameters, this system creates **intelligent, musical responses** across multiple dimensions of the visualization.

All reference demos now ship with **real input paths** out of the box. You can feed the analyzer with:
- **Live microphone** capture for in-room testing without assets.
- A **procedural demo beat** that drives the analyzer with actual oscillators (no mock data) when you just need instant movement.
- The existing **file loader**, which now runs through a properly configured `AnalyserNode` for true 7-band data.

The status banners in both Ultimate and Mobile surfaces show which path is active (file, mic, or demo), so you never unknowingly fall back to mock values.

New **input calibration + health badges** sit alongside these paths. `calibrateAudioFrame` boosts or gates incoming band data before it reaches the Behavior Sweep Engine, while `computeSignalHealth` powers RMS/peak meters, coverage dots, and gain hints so users can quickly nudge levels out of silence or clipping.

Fresh **tone followers** expose the engine's `{ bass, mid, air }` spectral bias directly to UI surfaces: each console ships with a Tone toggle plus influence slider so you can lean visuals toward sub-heavy warmth, mid presence, or air/shimmer without touching JSON.

### Canvas layer orchestration
`CanvasLayerManager` (at `src/visualizers/shared/CanvasLayerManager.js`) owns a single stack of five layered canvases (background, shadow, content, highlight, accent) and rebuilds the visualizers on top of those elements whenever the system toggle changes. That guarantees only one five-layer set is live at a time, automatically destroys the previous visualizer instances, and keeps sizing in sync with the viewport without scattering canvas setup code throughout the demos.

For testing and hosted-environment resilience, the manager accepts an optional `visualizerFactory` map and `layerTemplate` override so harnesses (or constrained hosts) can inject stub visualizers or start directly on the single-layer fallback. The new Jest smoke test uses this hook to assert layer creation, parameter propagation, and fallback behavior without a real GPU context.

The manager now caches every parameter sent through `updateParameter`/`updateParameters` so a context-loss rebuild or manual reset can immediately rehydrate the visualizers with the prior state (geometry, baseline params, and live reactivity). The Mobile Smart and Final Ultimate demos expose a `Reset Stack` button plus cached/rebuild counters in their status bars; the button simply calls `forceRebuild` on the shared manager, which tears down and respawns the five canvases before replaying the cached values. Call `seedParameters` right after constructing the manager to prime it with your base parameters.

---

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
- **Brightness from RMS**: Overall loudness controls intensity

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

## Layered Canvas Health Checks

- `CanvasLayerManager` now prunes stray `.viz-layer` elements, resets WebGL contexts between system swaps, and rebuilds the five-layer stack before rehydrating any visualizer type.
- Ultimate and Mobile Smart demos surface the stack state (idle/partial/ready) via a status pill so testers can confirm the active system has working contexts after toggling visualizers.
- WebGL context-loss events on any layer now trigger an automatic stack rebuild and a state refresh so testers can recover a blank render without manually refreshing the page.
- If a host blocks multiple concurrent WebGL contexts (e.g., some GitHub Pages mobile sessions), the manager automatically falls back to a single-layer canvas, shows a warning ribbon, and keeps retrying or honoring the tester’s "Retry" click until at least one visualizer is healthy.

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
