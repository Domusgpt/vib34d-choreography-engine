/**
 * RotationChoreographer - 4D Rotation Patterns
 *
 * Dynamic sweeps, spirals, and orbits through hyperspace
 * - Hyperspace spirals
 * - Beat-locked rotations
 * - Bass momentum spin
 * - Spectral orbits
 *
 * A Paul Phillips Manifestation
 */

export class RotationChoreographer {
    constructor() {
        this.patterns = this.initializePatterns();
        this.currentPattern = 'smooth';
        this.momentum = { xw: 0, yw: 0, zw: 0 };
    }

    /**
     * Initialize rotation patterns library
     */
    initializePatterns() {
        return {
            /**
             * Smooth continuous rotation
             */
            smooth: {
                update: (time, intensity) => ({
                    rot4dXW: Math.sin(time * 0.2) * Math.PI * intensity,
                    rot4dYW: Math.cos(time * 0.15) * Math.PI * intensity,
                    rot4dZW: Math.sin(time * 0.25) * Math.PI * 0.5 * intensity
                })
            },

            /**
             * Hyperspace spiral - all 3 planes simultaneously
             */
            hyperspace_spiral: {
                update: (time, phase, intensity) => ({
                    rot4dXW: Math.sin(time * 0.5 + phase) * Math.PI * intensity,
                    rot4dYW: Math.cos(time * 0.3 + phase) * Math.PI * intensity,
                    rot4dZW: Math.sin(time * 0.7 + phase) * Math.PI * 0.5 * intensity
                })
            },

            /**
             * Beat-locked rotation - snaps to beat divisions
             */
            beat_locked: {
                update: (beatIndex, bpm, intensity) => {
                    const angle = (beatIndex % 16) * (Math.PI * 2 / 16);
                    return {
                        rot4dXW: angle * intensity,
                        rot4dYW: angle * 0.5 * intensity,
                        rot4dZW: -angle * 0.25 * intensity
                    };
                }
            },

            /**
             * Bass momentum spin - accumulates momentum
             */
            bass_momentum: {
                momentum: { xw: 0, yw: 0, zw: 0 },
                update: (bassHit, decay) => {
                    if (bassHit > 0.6) {
                        this.momentum.zw += bassHit * 0.3;
                        this.momentum.xw += bassHit * 0.1;
                    }

                    // Decay
                    this.momentum.xw *= decay;
                    this.momentum.yw *= decay;
                    this.momentum.zw *= decay;

                    return {
                        rot4dXW: this.momentum.xw * Math.PI,
                        rot4dYW: this.momentum.yw * Math.PI,
                        rot4dZW: this.momentum.zw * Math.PI * 2
                    };
                }
            },

            /**
             * Spectral orbit - speed based on spectral centroid
             */
            spectral_orbit: {
                update: (spectralCentroid, time) => {
                    const speed = spectralCentroid / 10000; // Hz to rad/s
                    return {
                        rot4dXW: Math.sin(time * speed) * Math.PI,
                        rot4dYW: Math.cos(time * speed) * Math.PI,
                        rot4dZW: Math.sin(time * speed * 0.5) * Math.PI * 0.5
                    };
                }
            },

            /**
             * Energy sweep - dramatic sweeps with energy
             */
            energy_sweep: {
                phase: 0,
                update: (energy, deltaTime) => {
                    this.phase = (this.phase || 0) + energy * deltaTime * 0.001;

                    return {
                        rot4dXW: Math.sin(this.phase) * Math.PI * energy,
                        rot4dYW: Math.cos(this.phase * 0.7) * Math.PI * energy,
                        rot4dZW: Math.sin(this.phase * 1.3) * Math.PI * energy * 0.5
                    };
                }
            },

            /**
             * Chaos spin - unpredictable rotations
             */
            chaos_spin: {
                update: (chaos, time) => ({
                    rot4dXW: (Math.random() - 0.5) * Math.PI * chaos + Math.sin(time * 0.3) * Math.PI * (1 - chaos),
                    rot4dYW: (Math.random() - 0.5) * Math.PI * chaos + Math.cos(time * 0.2) * Math.PI * (1 - chaos),
                    rot4dZW: (Math.random() - 0.5) * Math.PI * chaos + Math.sin(time * 0.4) * Math.PI * 0.5 * (1 - chaos)
                })
            },

            /**
             * Onset snap - sudden rotation on onsets
             */
            onset_snap: {
                lastOnset: 0,
                targetRotation: { xw: 0, yw: 0, zw: 0 },
                currentRotation: { xw: 0, yw: 0, zw: 0 },
                update: function(onset, time) {
                    if (onset > 0.5 && time - this.lastOnset > 500) {
                        // New onset - snap to new target
                        this.lastOnset = time;
                        this.targetRotation = {
                            xw: (Math.random() - 0.5) * Math.PI * 2,
                            yw: (Math.random() - 0.5) * Math.PI * 2,
                            zw: (Math.random() - 0.5) * Math.PI * 2
                        };
                    }

                    // Smoothly interpolate to target
                    const smoothing = 0.1;
                    this.currentRotation.xw += (this.targetRotation.xw - this.currentRotation.xw) * smoothing;
                    this.currentRotation.yw += (this.targetRotation.yw - this.currentRotation.yw) * smoothing;
                    this.currentRotation.zw += (this.targetRotation.zw - this.currentRotation.zw) * smoothing;

                    return this.currentRotation;
                }
            }
        };
    }

    /**
     * Set active pattern
     */
    setPattern(patternName) {
        if (this.patterns[patternName]) {
            this.currentPattern = patternName;
            console.log(`🌀 Rotation pattern set: ${patternName}`);
        } else {
            console.warn(`⚠️ Unknown rotation pattern: ${patternName}`);
        }
    }

    /**
     * Update rotation based on current pattern
     */
    update(audioData, time, beat, deltaTime) {
        const pattern = this.patterns[this.currentPattern];
        if (!pattern) return { rot4dXW: 0, rot4dYW: 0, rot4dZW: 0 };

        let rotations = { rot4dXW: 0, rot4dYW: 0, rot4dZW: 0 };

        // Call pattern update with appropriate parameters
        switch (this.currentPattern) {
            case 'smooth':
                rotations = pattern.update(time, audioData.rms || 0.5);
                break;

            case 'hyperspace_spiral':
                const phase = (beat % 8) / 8;
                rotations = pattern.update(time, phase, audioData.rms || 0.5);
                break;

            case 'beat_locked':
                rotations = pattern.update(beat, 120, audioData.rms || 0.5);
                break;

            case 'bass_momentum':
                rotations = pattern.update(audioData.bands?.bass || 0, 0.98);
                break;

            case 'spectral_orbit':
                rotations = pattern.update(audioData.spectralCentroid || 5000, time);
                break;

            case 'energy_sweep':
                rotations = pattern.update(audioData.rms || 0.5, deltaTime);
                break;

            case 'chaos_spin':
                rotations = pattern.update(audioData.chaos || 0.3, time);
                break;

            case 'onset_snap':
                rotations = pattern.update(audioData.onset || 0, Date.now());
                break;

            default:
                rotations = pattern.update(time, audioData.rms || 0.5);
        }

        return rotations;
    }

    /**
     * Get available patterns
     */
    getPatternNames() {
        return Object.keys(this.patterns);
    }
}
