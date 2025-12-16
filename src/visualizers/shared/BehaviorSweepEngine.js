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
 * @property {{ hueShift: number, saturationPulse: number, spark: number }} color
 * @property {{ glow: number, bloom: number, strobe: number }} light
 * @property {{ parallaxDepth: number, gridShift: number, shimmer: number, warp: number, haze: number }} atmosphere
 * @property {{ trail: number, chroma: number, flare: number }} fx
 * @property {{ bass: number, mid: number, air: number }} tone
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
 * @property {BehaviorControl} [atmosphere]
 * @property {BehaviorControl} [light]
 * @property {BehaviorControl} [fx]
 */

const PRESETS = {
    cinematic: {
        motionGain: 0.9,
        colorGain: 0.8,
        morphGain: 0.85,
        densityGain: 1.0,
        beatKick: 0.3,
        onsetTwist: 0.45,
        parallaxGain: 0.45,
        shimmerGain: 0.7,
        journeyLength: 16_000
    },
    hyper: {
        motionGain: 1.3,
        colorGain: 1.2,
        morphGain: 1.4,
        densityGain: 1.25,
        beatKick: 0.5,
        onsetTwist: 0.7,
        parallaxGain: 0.8,
        shimmerGain: 1.0,
        journeyLength: 12_000
    },
    mellow: {
        motionGain: 0.6,
        colorGain: 0.6,
        morphGain: 0.5,
        densityGain: 0.65,
        beatKick: 0.2,
        onsetTwist: 0.25,
        parallaxGain: 0.25,
        shimmerGain: 0.5,
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
Atmosphere: <on/off> amount <0-2> (parallax + shimmer)
Light: <on/off> amount <0-2> (glow + bloom)
FX: <on/off> amount <0-2> (trails + chroma)
Tone: <bass|mid|air> amount <0-2> (spectrum bias)
Notes: <one short sentence about the vibe>`;

const CONTROL_KEYS = ['density', 'morph', 'color', 'chaos', 'rotation', 'camera', 'atmosphere', 'light', 'fx', 'tone'];

const CONTROL_ALIAS_MAP = {
    density: 'density',
    morph: 'morph',
    color: 'color',
    hue: 'color',
    saturation: 'color',
    chaos: 'chaos',
    rotation: 'rotation',
    camera: 'camera',
    speed: 'camera',
    atmosphere: 'atmosphere',
    parallax: 'atmosphere',
    shimmer: 'atmosphere',
    light: 'light',
    glow: 'light',
    bloom: 'light',
    strobe: 'light',
    fx: 'fx',
    trail: 'fx',
    chroma: 'fx',
    flare: 'fx',
    tone: 'tone',
    spectrum: 'tone',
    balance: 'tone'
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

function safeBandEntries(bands) {
    return Object.entries(bands || {});
}

/**
 * Build an LLM-friendly instruction block that can be copy/pasted along with a user prompt.
 * @param {string} userPrompt
 */
export function createBehaviorPrompt(userPrompt = '') {
    return `${LLM_BEHAVIOR_PROMPT_TEMPLATE}\n\nUser prompt: ${userPrompt}`;
}

/**
 * Apply gain/gating to an incoming audio frame before feeding the sweep engine.
 * Useful for UI surfaces that expose calibration sliders.
 * @param {AudioFrame} audioFrame
 * @param {{ gain?: number, gate?: number, floor?: number }} calibration
 * @returns {AudioFrame & { peak?: number, gateActive?: boolean }}
 */
export function calibrateAudioFrame(audioFrame = {}, calibration = {}) {
    const gain = calibration.gain ?? 1;
    const gate = calibration.gate ?? 0;
    const floor = calibration.floor ?? 0;

    const bands = {};
    let peak = 0;

    safeBandEntries(audioFrame.bands).forEach(([key, value]) => {
        const v = Math.max(0, bandValue(value) * gain);
        const gated = v < gate ? 0 : v;
        bands[key] = { ...(typeof value === 'object' ? value : {}), value: gated };
        peak = Math.max(peak, gated);
    });

    const rms = Math.max(0, (audioFrame.rms ?? 0) * gain);
    peak = Math.max(peak, rms);

    return {
        ...audioFrame,
        bands,
        rms,
        peak,
        gateActive: rms < Math.max(gate, floor)
    };
}

/**
 * Derive signal health metadata for UI badges/meters.
 * @param {AudioFrame} audioFrame
 * @param {{ silenceFloor?: number, clipThreshold?: number }} opts
 */
export function computeSignalHealth(audioFrame = {}, opts = {}) {
    const silenceFloor = opts.silenceFloor ?? 0.01;
    const clipThreshold = opts.clipThreshold ?? 0.95;

    const bandValues = safeBandEntries(audioFrame.bands).map(([, b]) => bandValue(b));
    const peak = Math.max(audioFrame.peak ?? 0, ...bandValues, audioFrame.rms ?? 0);
    const activeBands = bandValues.filter((v) => v > silenceFloor * 0.5).length;
    const coverage = bandValues.length ? activeBands / bandValues.length : 0;

    const isSilent = (audioFrame.rms ?? 0) < silenceFloor && peak < silenceFloor * 1.5;
    const isClipping = peak > clipThreshold;

    let suggestedGain = 1;
    if (audioFrame.rms && audioFrame.rms < 0.06) {
        suggestedGain = clamp(1.5, 1, 3);
    } else if (audioFrame.rms && audioFrame.rms > 0.45) {
        suggestedGain = clamp(0.65, 0.25, 1.2);
    }

    return {
        peak,
        coverage,
        isSilent,
        isClipping,
        suggestedGain,
        rms: audioFrame.rms ?? 0
    };
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

        // Tone profile derived from spectrum to bias colour/atmosphere downstream
        const tone = {
            bass: clamp(bass * 1.05 + energy * 0.3, 0, 1.5),
            mid: clamp((mid + lowMid * 0.6) * 0.9 + onsetStrength * 0.15, 0, 1.5),
            air: clamp((high + (bands.air ? bandValue(bands.air) : high * 0.35)) * 0.9 + onsetStrength * 0.25, 0, 1.6)
        };

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
        const colorSpark = clamp(onset * 0.85 + high * 0.5, 0, 1) * config.colorGain;

        // Light/aura pulses for bloom overlays and volumetric glow
        const glow = clamp((this.state.colorEnergy * 0.4 + energy * 0.35 + phase * 0.2) * config.colorGain, 0, 1.8);
        const bloom = clamp((high * 0.9 + onset * 0.8 + beatPulse * 0.6) * config.colorGain, 0, 2.0);
        const strobe = clamp((onsetDetected ? onsetStrength * 1.1 : beatPulse * 0.65), 0, 1.25) * config.colorGain;

        // Atmosphere/parallax sweeps for volumetric systems
        const parallaxDepth = clamp((mid * 0.35 + high * 0.25 + phase * 0.4) * config.parallaxGain, -1, 1);
        const gridShift = clamp((bass * 0.45 - high * 0.15 + beatPulse * 0.4) * config.motionGain, -1.5, 1.5);
        const shimmer = clamp((high * 0.9 + onset * 0.7) * config.shimmerGain, 0, 1.4);
        const warp = clamp((bass * 0.35 + phase * 0.45 - high * 0.2) * config.motionGain, -1.25, 1.25);
        const haze = clamp((energy * 0.5 + mid * 0.35 + colorSpark * 0.25) * config.shimmerGain, 0, 1.6);

        // FX overlays for afterimage trails and chromatic fringes
        const trail = clamp((energy * 0.6 + bass * 0.35 + beatPulse * 0.6) * config.motionGain, 0, 1.6);
        const chroma = clamp((high * 0.85 + onset * 0.65 + phase * 0.25) * config.colorGain, 0, 1.8);
        const flare = clamp((beatPulse * 0.8 + onset * 0.9 + colorSpark * 0.6) * config.colorGain, 0, 2.2);

        return {
            motionRotation: rotation,
            cameraDrift: (bass * 0.15 + phase * 0.05) * config.motionGain,
            cameraVelocity: (energy * 0.9 + beatPulse * config.beatKick) * config.motionGain,
            morphDelta,
            densityDelta,
            color: { hueShift, saturationPulse, spark: colorSpark },
            light: { glow, bloom, strobe },
            atmosphere: { parallaxDepth, gridShift, shimmer, warp, haze },
            fx: { trail, chroma, flare },
            tone,
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

    if (enabled('atmosphere')) {
        result.parallaxDepth = applyClamp(
            'parallaxDepth',
            (baseParams.parallaxDepth ?? 0) + deltas.atmosphere.parallaxDepth * intensity * gain('atmosphere')
        );
        result.gridDensityShift = applyClamp(
            'gridDensityShift',
            (baseParams.gridDensityShift ?? 0) + deltas.atmosphere.gridShift * intensity * gain('atmosphere')
        );
        result.shimmer = applyClamp(
            'shimmer',
            (baseParams.shimmer ?? 0) + deltas.atmosphere.shimmer * intensity * gain('atmosphere')
        );
        result.warp = applyClamp(
            'warp',
            (baseParams.warp ?? 0) + deltas.atmosphere.warp * intensity * gain('atmosphere')
        );
        result.haze = applyClamp(
            'haze',
            (baseParams.haze ?? 0) + deltas.atmosphere.haze * intensity * gain('atmosphere')
        );
    }

    if (enabled('fx')) {
        result.trailPersistence = applyClamp(
            'trailPersistence',
            (baseParams.trailPersistence ?? 0) + deltas.fx.trail * intensity * gain('fx')
        );
        result.chromaFringe = applyClamp(
            'chromaFringe',
            (baseParams.chromaFringe ?? 0) + deltas.fx.chroma * intensity * gain('fx')
        );
        result.flare = applyClamp(
            'flare',
            (baseParams.flare ?? 0) + deltas.fx.flare * intensity * gain('fx')
        );
    }

    if (enabled('light')) {
        result.glow = applyClamp(
            'glow',
            (baseParams.glow ?? 0) + deltas.light.glow * intensity * gain('light')
        );
        result.bloom = applyClamp(
            'bloom',
            (baseParams.bloom ?? 0) + deltas.light.bloom * intensity * gain('light')
        );
        result.strobe = applyClamp(
            'strobe',
            (baseParams.strobe ?? 0) + deltas.light.strobe * intensity * gain('light')
        );
    }

    // Always expose journey metadata so UIs can map phases to overlays or copy decks
    result.journeyPhase = deltas.journey?.phase ?? baseParams.journeyPhase;
    result.journeySection = deltas.journey?.section ?? baseParams.journeySection;

    return result;
}

export default BehaviorSweepEngine;
