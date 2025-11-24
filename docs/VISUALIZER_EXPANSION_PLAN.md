# 🌈 Visualizer Vibrancy & Export Expansion Plan

## Vision
Deliver a lovable, high-energy choreography studio that pairs real audio reactivity with expressive controls, adorable preset storytelling, and effortless MP4 exports ready for socials.

---

## Phase 1 – Vibrant Control Surface for Visualizers
1. **Unified Control Layer**
   - Build a `VisualizerControlBus` module that centralizes parameter routing (intensity, hue, morph, camera paths).
   - Expose declarative control maps so UI sliders, MIDI, OSC, or automation clips can drive the same parameters.
2. **Hypercolor Palette Engine**
   - Expand the color system with curated palettes (pastel kawaii, neon rave, deep space) and live blending via L*a*b* interpolation.
   - Allow palettes to swap per-section or per-beat using the choreography engine.
   - ✅ Implemented as of Hypercolor rollout: palettes now live in `ColorSystem` with audio-triggered swaps and shared shadow tones.
3. **Gesture & Macro Recording**
   - Add macro recorder to capture performer gestures over time and replay/quantize them on the timeline.
   - Store macros as JSON assets that can be shared between performances.
   - ✅ Macro sequencer landed: control bus now captures beat-aware gestures, quantizes takes, and exposes export/import helpers.
4. **Adaptive Camera + Lighting**
   - ✅ Shared `CameraLightingSystem` now layers cinematic rails with beat-aware exposure, shutter, bloom, and vignette responses.
   - ✅ Presets "Orbit Sparkle", "Heart Glide", and "Bass Drop Zoom" drive per-visualizer camera moves that macros can override via new control-bus channels.
   - ✅ Auto-directors blend presets on the fly using energy, swing, colour ribbons, and dimensional surges with smooth transitions and cooldown guards.
   - ✅ Depth cinematography pass adds focus distance, parallax, fog density, chromatic aberration, colour temperature, and godray envelopes so every canvas renders volumetric beams and prismatic flares in sync with the music.
   - ✅ Cinematic post-FX banks now expose film grain, lens distortion, frame blending, light wrap, and colour bleed so future presets can dial in everything from crisp glass boxes to dreamy bloomscapes per scene.

---

## Phase 2 – Adorable Choreography Toolkit
1. **Motif Library**
   - Design cute motion motifs (heart blooms, star pops, bounce wiggles) as reusable sequence fragments.
   - Tag motifs with mood & intensity metadata so the engine can suggest appropriate combos.
2. **Emotion-Driven Sequencer**
   - Extend `ChoreographyEngine` with emotion tracks (Joy, Serenity, Mischief) fed by audio features.
   - Map each emotion to motif queues to create delightful call-and-response animations.
3. **Story Arc Templates**
   - Ship timeline templates (e.g., "Meet-Cute Intro", "Supernova Finale") that orchestrate motifs, color arcs, and camera moves.
   - Include adaptive triggers for live improv (handclap → confetti burst, vocal chop → sparkle trail).
4. **Cutie Physics Layer**
   - Implement soft-body squish & stretch modifiers tied to bass and onset cues for irresistible charm.

---

## Phase 3 – MP4 Export Pipeline
1. **Capture Strategy**
   - Integrate WebGL frame capture via `OffscreenCanvas` + `WebCodecs` fallback to ensure deterministic output.
   - Add offline render mode that steps the engine with fixed timesteps to avoid frame drops.
2. **Encoding Profiles**
   - Provide presets: `social-lite` (720p, 6 Mbps), `showcase` (1080p, 12 Mbps), `archival` (4K, 25 Mbps HEVC if available).
   - Use two-pass encoding when FFmpeg is available; fall back to single-pass when running fully in-browser.
3. **Timestamped Naming Protocol**
   - Format filenames as `VIB34D_YYYYMMDD-HHMMSS_BPM###_SceneName.mp4`.
   - Include optional hash of sequence IDs for traceability.
4. **Size Optimization**
   - Auto-trim trailing silence and allow smart frame skipping when RMS < threshold.
   - Offer LUT-based color compression and adaptive keyframe spacing.
5. **Delivery Hooks**
   - Add `ExportManager` class with API hooks for saving locally, uploading to S3, or posting to social schedulers.

---

## Supporting Workstreams
- **Testing Harness**: scripted audio fixtures to validate reactivity + export determinism.
- **Documentation Refresh**: tutorials for the new control bus, motif authoring, and export manager.
- **Performance Profiling**: capture GPU + CPU metrics to keep 60fps during live playback.

With these phases we unlock expressive live control today while charting a clear course toward lovable storytelling and polished media exports tomorrow.
