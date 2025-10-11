/**
 * ADSR Envelope for Smooth Parameter Transitions
 * Attack → Decay → Sustain → Release
 *
 * Prevents jarring parameter jumps by applying musical envelope curves
 *
 * A Paul Phillips Manifestation
 * © 2025 Clear Seas Solutions LLC
 */

export class ADSREnvelope {
    /**
     * @param {number} attackMs - Time to reach peak (milliseconds)
     * @param {number} decayMs - Time to reach sustain level (milliseconds)
     * @param {number} sustain - Sustain level (0-1)
     * @param {number} releaseMs - Time to fade to zero (milliseconds)
     */
    constructor(attackMs, decayMs, sustain, releaseMs) {
        this.attack = attackMs;
        this.decay = decayMs;
        this.sustain = sustain;  // 0-1 multiplier
        this.release = releaseMs;

        // Current state
        this.phase = 'idle';     // idle, attack, decay, sustain, release
        this.value = 0;          // Current envelope value (0-1)
        this.targetValue = 0;    // Target peak value
        this.peakValue = 0;      // Actual peak reached
        this.phaseStartTime = 0;
        this.lastUpdateTime = 0;

        // For smooth transitions
        this.previousValue = 0;
    }

    /**
     * Trigger the envelope with a new value
     * Starts attack phase
     */
    trigger(value) {
        this.targetValue = value;
        this.phase = 'attack';
        this.phaseStartTime = Date.now();
        this.lastUpdateTime = this.phaseStartTime;
        this.previousValue = this.value;
    }

    /**
     * Release the envelope
     * Starts release phase regardless of current phase
     */
    triggerRelease() {
        if (this.phase !== 'idle' && this.phase !== 'release') {
            this.phase = 'release';
            this.phaseStartTime = Date.now();
            this.previousValue = this.value;
        }
    }

    /**
     * Update envelope value
     * Call this every frame to get smooth transitions
     */
    update() {
        const now = Date.now();
        const elapsed = now - this.phaseStartTime;
        this.lastUpdateTime = now;

        switch(this.phase) {
            case 'attack':
                return this.updateAttack(elapsed);

            case 'decay':
                return this.updateDecay(elapsed);

            case 'sustain':
                return this.updateSustain(elapsed);

            case 'release':
                return this.updateRelease(elapsed);

            case 'idle':
            default:
                this.value = 0;
                return 0;
        }
    }

    /**
     * Attack phase: Rise from current value to peak
     */
    updateAttack(elapsed) {
        if (this.attack === 0) {
            // Instant attack
            this.value = this.targetValue;
            this.peakValue = this.targetValue;
            this.phase = 'decay';
            this.phaseStartTime = Date.now();
            return this.value;
        }

        // Linear rise from previous value to target
        const progress = Math.min(1, elapsed / this.attack);
        this.value = this.previousValue + (this.targetValue - this.previousValue) * progress;

        if (progress >= 1) {
            // Attack complete, move to decay
            this.peakValue = this.targetValue;
            this.phase = 'decay';
            this.phaseStartTime = Date.now();
            this.previousValue = this.value;
        }

        return this.value;
    }

    /**
     * Decay phase: Fall from peak to sustain level
     */
    updateDecay(elapsed) {
        if (this.decay === 0) {
            // Instant decay
            this.value = this.peakValue * this.sustain;
            this.phase = 'sustain';
            this.phaseStartTime = Date.now();
            return this.value;
        }

        const progress = Math.min(1, elapsed / this.decay);
        const sustainValue = this.peakValue * this.sustain;

        // Exponential decay curve (more musical)
        const curve = 1 - Math.pow(progress, 1.5);
        this.value = sustainValue + (this.peakValue - sustainValue) * curve;

        if (progress >= 1) {
            // Decay complete, move to sustain
            this.phase = 'sustain';
            this.phaseStartTime = Date.now();
            this.previousValue = this.value;
        }

        return this.value;
    }

    /**
     * Sustain phase: Hold at sustain level
     */
    updateSustain(elapsed) {
        this.value = this.peakValue * this.sustain;
        return this.value;
    }

    /**
     * Release phase: Fade to zero
     */
    updateRelease(elapsed) {
        if (this.release === 0) {
            // Instant release
            this.value = 0;
            this.phase = 'idle';
            return 0;
        }

        const progress = Math.min(1, elapsed / this.release);

        // Exponential release curve
        const curve = 1 - Math.pow(progress, 2);
        this.value = this.previousValue * curve;

        if (progress >= 1) {
            // Release complete, back to idle
            this.value = 0;
            this.phase = 'idle';
        }

        return this.value;
    }

    /**
     * Get current value without updating
     */
    getValue() {
        return this.value;
    }

    /**
     * Get current phase
     */
    getPhase() {
        return this.phase;
    }

    /**
     * Check if envelope is active (not idle)
     */
    isActive() {
        return this.phase !== 'idle';
    }

    /**
     * Reset to idle state
     */
    reset() {
        this.phase = 'idle';
        this.value = 0;
        this.targetValue = 0;
        this.peakValue = 0;
        this.previousValue = 0;
    }

    /**
     * Update envelope parameters on the fly
     */
    setParameters(attackMs, decayMs, sustain, releaseMs) {
        this.attack = attackMs;
        this.decay = decayMs;
        this.sustain = sustain;
        this.release = releaseMs;
    }

    /**
     * Get debug info
     */
    getDebugInfo() {
        return {
            phase: this.phase,
            value: this.value.toFixed(3),
            targetValue: this.targetValue.toFixed(3),
            parameters: {
                attack: `${this.attack}ms`,
                decay: `${this.decay}ms`,
                sustain: this.sustain.toFixed(2),
                release: `${this.release}ms`
            }
        };
    }
}

/**
 * Preset ADSR envelopes for common use cases
 */
export const ADSRPresets = {
    // Fast attack, long release (kick drums, bass hits)
    kick: () => new ADSREnvelope(50, 200, 0.3, 1500),

    // Medium attack, medium decay (snares, claps)
    snare: () => new ADSREnvelope(100, 300, 0.5, 800),

    // Slow attack, long decay (pads, ambient)
    pad: () => new ADSREnvelope(500, 1000, 0.7, 2000),

    // Very fast (hi-hats, percussion)
    hihat: () => new ADSREnvelope(20, 100, 0.2, 400),

    // Instant attack, no sustain (plucks)
    pluck: () => new ADSREnvelope(0, 200, 0, 500),

    // Long evolving (bass swells)
    swell: () => new ADSREnvelope(1000, 1500, 0.8, 2000),

    // Smooth transitions (vocals, melodic)
    smooth: () => new ADSREnvelope(200, 500, 0.6, 1000),

    // Instant response (color changes)
    instant: () => new ADSREnvelope(0, 0, 1.0, 100)
};
