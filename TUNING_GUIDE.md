# 🎚️ VIB34D Choreography Tuning Guide

Complete guide to optimizing the choreography engine for your music and visual preferences.

## 🎯 Quick Start

**Best Experience**: Use `enhanced-visualizers.html` - it has real-time sliders for all parameters!

**Baseline-first rule**: Every visual parameter now has a baseline that acts as the source of truth. Audio reactivity only adds a temporary offset around that baseline and decays back to it when envelopes fade. Use the driver mix controls (beat/onset/audio) and silence floor in `behavior-preview.html` to cap how much energy feeds the reactive offsets while keeping baseline values stable in quiet passages.

### Default Settings (Good for Most Music):
- **Onset Threshold**: 0.85
- **Bass Threshold**: 0.83
- **Visual Intensity**: 1.0
- **Grid Density**: 25

## 🎚️ Parameter Guide

### Onset Threshold (0.5 - 0.99)

Controls how sensitive the system is to audio transients (sudden changes).

**Lower values (0.5-0.7)**:
- ✅ Triggers on every beat
- ✅ Very reactive
- ❌ Can feel chaotic
- **Best for**: Ambient, downtempo, classical

**Medium values (0.75-0.85)** ⭐ RECOMMENDED:
- ✅ Balanced reactivity
- ✅ Triggers on accents and fills
- ✅ Not overwhelming
- **Best for**: EDM, pop, rock, most music

**Higher values (0.88-0.99)**:
- ✅ Only major hits trigger
- ✅ Clean, selective
- ❌ Might miss subtle moments
- **Best for**: Metal, dubstep, trap (heavy bass music)

### Bass Threshold (0.5 - 0.99)

Controls when bass-reactive sequences trigger.

**Lower values (0.5-0.7)**:
- ✅ Constant bass reactivity
- ✅ Sequences trigger frequently
- ❌ Can be overwhelming
- **Best for**: Bass-heavy genres with consistent low end

**Medium values (0.75-0.85)** ⭐ RECOMMENDED:
- ✅ Triggers on actual bass hits
- ✅ Good rhythm
- **Best for**: Most electronic music, hip-hop

**Higher values (0.88-0.99)**:
- ✅ Only massive bass drops
- ✅ Very selective
- **Best for**: Dubstep, drum & bass, heavy metal

### Visual Intensity (0.3 - 1.5)

Controls overall brightness and visibility.

- **0.3-0.5**: Subtle, dark aesthetic
- **0.6-0.8**: Balanced visibility
- **0.9-1.2**: ⭐ RECOMMENDED - Bright, clear
- **1.3-1.5**: Maximum brightness, can wash out

### Grid Density (10 - 50)

Controls geometric complexity.

- **10-15**: Minimal, spacious
- **20-30**: ⭐ RECOMMENDED - Balanced detail
- **35-50**: Dense, intricate (may impact performance)

## 🎵 Genre-Specific Presets

### Electronic Dance Music (EDM)
```
Onset Threshold: 0.80
Bass Threshold: 0.85
Intensity: 1.1
Density: 25
```
Why: EDM has clear structure with defined drops

### Heavy Metal
```
Onset Threshold: 0.90
Bass Threshold: 0.88
Intensity: 1.2
Density: 30
```
Why: Lots of transients, need high threshold to avoid constant triggering

### Hip-Hop / Trap
```
Onset Threshold: 0.82
Bass Threshold: 0.80
Intensity: 1.0
Density: 22
```
Why: Heavy bass but relatively simple structure

### Ambient / Downtempo
```
Onset Threshold: 0.65
Bass Threshold: 0.70
Intensity: 0.8
Density: 18
```
Why: Subtle changes need lower thresholds

### Dubstep / Bass Music
```
Onset Threshold: 0.92
Bass Threshold: 0.92
Intensity: 1.3
Density: 28
```
Why: Extreme dynamics, only want to trigger on massive hits

### Classical / Orchestral
```
Onset Threshold: 0.70
Bass Threshold: 0.75
Intensity: 0.9
Density: 20
```
Why: Wide dynamic range, need sensitivity to capture swells

### Rock / Alternative
```
Onset Threshold: 0.83
Bass Threshold: 0.82
Intensity: 1.05
Density: 24
```
Why: Consistent energy with periodic accents

## 📊 Reading Audio Levels

The enhanced visualizer shows real-time audio levels:

### Bass Level
- **0-40%**: Low bass presence
- **40-70%**: Normal bass
- **70-85%**: Strong bass
- **85-100%**: 🔥 MASSIVE bass hit (trigger territory)

### Onset Level
- **0-50%**: Normal playback
- **50-75%**: Minor transient
- **75-85%**: Clear transient (snare, kick)
- **85-100%**: 💥 Major hit (trigger territory)

### Energy Level
- **0-30%**: Quiet section
- **30-60%**: Normal playing
- **60-80%**: Building/active section
- **80-100%**: Peak energy (chorus, drop)

## 🎮 Rotation Patterns

### smooth
**Best for**: Background ambiance, any genre
**Feel**: Gentle, continuous rotation

### hyperspace_spiral
**Best for**: EDM drops, trance
**Feel**: Spiraling through multiple 4D planes

### beat_locked ⭐ RECOMMENDED
**Best for**: Rhythmic music, hip-hop, house
**Feel**: Quantized to beat grid, rhythmic

### bass_momentum
**Best for**: Dubstep, drum & bass
**Feel**: Accelerates with bass hits

### spectral_orbit
**Best for**: Melodic music, progressive house
**Feel**: Speed varies with pitch

### energy_sweep
**Best for**: Build-ups, crescendos
**Feel**: Dramatic sweeps with energy changes

### chaos_spin
**Best for**: Experimental, noise, glitch
**Feel**: Unpredictable, chaotic

### onset_snap
**Best for**: Percussive music, breakbeats
**Feel**: Sudden changes on hits

## 💥 Bass Drop Sequences

### bass_drop_cascade
- **Duration**: 4 seconds
- **Feel**: Anticipation → Impact → Release
- **Best for**: EDM drops with clear structure

### bass_drop_explosion
- **Duration**: 2 seconds
- **Feel**: Immediate chaos then settle
- **Best for**: Dubstep wobbles

### bass_drop_freeze
- **Duration**: 3 seconds
- **Feel**: Dim down then explosive release
- **Best for**: Buildups with silence before drop

### bass_drop_spiral
- **Duration**: 4 seconds
- **Feel**: Spiraling descent through all planes
- **Best for**: Progressive builds

### bass_drop_pulse
- **Duration**: 2 seconds
- **Feel**: Quick rhythmic pulse
- **Best for**: Rapid-fire bass hits

## 🔧 Troubleshooting

### "Too many sequences triggering"
- ✅ Increase onset threshold to 0.90+
- ✅ Increase bass threshold to 0.88+
- ✅ Use "Clear Active" button to reset

### "Nothing is triggering"
- ✅ Lower onset threshold to 0.75
- ✅ Lower bass threshold to 0.75
- ✅ Check audio levels are showing movement

### "Visualizer is too dark"
- ✅ Increase intensity to 1.2+
- ✅ Stop active sequences with "Clear Active"
- ✅ Check if `bass_drop_freeze` is running (it dims)

### "Visualizer is too chaotic"
- ✅ Lower grid density to 15-20
- ✅ Use "smooth" or "beat_locked" rotation
- ✅ Increase thresholds to reduce triggers

### "Can't hear audio"
- ✅ Make sure you clicked Play button
- ✅ Check browser didn't block autoplay
- ✅ Check system volume

## 🎯 Advanced Tips

### Layering Sequences
Multiple sequences can run simultaneously. Experiment with:
- Manually triggering multiple sequences
- Lowering thresholds for overlapping effects

### Custom Patterns Per Song Section
1. **Verse**: Lower intensity (0.7), smooth rotation
2. **Pre-chorus**: Increase density (30), beat_locked
3. **Chorus**: Max intensity (1.3), bass_momentum + manual sequence
4. **Bridge**: Lower density (15), chaos_spin

### Performance Optimization
If framerate drops:
- Lower grid density to 15-20
- Reduce intensity below 1.0
- Close other tabs/applications

## 📈 Recommended Workflow

1. **Load your track**
2. **Watch audio levels** for 10-20 seconds
3. **Note the bass peaks** - where do they sit? 70%? 85%?
4. **Set bass threshold** just below typical peaks
5. **Note the onset spikes** - how high do they go?
6. **Set onset threshold** to catch only the big hits
7. **Adjust intensity** for visibility preference
8. **Test rotation patterns** - find what feels right
9. **Manually trigger sequences** to learn their feel
10. **Fine-tune thresholds** while music plays

## 🌟 Pro Tips

- **Start conservative** (high thresholds) then lower
- **Metal/dense music** = higher thresholds (0.9+)
- **Sparse/ambient** = lower thresholds (0.7-0.8)
- **Watch the logs** - if you see constant onsets, raise threshold
- **Use "Clear Active"** to reset if sequences pile up
- **Intensity 1.2+** for live performances/projection
- **Intensity 0.7-0.9** for casual listening

---

**🎚️ Best Feature**: The enhanced visualizer lets you adjust everything **while music plays** - no need to reload!

---

**A Paul Phillips Manifestation**
Paul@clearseassolutions.com | Parserator.com
© 2025 Clear Seas Solutions LLC
