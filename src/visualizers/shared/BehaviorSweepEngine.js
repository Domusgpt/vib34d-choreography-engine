/**
 * BehaviorSweepEngine
 * Unified behavioral reactivity + sweep coordinator shared by Ultimate/Mobile consoles
 * and in-engine systems. Consumes audio frames + beat/onset data and returns
 * motion/color deltas plus journey phase metadata for downstream systems.
 */

/**
 * @typedef {Object} AudioBand
 * @property {number} [value]
 */

/**
 * @typedef {Object} AudioFrame
 * @property {Record<string, number|AudioBand>} [bands]
 * @property {number} [rms]
 * @property {{ detected?: boolean, strength?: number }} [onset]
 */

/**
 * @typedef {Object} BeatInfo
 * @property {number} [bpm]
 * @property {number} [confidence]
 * @property {{ detected?: boolean, strength?: number }} [onset]
 */

/**
 * @typedef {Object} BehaviorDeltas
 * @property {{ xw: number, yw: number, zw: number }} motionRotation
 * @property {number} cameraDrift
 * @property {number} cameraVelocity
 * @property {number} morphDelta
 * @property {number} densityDelta
 * @property {{ hueShift: number, saturationPulse: number }} color
 * @property {{ phase: number, section: 'intro'|'build'|'drop'|'release', beatPulse: number, onset: number }} journey
 */

const PRESETS = {
    cinematic: {
        motionGain: 0.9,
        colorGain: 0.8,
        morphGain: 0.85,
        densityGain: 1.0,
        beatKick: 0.3,
        onsetTwist: 0.45,
        journeyLength: 16_000
    },
    hyper: {
        motionGain: 1.3,
        colorGain: 1.2,
        morphGain: 1.4,
        densityGain: 1.25,
        beatKick: 0.5,
        onsetTwist: 0.7,
        journeyLength: 12_000
    },
    mellow: {
        motionGain: 0.6,
        colorGain: 0.6,
        morphGain: 0.5,
        densityGain: 0.65,
        beatKick: 0.2,
        onsetTwist: 0.25,
        journeyLength: 20_000
    }
};

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function bandValue(band) {
    if (band === undefined || band === null) return 0;
    if (typeof band === 'number') return band;
    if (typeof band.value === 'number') return band.value;
    return 0;
}

export class BehaviorSweepEngine {
    constructor(preset = 'cinematic') {
        this.presetName = preset in PRESETS ? preset : 'cinematic';
        this.state = {
            energy: 0,
            colorEnergy: 0,
            lastOnset: 0,
            phaseTime: 0
        };
    }

    setPreset(name) {
        if (name in PRESETS) {
            this.presetName = name;
        }
    }

    /**
     * Primary entry point used by systems/console UIs each frame.
     * @param {{ audioFrame?: AudioFrame|null, beatInfo?: BeatInfo|null, preset?: string, deltaTime?: number }} input
     * @returns {BehaviorDeltas}
     */
    applyBehavioralReactivity(input = {}) {
        const { audioFrame = null, beatInfo = null, preset, deltaTime = 16 } = input;
        if (preset) {
            this.setPreset(preset);
        }

        const config = PRESETS[this.presetName];
        const bands = audioFrame?.bands || {};

        const bass = bandValue(bands.bass ?? bands.subBass);
        const lowMid = bandValue(bands.lowMid);
        const mid = bandValue(bands.mid);
        const high = bandValue(bands.high ?? bands.highMid);
        const energy = audioFrame?.rms ?? 0;
        const onsetStrength = audioFrame?.onset?.strength ?? beatInfo?.onset?.strength ?? 0;
        const onsetDetected = Boolean(audioFrame?.onset?.detected || beatInfo?.onset?.detected);

        // Smooth energy/color channels so downstream motion is stable
        const smoothing = clamp(deltaTime / 180, 0.05, 0.35);
        this.state.energy = this.state.energy + (energy - this.state.energy) * smoothing;
        this.state.colorEnergy = this.state.colorEnergy + ((high + mid * 0.5) - this.state.colorEnergy) * smoothing;

        // Journey phase progresses using BPM when present; otherwise fixed loop
        const bpm = beatInfo?.bpm || 120;
        const beatMs = 60_000 / bpm;
        this.state.phaseTime += deltaTime;
        const journeyLength = config.journeyLength;
        if (this.state.phaseTime > journeyLength) {
            this.state.phaseTime -= journeyLength;
        }
        const phase = clamp(this.state.phaseTime / journeyLength, 0, 1);
        const section = phase < 0.25 ? 'intro' : phase < 0.5 ? 'build' : phase < 0.75 ? 'drop' : 'release';

        // Beat/onset accents
        const beatPulse = Math.max(0, 1 - (deltaTime / beatMs)) * (beatInfo?.confidence || 0.8);
        const onset = onsetDetected ? onsetStrength : this.state.lastOnset * 0.85;
        this.state.lastOnset = onset;

        // Compute deltas
        const rotation = {
            xw: (lowMid * 0.6 + beatPulse * config.onsetTwist) * config.motionGain,
            yw: (mid * 0.5 + onset * 0.8) * config.motionGain,
            zw: (high * 0.55 + beatPulse * config.onsetTwist) * config.motionGain
        };

        const morphDelta = (mid * 1.2 + onset * 0.4) * config.morphGain;
        const densityDelta = (bass * 45 + beatPulse * 20) * config.densityGain;

        const hueShift = (high * 140 + onset * 60) * config.colorGain;
        const saturationPulse = clamp(this.state.colorEnergy * 0.35 + beatPulse * 0.25, 0, 0.6) * config.colorGain;

        return {
            motionRotation: rotation,
            cameraDrift: (bass * 0.15 + phase * 0.05) * config.motionGain,
            cameraVelocity: (energy * 0.9 + beatPulse * config.beatKick) * config.motionGain,
            morphDelta,
            densityDelta,
            color: { hueShift, saturationPulse },
            journey: { phase, section, beatPulse, onset }
        };
    }
}

export default BehaviorSweepEngine;
