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

/**
 * @typedef {Object} BehaviorControl
 * @property {boolean} [enabled]
 * @property {number} [amount]
 */

/**
 * @typedef {Object} BehaviorControlSet
 * @property {BehaviorControl} [density]
 * @property {BehaviorControl} [morph]
 * @property {BehaviorControl} [color]
 * @property {BehaviorControl} [chaos]
 * @property {BehaviorControl} [rotation]
 * @property {BehaviorControl} [camera]
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

export const LLM_BEHAVIOR_PROMPT_TEMPLATE = `You are configuring a live visualizer. Return ONLY the values in this template (no JSON):
Preset: <cinematic|hyper|mellow>
Intensity: <0-3>
Density: <on/off> amount <0-2>
Morph: <on/off> amount <0-3>
Color: <on/off> amount <0-2>
Chaos: <on/off> amount <0-2>
Rotation: <on/off> amount <0-2>
Camera: <on/off> amount <0-2>
Notes: <one short sentence about the vibe>`;

const CONTROL_KEYS = ['density', 'morph', 'color', 'chaos', 'rotation', 'camera'];

const CONTROL_ALIAS_MAP = {
    density: 'density',
    morph: 'morph',
    color: 'color',
    hue: 'color',
    saturation: 'color',
    chaos: 'chaos',
    rotation: 'rotation',
    camera: 'camera',
    speed: 'camera'
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

/**
 * Build an LLM-friendly instruction block that can be copy/pasted along with a user prompt.
 * @param {string} userPrompt
 */
export function createBehaviorPrompt(userPrompt = '') {
    return `${LLM_BEHAVIOR_PROMPT_TEMPLATE}\n\nUser prompt: ${userPrompt}`;
}

function parseControlLine(raw) {
    const lower = raw.toLowerCase();
    const enabled = lower.includes('off') || lower.includes('disable') ? false : lower.includes('on') || lower.includes('enable') || lower.includes('true');
    const amountMatch = lower.match(/(-?\d+(?:\.\d+)?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : undefined;
    return { enabled, amount };
}

/**
 * Parse a text-only LLM response that follows the template into preset + control toggles.
 * @param {string} text
 * @returns {{ preset?: string, intensity?: number, controls: BehaviorControlSet, notes?: string }}
 */
export function parseBehaviorPromptResponse(text = '') {
    const lines = text.split(/\r?\n/);
    const result = { controls: {}, warnings: [], matchedKeys: [] };

    lines.forEach((line) => {
        const [keyRaw, ...rest] = line.split(':');
        if (!rest.length) return;
        const key = keyRaw.trim().toLowerCase();
        const value = rest.join(':').trim();

        if (key === 'preset') {
            const presetKey = value.toLowerCase();
            if (presetKey in PRESETS) {
                result.preset = presetKey;
                result.matchedKeys.push('preset');
            } else {
                result.warnings.push(`Unknown preset '${value}', keeping current preset.`);
            }
        } else if (key === 'intensity') {
            const val = parseFloat(value);
            if (!Number.isNaN(val)) {
                result.intensity = clamp(val, 0, 3);
                result.matchedKeys.push('intensity');
            } else {
                result.warnings.push(`Could not read intensity from '${value}'.`);
            }
        } else if (key === 'notes') {
            result.notes = value;
            result.matchedKeys.push('notes');
        } else {
            const controlKey = CONTROL_ALIAS_MAP[key];
            if (controlKey) {
                const parsed = parseControlLine(value);
                result.controls[controlKey] = {
                    enabled: parsed.enabled,
                    amount: parsed.amount
                };
                result.matchedKeys.push(controlKey);
            } else if (key.trim()) {
                result.warnings.push(`Ignored line '${line.trim()}'`);
            }
        }
    });

    CONTROL_KEYS.forEach((key) => {
        if (!(key in result.controls)) {
            result.controls[key] = {};
        }
    });

    if (!result.preset) {
        result.warnings.push('No preset found; using current engine preset.');
    }

    if (typeof result.intensity !== 'number') {
        result.intensity = 1;
        result.defaultedIntensity = true;
        result.warnings.push('No intensity specified; defaulting to 1.');
    }

    return result;
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

/**
 * Apply user control gates and intensity to behavior deltas, returning clamped parameters.
 * @param {{ baseParams: Record<string, number>, deltas: BehaviorDeltas, controls?: BehaviorControlSet, intensity?: number, limits?: Record<string, { min?: number, max?: number }> }} opts
 * @returns {Record<string, number>}
 */
export function applyReactiveControls(opts = {}) {
    const { baseParams = {}, deltas, controls = {}, intensity = 1, limits = {} } = opts;
    const result = { ...baseParams };

    if (!deltas) return result;

    const enabled = (key) => controls[key]?.enabled !== false;
    const gain = (key) => typeof controls[key]?.amount === 'number' ? controls[key].amount : 1;
    const applyClamp = (key, value) => {
        const min = limits[key]?.min ?? -Infinity;
        const max = limits[key]?.max ?? Infinity;
        return clamp(value, min, max);
    };

    if (enabled('density')) {
        result.gridDensity = applyClamp(
            'gridDensity',
            (baseParams.gridDensity ?? 0) + deltas.densityDelta * intensity * gain('density')
        );
    }

    if (enabled('morph')) {
        result.morphFactor = applyClamp(
            'morphFactor',
            (baseParams.morphFactor ?? 0) + deltas.morphDelta * intensity * gain('morph')
        );
    }

    if (enabled('color')) {
        const hue = (baseParams.hue ?? 0) + deltas.color.hueShift * intensity * gain('color');
        result.hue = ((hue % 360) + 360) % 360;
        result.saturation = applyClamp(
            'saturation',
            (baseParams.saturation ?? 0) + deltas.color.saturationPulse * intensity * gain('color')
        );
    }

    if (enabled('chaos')) {
        result.chaos = applyClamp(
            'chaos',
            (baseParams.chaos ?? 0) + deltas.cameraVelocity * 0.35 * intensity * gain('chaos')
        );
    }

    if (enabled('rotation')) {
        result.rot4dXW = (baseParams.rot4dXW ?? 0) + deltas.motionRotation.xw * intensity * gain('rotation');
        result.rot4dYW = (baseParams.rot4dYW ?? 0) + deltas.motionRotation.yw * intensity * gain('rotation');
        result.rot4dZW = (baseParams.rot4dZW ?? 0) + deltas.motionRotation.zw * intensity * gain('rotation');
    }

    if (enabled('camera')) {
        result.speed = applyClamp(
            'speed',
            (baseParams.speed ?? 0) + deltas.cameraVelocity * 0.3 * intensity * gain('camera')
        );
        result.cameraDrift = applyClamp(
            'cameraDrift',
            (baseParams.cameraDrift ?? 0) + deltas.cameraDrift * intensity * gain('camera')
        );
    }

    // Always expose journey metadata so UIs can map phases to overlays or copy decks
    result.journeyPhase = deltas.journey?.phase ?? baseParams.journeyPhase;
    result.journeySection = deltas.journey?.section ?? baseParams.journeySection;

    return result;
}

export default BehaviorSweepEngine;
