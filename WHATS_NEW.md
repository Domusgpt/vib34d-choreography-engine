# 🎉 What's New in VIB34D Choreography Engine

## Latest Update: Advanced Audio Reactivity System

### 🌟 NEW PRIMARY DEMO: Advanced Reactive

**Launch it here:** [examples/advanced-reactive.html](examples/advanced-reactive.html)

---

## 🎛️ What Makes It Advanced?

### 1. **7-Band Frequency Analysis** (vs. 3-band before)
Instead of just bass/mid/high, you now get:
- Sub-Bass (20-60 Hz)
- Bass (60-250 Hz)
- Low-Mid (250-500 Hz)
- Mid (500-2000 Hz)
- High-Mid (2000-4000 Hz)
- High (4000-8000 Hz)
- Ultra-High (8000-20000 Hz)

Each band independently drives different visual parameters!

### 2. **Beat-Synced Geometry Cycling**
Your geometry now **automatically changes** with the music:
- Cycles through all 8 geometry types
- Changes every 16 beats (4 measures) by default
- Strong bass drops can trigger random geometry jumps
- Smooth morphing transitions between types

### 3. **Spectral Color Cycling Engine**
Colors now have **physics**:
- **Hue Velocity**: High frequencies accelerate color rotation
- **Hue Acceleration**: Bass frequencies slow or reverse colors
- **Onset Jumps**: Strong transients leap 60-180° instantly
- **Saturation from Mids**: Vocals increase color richness
- **Brightness from RMS**: Loudness controls intensity

### 4. **Motion Speed & Direction Modulation**
The visualization **moves with the music**:
- Speed boosts from bass + energy (0.8x to 2.5x)
- Direction can **reverse** on heavy sub-bass hits
- Rotation speed modulated by spectral complexity
- All smoothed for natural feel

### 5. **4D Rotation Audio Mapping**
Each hyperspace rotation plane responds to different frequencies:
- **XW**: Low-mids + bass (heavy, slow movements)
- **YW**: Mids + spectral centroid (vocal-driven)
- **ZW**: Highs + energy (fast, energetic spins)

### 6. **6 Reactivity Presets**
Instant reactivity profiles for different music:
- **Balanced**: Works for most music (default)
- **Heavy**: Maximum bass impact (EDM, metal)
- **Subtle**: Gentle, smooth (ambient, classical)
- **Chaotic**: Wild unpredictability (experimental)
- **Smooth**: Flowing motion (downtempo, lo-fi)
- **Explosive**: Extreme peaks (bass drops, build-ups)

### 7. **Cinematic Camera & Lighting Rails**
- A new `CameraLightingSystem` keeps orbit, elevation, dolly, and roll synced with bass momentum, swing pulses, and onset bursts.
- Exposure, shutter, bloom, key, rim, and ambient light uniforms now flow directly into every shader for tonemapped glow without post-processing.
- Control bus channels (`cameraOrbit`, `cameraElevation`, `exposure`, etc.) let macros or live gestures stack additional moves atop the audio choreography.
- Fresh `transitionCameraPreset()` easing blends plus system-specific “auto directors” swap presets (Heart Glide ↔ Orbit Sparkle ↔ Bass Drop Zoom) whenever energy, swing, or dimensional surges demand a new cinematic mood.

---

## 🎨 New Modern UI

### Real-Time Visualizations
- **Frequency Spectrum Canvas**: Live waveform display
- **7-Band Level Meters**: Vertical bars showing each frequency band
- **Reactivity State Display**: Live geometry/speed/hue/direction values
- **FPS Counter**: Performance monitoring

### Collapsible Panel Sections
- Clean, organized interface
- Expand/collapse sections as needed
- Smooth animations

### Toggle Switches
Turn individual reactivity layers on/off:
- ✓ Density Reactivity
- ✓ Color Cycling
- ✓ Geometry Cycling
- ✓ Motion Modulation
- ✓ 4D Rotation Modulation

### Base Parameter Controls
Set the **foundation** before reactivity is applied:
- Intensity
- Base Density
- Base Morph
- Base Chaos
- Base Speed
- Base Hue

---

## 📊 How It Works

### The Layered Approach

```
1. BASE PARAMETERS (user sets these)
   ↓
2. AUDIO REACTIVITY LAYER (engine adds this)
   ↓
3. CHOREOGRAPHY LAYER (engine adds this)
   ↓
4. FINAL VISUALIZATION
```

**Example:**
- User sets Base Density = 20
- Bass hits at 0.8 level → Adds +32 density
- Final density = 52 (complex, pulsing geometry)

### Musical Intelligence

The system **understands** music:

**Bass Drop:**
- Density spikes instantly
- Hue jumps dramatically
- Speed boosts 2x
- Possible geometry switch
- Possible motion reversal

**Vocal Melody:**
- Morph factor increases
- Saturation rises
- YW rotation follows melody
- Smooth hue drift

**Hi-Hat Roll:**
- Hue rapidly cycles
- ZW rotation spins fast
- Chaos increases
- Brightness peaks

---

## 🚀 Quick Start

1. **Open** [examples/advanced-reactive.html](examples/advanced-reactive.html)
2. **Load** your audio file
3. **Press Play** ▶️
4. **Try presets** - Click "Heavy" for bass music or "Subtle" for calm music
5. **Toggle layers** - Turn reactivity on/off per parameter
6. **Adjust base** - Fine-tune starting values

---

## 🎯 Comparison: Old vs. New

### Old System (ultimate-controls.html)
- ✓ 3-band audio (bass/mid/high)
- ✓ Manual parameter sliders
- ✓ Manual geometry selection
- ✓ Static color controls
- ✗ No automatic geometry cycling
- ✗ No color physics
- ✗ No motion modulation
- ✗ No presets

### New System (advanced-reactive.html)
- ✓ **7-band audio** (sub-bass to ultra-high)
- ✓ **Base parameter sliders**
- ✓ **Automatic geometry cycling**
- ✓ **Color cycling engine**
- ✓ **Motion speed/direction modulation**
- ✓ **4D rotation audio mapping**
- ✓ **6 reactivity presets**
- ✓ **Live frequency visualizer**
- ✓ **Reactivity layer toggles**
- ✓ **Real-time state display**

---

## 💡 Use Cases

### For Music Visualization
- **DJs**: Load your set, try "Heavy" preset
- **Producers**: Visualize your track's frequency balance
- **Listeners**: Experience music in 4D space

### For Live Performance
- Load audio, hit play, project to screen
- Switch presets between songs
- Toggle layers for different visual styles

### For Development
- Use as reference for audio-reactive systems
- Study the mapping formulas
- Customize presets for your use case

---

## 📁 New Files

```
src/audio/
├── AudioReactivityEngine.js    - Core reactivity engine (400+ lines)
└── ReactivityPresets.js         - 6 preset configurations (300+ lines)

examples/
└── advanced-reactive.html       - Full demo with UI (1000+ lines)

ADVANCED_REACTIVITY.md          - Technical documentation
WHATS_NEW.md                    - This file
```

---

## 🔗 Demo Index

Visit [examples/INDEX.html](examples/INDEX.html) to see all 7 demos:

1. **🌟 Advanced Reactive** (NEW - Primary)
2. Ultimate Controls
3. Enhanced Visualizers
4. Real Visualizers
5. Debug Visualizer
6. Audio Test
7. Basic Choreography

---

## 🎵 Example Settings by Genre

### EDM / Dubstep
- **Preset**: Heavy or Explosive
- **Base Density**: 25
- **Base Speed**: 1.2
- **Toggle All**: On

### Ambient / Chill
- **Preset**: Subtle or Smooth
- **Base Density**: 15
- **Base Speed**: 0.8
- **Toggle Geometry**: Off (pick one you like)

### Rock / Metal
- **Preset**: Heavy
- **Base Density**: 30
- **Base Chaos**: 0.3
- **Toggle All**: On

### Classical / Jazz
- **Preset**: Subtle
- **Base Density**: 20
- **Base Morph**: 1.5
- **Toggle Motion**: Off

### Experimental / Glitch
- **Preset**: Chaotic
- **Base Chaos**: 0.4
- **Base Speed**: 1.5
- **Watch it go wild!**

---

## 🌟 A Paul Phillips Manifestation

This system represents a **new paradigm** in audio-reactive visualization:
- Not just "louder = bigger"
- Not just "bass = shake"
- But **intelligent, musical responses** across multiple dimensions

Every frequency band, every spectral feature, every transient is **meaningfully mapped** to visual parameters that enhance the musical experience.

**Send Love, Hate, or Opportunity to:** Paul@clearseassolutions.com
**Join The Exoditical Moral Architecture Movement today:** [Parserator.com](https://parserator.com)

> *"The Revolution Will Not be in a Structured Format"*

---

**© 2025 Paul Phillips - Clear Seas Solutions LLC**
**All Rights Reserved - Proprietary Technology**
