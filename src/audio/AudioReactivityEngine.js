/**
 * AudioReactivityEngine - Deep Multi-Layer Audio Reactive System
 *
 * Provides rich, configurable mappings from audio features to visual parameters
 * - Multi-band frequency reactivity (sub-bass, bass, low-mid, mid, high-mid, high, ultra-high)
 * - Beat-synced geometry changes
 * - Spectral color cycling
 * - Motion speed modulation
 * - Density pulsing
 * - 4D rotation modulation
 * - Onset-triggered effects
 *
 * A Paul Phillips Manifestation
 */

export class AudioReactivityEngine {
    constructor() {
        // 7-band frequency analysis
        this.bands = {
            subBass: 0,      // 20-60 Hz
            bass: 0,         // 60-250 Hz
            lowMid: 0,       // 250-500 Hz
            mid: 0,          // 500-2000 Hz
            highMid: 0,      // 2000-4000 Hz
            high: 0,         // 4000-8000 Hz
            ultraHigh: 0     // 8000-20000 Hz
        };

        // Audio features
        this.features = {
            rms: 0,
            energy: 0,
            onset: 0,
            spectralCentroid: 0,
            spectralSpread: 0,
            spectralRolloff: 0,
            zcr: 0
        };

        // Smoothed/accumulated values
        this.smoothed = {
            bassAccum: 0,
            midAccum: 0,
            highAccum: 0,
            energyAccum: 0
        };

        // Beat detection
        this.beatState = {
            lastBeat: 0,
            beatPhase: 0,
            measure: 0,
            beatInMeasure: 0,
            bpm: 128
        };

        // Geometry cycling
        this.geometryState = {
            current: 0,
            target: 0,
            transition: 0,
            beatsSinceChange: 0,
            changeInterval: 16 // Change every 16 beats (4 measures)
        };

        // Color cycling
        this.colorState = {
            hue: 180,
            hueVelocity: 0,
            saturation: 0.8,
            brightness: 1.0
        };

        // Motion modulation
        this.motionState = {
            speed: 1.0,
            direction: 1.0, // 1.0 = forward, -1.0 = backward
            rotationSpeed: 1.0
        };

        // Default mapping configurations
        this.mappings = this.createDefaultMappings();

        // Smoothing factors
        this.smoothing = {
            fast: 0.3,    // Responsive
            medium: 0.15, // Balanced
            slow: 0.05    // Smooth
        };
    }

    /**
     * Create default audio-to-visual mappings
     */
    createDefaultMappings() {
        return {
            // Geometry density mappings
            density: {
                baseBass: { min: 5, max: 80, multiplier: 40, smooth: 'fast' },
                lowMidPulse: { min: 0, max: 20, multiplier: 15, smooth: 'medium' },
                onsetSpike: { min: 0, max: 30, multiplier: 25, smooth: 'fast' }
            },

            // Morph factor mappings
            morph: {
                mid: { min: 0.1, max: 3.0, multiplier: 1.5, smooth: 'medium' },
                spectralCentroid: { min: 0, max: 2.0, multiplier: 0.0002, smooth: 'slow' }
            },

            // Chaos mappings
            chaos: {
                energy: { min: 0, max: 1.0, multiplier: 0.6, smooth: 'medium' },
                highFreq: { min: 0, max: 0.5, multiplier: 0.4, smooth: 'fast' },
                spectralSpread: { min: 0, max: 0.3, multiplier: 0.0001, smooth: 'slow' }
            },

            // Speed modulation
            speed: {
                bassBoost: { min: 0.5, max: 2.5, multiplier: 1.2, smooth: 'medium' },
                energyDrive: { min: 0.8, max: 2.0, multiplier: 0.8, smooth: 'slow' }
            },

            // Color cycling
            hue: {
                high: { min: -180, max: 180, multiplier: 200, smooth: 'fast' },
                spectralCentroid: { min: -60, max: 60, multiplier: 0.01, smooth: 'slow' },
                onsetJump: { min: 0, max: 120, multiplier: 100, smooth: 'fast' }
            },

            saturation: {
                mid: { min: 0.3, max: 1.0, multiplier: 0.5, smooth: 'medium' },
                energy: { min: 0.5, max: 1.0, multiplier: 0.4, smooth: 'slow' }
            },

            brightness: {
                rms: { min: 0.6, max: 1.5, multiplier: 0.7, smooth: 'fast' },
                onset: { min: 0, max: 0.5, multiplier: 0.4, smooth: 'fast' }
            },

            // 4D rotation modulation
            rotation4D: {
                xw: {
                    lowMid: { min: -0.5, max: 0.5, multiplier: 0.3, smooth: 'medium' },
                    bassSwing: { min: -1.0, max: 1.0, multiplier: 0.8, smooth: 'slow' }
                },
                yw: {
                    mid: { min: -0.5, max: 0.5, multiplier: 0.4, smooth: 'medium' },
                    spectral: { min: -0.3, max: 0.3, multiplier: 0.0001, smooth: 'slow' }
                },
                zw: {
                    high: { min: -0.8, max: 0.8, multiplier: 0.6, smooth: 'fast' },
                    energySpin: { min: -0.5, max: 0.5, multiplier: 0.5, smooth: 'medium' }
                }
            },

            // Dimension modulation
            dimension: {
                spectralRolloff: { min: 2.0, max: 5.0, multiplier: 0.0001, smooth: 'slow' },
                complexity: { min: 0, max: 1.5, multiplier: 0.8, smooth: 'medium' }
            }
        };
    }

    /**
     * Update with fresh audio analysis
     */
    update(audioData, beatInfo, deltaTime) {
        if (!audioData) return;

        // Update frequency bands
        if (audioData.bands) {
            this.bands = { ...this.bands, ...audioData.bands };
        }

        // Update audio features
        this.features = {
            rms: audioData.rms || 0,
            energy: audioData.rms || 0,
            onset: audioData.onset || 0,
            spectralCentroid: audioData.spectralCentroid || 5000,
            spectralSpread: audioData.spectralSpread || 2000,
            spectralRolloff: audioData.spectralRolloff || 8000,
            zcr: audioData.zcr || 0.1
        };

        // Update beat info
        if (beatInfo) {
            this.beatState = { ...this.beatState, ...beatInfo };
            this.beatState.beatPhase = (beatInfo.beatInMeasure || 0) / (beatInfo.beatsPerMeasure || 4);
        }

        // Update smoothed accumulators
        this.updateAccumulators(deltaTime);

        // Update geometry cycling
        this.updateGeometryCycling();

        // Update color cycling
        this.updateColorCycling(deltaTime);

        // Update motion modulation
        this.updateMotionModulation(deltaTime);
    }

    /**
     * Update smoothed accumulator values
     */
    updateAccumulators(deltaTime) {
        const dt = Math.min(deltaTime / 1000, 0.1); // Cap at 100ms

        // Bass accumulator (decays slowly)
        const bassTarget = this.bands.bass + this.bands.subBass * 0.5;
        this.smoothed.bassAccum += (bassTarget - this.smoothed.bassAccum) * this.smoothing.slow;

        // Mid accumulator
        const midTarget = this.bands.mid + this.bands.lowMid * 0.3;
        this.smoothed.midAccum += (midTarget - this.smoothed.midAccum) * this.smoothing.medium;

        // High accumulator
        const highTarget = this.bands.high + this.bands.highMid * 0.5 + this.bands.ultraHigh * 0.3;
        this.smoothed.highAccum += (highTarget - this.smoothed.highAccum) * this.smoothing.fast;

        // Energy accumulator
        this.smoothed.energyAccum += (this.features.energy - this.smoothed.energyAccum) * this.smoothing.medium;
    }

    /**
     * Update geometry cycling based on beats
     */
    updateGeometryCycling() {
        this.geometryState.beatsSinceChange++;

        // Auto-cycle geometry every N beats
        if (this.geometryState.beatsSinceChange >= this.geometryState.changeInterval) {
            this.geometryState.target = (this.geometryState.target + 1) % 8;
            this.geometryState.beatsSinceChange = 0;
            this.geometryState.transition = 0;
        }

        // Smooth transition
        if (this.geometryState.transition < 1.0) {
            this.geometryState.transition += 0.02;
            this.geometryState.current =
                this.geometryState.current * (1 - this.geometryState.transition) +
                this.geometryState.target * this.geometryState.transition;
        }

        // Onset-triggered geometry jump
        if (this.features.onset > 0.8) {
            const jump = Math.random() < 0.3; // 30% chance on strong onset
            if (jump) {
                this.geometryState.target = Math.floor(Math.random() * 8);
                this.geometryState.beatsSinceChange = 0;
                this.geometryState.transition = 0;
            }
        }
    }

    /**
     * Update color cycling
     */
    updateColorCycling(deltaTime) {
        const dt = Math.min(deltaTime / 1000, 0.1);

        // Hue velocity from high frequencies
        const hueAccel = this.bands.high * 300 - this.bands.bass * 100;
        this.colorState.hueVelocity += hueAccel * dt;
        this.colorState.hueVelocity *= 0.95; // Decay

        // Update hue
        this.colorState.hue += this.colorState.hueVelocity * dt;
        this.colorState.hue = ((this.colorState.hue % 360) + 360) % 360;

        // Onset hue jump
        if (this.features.onset > 0.85) {
            this.colorState.hue += 60 + Math.random() * 120;
        }

        // Saturation from mid frequencies
        const satTarget = 0.5 + this.bands.mid * 0.4 + this.features.energy * 0.3;
        this.colorState.saturation += (satTarget - this.colorState.saturation) * this.smoothing.medium;

        // Brightness from RMS
        const brightTarget = 0.7 + this.features.rms * 0.6 + this.features.onset * 0.3;
        this.colorState.brightness += (brightTarget - this.colorState.brightness) * this.smoothing.fast;
    }

    /**
     * Update motion speed/direction modulation
     */
    updateMotionModulation(deltaTime) {
        const dt = Math.min(deltaTime / 1000, 0.1);

        // Speed from bass + energy
        const speedTarget = 0.8 + this.smoothed.bassAccum * 1.2 + this.smoothed.energyAccum * 0.8;
        this.motionState.speed += (speedTarget - this.motionState.speed) * this.smoothing.medium;

        // Direction reversal on strong bass hits
        if (this.bands.subBass > 0.8) {
            const reverseChance = (this.bands.subBass - 0.8) * 0.5;
            if (Math.random() < reverseChance * dt) {
                this.motionState.direction *= -1;
            }
        }

        // Rotation speed from spectral complexity
        const complexity = this.features.spectralSpread / 10000;
        const rotSpeedTarget = 0.5 + complexity * 1.5 + this.bands.mid * 0.8;
        this.motionState.rotationSpeed += (rotSpeedTarget - this.motionState.rotationSpeed) * this.smoothing.slow;
    }

    /**
     * Get reactive parameters for visualizer
     */
    getReactiveParameters(baseParams = {}) {
        const reactive = { ...baseParams };

        // Grid density: bass + low-mid + onset
        const densityBase = baseParams.gridDensity || 20;
        const densityMod =
            this.bands.bass * this.mappings.density.baseBass.multiplier +
            this.bands.lowMid * this.mappings.density.lowMidPulse.multiplier +
            this.features.onset * this.mappings.density.onsetSpike.multiplier;
        reactive.gridDensity = Math.max(5, Math.min(80, densityBase + densityMod));

        // Morph factor: mid + spectral centroid
        const morphBase = baseParams.morphFactor || 1.0;
        const morphMod =
            this.bands.mid * this.mappings.morph.mid.multiplier +
            this.features.spectralCentroid * this.mappings.morph.spectralCentroid.multiplier;
        reactive.morphFactor = Math.max(0.1, Math.min(3.0, morphBase + morphMod));

        // Chaos: energy + high + spectral spread
        const chaosBase = baseParams.chaos || 0.2;
        const chaosMod =
            this.features.energy * this.mappings.chaos.energy.multiplier +
            this.smoothed.highAccum * this.mappings.chaos.highFreq.multiplier +
            this.features.spectralSpread * this.mappings.chaos.spectralSpread.multiplier;
        reactive.chaos = Math.max(0, Math.min(1.0, chaosBase + chaosMod));

        // Speed: bass boost + energy drive
        const speedBase = baseParams.speed || 1.0;
        const speedMod =
            this.smoothed.bassAccum * this.mappings.speed.bassBoost.multiplier +
            this.smoothed.energyAccum * this.mappings.speed.energyDrive.multiplier;
        reactive.speed = Math.max(0.1, Math.min(3.0, speedBase * this.motionState.speed + speedMod * 0.3));

        // Hue: high + spectral + onset
        const hueBase = baseParams.hue || 180;
        reactive.hue = ((this.colorState.hue + hueBase) % 360);

        // Saturation: from color state
        reactive.saturation = Math.max(0, Math.min(1.0, this.colorState.saturation));

        // Intensity/Brightness
        const intensityBase = baseParams.intensity || 1.0;
        reactive.intensity = Math.max(0.1, Math.min(2.0, intensityBase * this.colorState.brightness));

        // 4D Rotations: multi-band modulation
        const rot4dXWBase = baseParams.rot4dXW || 0;
        const xwMod =
            this.bands.lowMid * this.mappings.rotation4D.xw.lowMid.multiplier +
            this.smoothed.bassAccum * this.mappings.rotation4D.xw.bassSwing.multiplier;
        reactive.rot4dXW = rot4dXWBase + xwMod * this.motionState.direction;

        const rot4dYWBase = baseParams.rot4dYW || 0;
        const ywMod =
            this.bands.mid * this.mappings.rotation4D.yw.mid.multiplier +
            this.features.spectralCentroid * this.mappings.rotation4D.yw.spectral.multiplier;
        reactive.rot4dYW = rot4dYWBase + ywMod * this.motionState.rotationSpeed;

        const rot4dZWBase = baseParams.rot4dZW || 0;
        const zwMod =
            this.smoothed.highAccum * this.mappings.rotation4D.zw.high.multiplier +
            this.features.energy * this.mappings.rotation4D.zw.energySpin.multiplier;
        reactive.rot4dZW = rot4dZWBase + zwMod * this.motionState.rotationSpeed;

        // Dimension: spectral rolloff + complexity
        const dimensionBase = baseParams.dimension || 3.5;
        const dimensionMod =
            this.features.spectralRolloff * this.mappings.dimension.spectralRolloff.multiplier +
            (this.features.spectralSpread / 10000) * this.mappings.dimension.complexity.multiplier;
        reactive.dimension = Math.max(2.0, Math.min(5.0, dimensionBase + dimensionMod));

        // Geometry: from cycling state
        reactive.geometry = Math.floor(this.geometryState.current);

        return reactive;
    }

    /**
     * Get current reactivity state for UI display
     */
    getState() {
        return {
            bands: { ...this.bands },
            features: { ...this.features },
            smoothed: { ...this.smoothed },
            geometry: this.geometryState,
            color: this.colorState,
            motion: this.motionState
        };
    }

    /**
     * Update mapping configuration
     */
    updateMapping(category, param, key, value) {
        if (this.mappings[category] && this.mappings[category][param]) {
            if (typeof this.mappings[category][param][key] !== 'undefined') {
                this.mappings[category][param][key] = value;
                console.log(`🎛️ Updated ${category}.${param}.${key} = ${value}`);
            }
        }
    }

    /**
     * Get mapping configuration
     */
    getMappings() {
        return JSON.parse(JSON.stringify(this.mappings));
    }
}
