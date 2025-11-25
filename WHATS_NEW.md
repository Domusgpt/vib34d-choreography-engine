# 🎉 What's New in VIB34D Choreography Engine

## Latest Update: Behavioral Console Refactor

### 🎭 Behavior Suite for motion + colour
- Added Drift, Bloom, and Pulse behavior modes with bias sliders so you can favour motion or colour swings without touching individual sliders.
- Refactored the render loop to drive density, morph, chaos, speed, rotation, hue, vibrance, and glitch from the selected behavior, smoothing transitions to keep visuals readable.

### 🎨 Fresh restrained palettes
- Introduced Obsidian Film, Nordic Dawn, and Sepia Glass uniform palettes for tighter two-to-three-tone journeys alongside the existing sets.
- Extended the uniform palette library so Quantum, Holographic, Faceted, and Polychora all inherit the new restrained swatches automatically.

## Latest Update: Dynamics Lab Console

### 🎚️ Pro console with motion and colour clamps
- Added [`examples/ultimate-reactive-pro.html`](examples/ultimate-reactive-pro.html) to keep the standard console intact while exposing a dedicated Dynamics Lab tab for motion floors/ceilings, colour clamps, and burst gain controls.
- The lab ships with toggles for onset-driven glitching, palette bursts, and a speed brake so mobile and desktop operators can throttle or unleash modulation without reloading the page.

### 🎨 Expanded uniform palettes
- Introduced Indigo Drift, Emerald Still, and Copper Pulse uniform palettes so operators can lean on tight two-to-three-tone journeys instead of rainbow sweeps.
- Palette quick-picks and the playlist director both recognise the new swatches, making them available across desktop and mobile consoles.

## Latest Update: Calmer Defaults + Mobile-Ready Controls

### 🧭 Smoother defaults for every visualizer
- Lowered the base speed, chaos, and morph values across the Ultimate console so the first render is cinematic instead of frantic, while keeping reactive boosts intact when the music swells.
- Softened hue swings and rotation multipliers to prioritise readable motion and let palette choices breathe before reactive peaks kick in.

### 🎨 New restrained colour journeys
- Added Glacier Mono, Amber Drift, Sakura Veil, and Verdant Pulse uniform palettes so operators can stay inside tight two-to-three-tone ranges instead of the legacy rainbow blends.
- Swapped the default palette style to Uniform and pointed the starter profile at the new sets, while keeping Hypercolor available as a quick style toggle.

### 📱 Mobile scrolling that actually reaches thresholds
- Gave the control deck a measured max-height, min-height, and live resize observer so every tab scrolls smoothly on small screens without clipping the deeper threshold sliders.
- Propagated the calculated height into CSS variables so the bottom sheet respects safe areas and the canvas stays visible while controls glide.

## Latest Update: Unified Ultimate Console

### 🖥️ Desktop and mobile share one super console
- Rebuilt [`examples/ultimate-reactive.html`](examples/ultimate-reactive.html) with a unified layout so the desktop control deck and Mobile Maestro experience now live in one responsive surface.
- Added a seven-band transport HUD with live timeline, BPM/beat counters, and track status badges so you can confirm real audio is flowing without leaving the canvas.
- Introduced palette quick picks, hypercolor/uniform style pills, and synchronized playlist chips so colour journeys swap instantly on both wide and small screens.
- Extracted the console logic into [`examples/js/ultimateConsole.js`](examples/js/ultimateConsole.js) so any HTML wrapper can mount the same experience programmatically.

### 🎛️ Reactivity meter + per-channel overrides
- Dropped a global reactivity slider with density/morph/chaos/rotation/colour/vibrance/glitch toggles so you can blend base parameters with choreography on demand.
- Mapped the new controls to the Quantum, Holographic, and Faceted engines so turning off a channel falls back to slider baselines instead of killing the visualizer.

### 📱 Mobile Maestro launches the shared deck
- [`examples/mobile-smart.html`](examples/mobile-smart.html) now imports the shared console module and boots straight into the bottom-sheet layout for phones and tablets.
- Updated the Demo Atlas to flag the new workflow so teams follow the Ultimate Reactive entry for day-to-day testing.

### 📐 Layout polish + adaptive canvas
- Added an on-header layout pill plus automatic mobile/desktop collapsing so the shared console keeps key controls visible without overwhelming the viewport.
- Resized the main canvas on every viewport change to preserve full-screen coverage and crisp rendering on high-DPI devices.

## Latest Update: Hypercolor + Uniform Controls Everywhere

### 🌈 Holographic + Faceted join the palette party
- Added the same **Hypercolor ↔ Uniform** palette toggle that debuted in Quantum to both the Holographic and Faceted visualizers.
- Each system now honours the shared colour playlists, vibrance slider, and palette director events so scene changes never desynchronise the trio.

### 🔊 Audio choreography stays in command
- Reworked the colour pipelines so live audio metadata always modulates density, vibrance, and accent pulses even when uniform palettes are active.
- Guarded the control bus to let palette selections override default gradients without muting bass/mid/high reactions or onset-driven bursts.

### 🕹️ Console controls stay consistent
- Ultimate Reactive and Mobile Maestro automatically expose the colour style/profile sliders for Holographic and Faceted, matching the Quantum experience.
- Manual picks and automatic palette rotations now flow through all three visualizers, keeping desktop and mobile operators in sync.

## Latest Update: Scene Director & Live Scene Controls

### 🎬 Reactive scene sequencing on desktop and mobile
- Introduced a shared `SceneDirector` that advances complete choreography scenes—palette, geometry, baseline sliders, vibrance, and RGB glitch envelopes—off reactive, tempo, interval, or energy triggers.
- Dropped responsive scene cards into `ultimate-reactive.html` with playlist toggles, mode buttons, and condensed threshold sliders that collapse automatically on mobile breakpoints.

### 📱 Mobile Maestro mirrors the full scene library
- Added the Scene Director tab to `mobile-smart.html`, complete with thumb-friendly cards, auto-mode chips, and live status readouts so phones can launch the same cinematic scenes as the desktop console.
- Synced the status bar with active scene labels and ensured slider/geometry states persist across visualizer swaps and manual overrides.

### 🗂️ Queue, favorites, and history rails
- Introduced scene queues on both consoles so operators can line up special looks that fire before the reactive scheduler resumes.
- Added favorite toggles to every scene card and surfaced them as compact chips for one-tap recall on mobile and desktop.
- Logged every automatic and manual scene trigger with timestamps and reasons, exposing the ledger in both UIs for quick audits mid-performance.

### 🌈 Palette and vibrance blending stay in lockstep
- Scene application now updates palette playlists, vibrance sliders, and moiré glitch controls in one move so auto-rotations never fight manual grading.
- Manual scene selections acknowledge the director timers, keeping future automatic changes musical instead of immediate.

### ⏱️ Shuffle-ready scene navigation
- Dropped in-order vs. shuffle toggles plus manual next/previous triggers for both the Ultimate Reactive console and Mobile Maestro so operators can steer transitions without leaving the canvas.
- Live status cards now preview the upcoming scene name and show a running countdown so you know exactly when the director will fire the next change.

## Latest Update: Palette Director & Hypercolor Expansion

### 🎨 Palette sequencing on every console
- Dropped a shared `PaletteDirector` into the Mobile Maestro and Ultimate Reactive consoles so palette journeys can auto-rotate on downbeats, tempo grids, energy spikes, or a simple interval timer.
- Added playlist toggles, mode buttons, and contextual sliders (interval seconds, beat division, energy threshold) that collapse when manual mode is selected to preserve screen real estate.

### 🌌 Quantum gains four new colour families
- Expanded the Quantum shader with Luxe Ember, Biolumens, Cyber Noir, and Aurora Cascade palette profiles while keeping the original six legacy options intact.
- Updated every layer's colour math so the new profiles inject gold-teal, bioluminescent, cyberpunk, and aurora-inspired journeys without breaking existing choreography.

### 🖥️ Ultimate Reactive mirrors Mobile Maestro polish
- Brought the compact palette controls, playlist chips, and auto-mode HUD from Mobile Maestro into `examples/ultimate-reactive.html` so desktop rigs enjoy the same streamlined colour workflow.
- Synced the consoles to the same choreography engine so manual palette picks and automatic rotations stay locked across devices.

## Previous Update: Mobile Maestro Console & Quantum Hypercolor

### 📱 Mobile-Smart evolves into the Mobile Maestro
- Rebuilt [`examples/mobile-smart.html`](examples/mobile-smart.html) with the Advanced Reactive aesthetic, a sliding bottom console, and mobile-first tabs so choreography controls never crowd the canvas.
- Wired the page into the full choreography engine with beat-driven rotation patterns, palette selection, geometry swaps, and RGB moiré toggles that mirror the ultimate demo while staying touch friendly.
- Added live reactivity meters, frequency bars, and quick sequence launchers so verifying real audio input on phones is now instant.

### 🌈 Quantum gets selectable palette choreography
- Introduced six curated palette journeys (Legacy Hypercolor, Aurora Bloom, Solar Inferno, Midnight Prism, Neon Mirage, and Monochrome Bloom) plus a vibrance slider that feeds directly into shader dynamics.
- Added a beat-reactive moiré/RGB offset glitch uniform so the lattice can lean into audio-driven chromatic interference or stay pristine.
- Updated the shader to honour the new uniforms while keeping the legacy extreme color mode as the baseline option.

## Latest Update: Demo Atlas & Visualizer Navigation

### 🗺️ All demos in one searchable hub
- Added a **Demo Atlas** at [`examples/INDEX.html`](examples/INDEX.html) that lists every active HTML entry point.
- Documented a GitHub Pages checklist so pull request branches can deploy from the repository root before merging.
- Live search and category filters make it simple to jump between production canvases, analyzer harnesses, diagnostics, and archival builds.
- Automatic totals keep counts for demos, visualizer systems, reactivity modes, and macro scenarios accurate as new pages land.
- Quick links call out priority flows such as `properly-reactive.html` for analyzer verification and the Final Ultimate cinematic showcase.

---

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
- New depth cinematography uniforms drive focus distance, focus spread, parallax warp, chromatic aberration, fog density, shadow contrast, colour temperature, and godray intensity so every visualizer renders volumetric haze and prismatic flares that pulse with the beat.
- Post-processing controls for film grain, lens distortion, frame blending, light wrap, and colour bleed ride the same camera rail so every canvas can pivot between crisp clarity and dreamlike bloom as the music evolves.

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
