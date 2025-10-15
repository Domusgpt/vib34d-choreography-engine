/**
 * CameraLightingSystem
 * -------------------------------------------------------------
 * Generates adaptive camera orbits and cinematic lighting curves
 * for every visualizer. Presets blend audio dynamics, pointer
 * gestures, and control-bus offsets into smooth camera rails with
 * exposure, shutter, bloom, and key/fill/rim balances.
 */

const TWO_PI = Math.PI * 2;

const DEFAULT_STATE = {
    orbit: 0,
    elevation: 0.32,
    dolly: -0.2,
    roll: 0,
    exposure: 1.2,
    shutter: 0.6,
    bloom: 0.35,
    keyLight: 0.6,
    rimLight: 0.4,
    ambientLight: 0.25,
    vignette: 0.25
};

const PRESETS = {
    orbitSparkle: {
        orbitSpeed: 1.15,
        orbitMotionScale: 1.8,
        orbitSwingScale: 0.9,
        pointerOrbitScale: 1.25,
        elevationBase: 0.42,
        elevationBassScale: 0.35,
        elevationDimensionScale: 0.28,
        pointerElevationScale: 0.58,
        elevationResponse: 4.8,
        dollyBase: -0.22,
        dollyEnergyScale: -0.42,
        dollyBassScale: -0.3,
        dollyDimensionScale: -0.22,
        dollyResponse: 5.6,
        rollBase: 0,
        rollSwingScale: 0.7,
        rollTripletScale: 0.32,
        pointerRollScale: 0.52,
        rollResponse: 5.4,
        exposureBase: 1.35,
        exposureEnergyScale: 2.1,
        exposureAccentScale: 1.2,
        exposureDownbeatScale: 0.9,
        exposureResponse: 6.2,
        shutterBase: 0.58,
        shutterMotionScale: -0.45,
        shutterOnsetScale: -0.35,
        shutterChaosScale: -0.15,
        shutterResponse: 7.0,
        bloomBase: 0.42,
        bloomAccentScale: 0.35,
        bloomChaosScale: 0.25,
        bloomEnergyScale: 0.28,
        bloomResponse: 4.0,
        keyBase: 0.55,
        keyEnergyScale: 0.4,
        keyAccentScale: 0.3,
        keyResponse: 4.4,
        rimBase: 0.4,
        rimSwingScale: 0.3,
        rimChaosScale: 0.2,
        rimResponse: 4.8,
        ambientBase: 0.22,
        ambientDownbeatScale: -0.18,
        ambientEnergyScale: 0.12,
        ambientResponse: 3.8,
        vignetteBase: 0.28,
        vignetteEnergyScale: 0.18,
        vignetteResponse: 3.6
    },
    heartGlide: {
        orbitSpeed: 0.62,
        orbitMotionScale: 1.1,
        orbitSwingScale: 0.5,
        pointerOrbitScale: 0.9,
        elevationBase: 0.58,
        elevationBassScale: 0.28,
        elevationDimensionScale: 0.35,
        pointerElevationScale: 0.5,
        elevationResponse: 3.8,
        dollyBase: -0.14,
        dollyEnergyScale: -0.26,
        dollyBassScale: -0.18,
        dollyDimensionScale: -0.18,
        dollyResponse: 4.2,
        rollBase: 0.18,
        rollSwingScale: 0.42,
        rollTripletScale: 0.55,
        pointerRollScale: 0.45,
        rollResponse: 4.6,
        exposureBase: 1.05,
        exposureEnergyScale: 1.45,
        exposureAccentScale: 1.05,
        exposureDownbeatScale: 0.75,
        exposureResponse: 5.4,
        shutterBase: 0.75,
        shutterMotionScale: -0.3,
        shutterOnsetScale: -0.22,
        shutterChaosScale: -0.12,
        shutterResponse: 5.6,
        bloomBase: 0.48,
        bloomAccentScale: 0.42,
        bloomChaosScale: 0.2,
        bloomEnergyScale: 0.22,
        bloomResponse: 3.6,
        keyBase: 0.6,
        keyEnergyScale: 0.35,
        keyAccentScale: 0.28,
        keyResponse: 4.0,
        rimBase: 0.45,
        rimSwingScale: 0.35,
        rimChaosScale: 0.22,
        rimResponse: 4.4,
        ambientBase: 0.28,
        ambientDownbeatScale: -0.22,
        ambientEnergyScale: 0.1,
        ambientResponse: 3.4,
        vignetteBase: 0.32,
        vignetteEnergyScale: 0.14,
        vignetteResponse: 3.2
    },
    bassDropZoom: {
        orbitSpeed: 0.45,
        orbitMotionScale: 1.9,
        orbitSwingScale: 0.6,
        pointerOrbitScale: 1.5,
        elevationBase: 0.3,
        elevationBassScale: 0.55,
        elevationDimensionScale: 0.25,
        pointerElevationScale: 0.65,
        elevationResponse: 5.4,
        dollyBase: -0.38,
        dollyEnergyScale: -0.75,
        dollyBassScale: -0.55,
        dollyDimensionScale: -0.35,
        dollyResponse: 6.0,
        rollBase: -0.05,
        rollSwingScale: 0.6,
        rollTripletScale: 0.4,
        pointerRollScale: 0.7,
        rollResponse: 5.5,
        exposureBase: 1.6,
        exposureEnergyScale: 2.4,
        exposureAccentScale: 1.6,
        exposureDownbeatScale: 1.2,
        exposureResponse: 6.5,
        shutterBase: 0.48,
        shutterMotionScale: -0.5,
        shutterOnsetScale: -0.4,
        shutterChaosScale: -0.2,
        shutterResponse: 6.3,
        bloomBase: 0.55,
        bloomAccentScale: 0.4,
        bloomChaosScale: 0.32,
        bloomEnergyScale: 0.35,
        bloomResponse: 4.5,
        keyBase: 0.72,
        keyEnergyScale: 0.45,
        keyAccentScale: 0.35,
        keyResponse: 4.6,
        rimBase: 0.52,
        rimSwingScale: 0.4,
        rimChaosScale: 0.28,
        rimResponse: 5.0,
        ambientBase: 0.18,
        ambientDownbeatScale: -0.3,
        ambientEnergyScale: 0.15,
        ambientResponse: 3.9,
        vignetteBase: 0.38,
        vignetteEnergyScale: 0.22,
        vignetteResponse: 4.0
    }
};

function clamp(value, min, max) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return min;
    }
    if (typeof min === 'number') {
        value = Math.max(min, value);
    }
    if (typeof max === 'number') {
        value = Math.min(max, value);
    }
    return value;
}

function toNumber(value, fallback = 0) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'object' && value) {
        if (typeof value.value === 'number') {
            return value.value;
        }
        if (typeof value.level === 'number') {
            return value.level;
        }
    }
    return fallback;
}

function smooth(current, target, response, dt) {
    const rate = Math.max(0, response || 0);
    if (!Number.isFinite(current)) {
        return target;
    }
    const alpha = 1 - Math.exp(-dt * rate);
    return current + (target - current) * clamp(alpha, 0, 1);
}

function wrapAngle(angle) {
    let wrapped = angle;
    if (!Number.isFinite(wrapped)) {
        return 0;
    }
    wrapped = ((wrapped + Math.PI) % TWO_PI + TWO_PI) % TWO_PI - Math.PI;
    return wrapped;
}

function smoothAngle(current, target, response, dt) {
    const wrappedTarget = wrapAngle(target);
    const delta = wrapAngle(wrappedTarget - wrapAngle(current));
    const alpha = 1 - Math.exp(-dt * Math.max(0, response || 0));
    return wrapAngle(current + delta * clamp(alpha, 0, 1));
}

function easingForName(name) {
    switch (name) {
        case 'ease-in':
            return (t) => t * t;
        case 'ease-out':
            return (t) => 1 - Math.pow(1 - t, 2);
        case 'smoothstep':
            return (t) => t * t * (3 - 2 * t);
        case 'ease-in-out':
            return (t) => (t < 0.5
                ? 2 * t * t
                : 1 - Math.pow(-2 * t + 2, 2) / 2);
        default:
            return (t) => t;
    }
}

function blendPresetValues(from = {}, to = {}, t = 0) {
    const keys = new Set([
        ...Object.keys(from || {}),
        ...Object.keys(to || {})
    ]);
    const result = {};
    keys.forEach((key) => {
        const a = typeof from[key] === 'number' ? from[key] : 0;
        const b = typeof to[key] === 'number' ? to[key] : a;
        result[key] = a + (b - a) * t;
    });
    return result;
}

export class CameraLightingSystem {
    constructor(options = {}) {
        this.presets = {
            ...PRESETS,
            ...(options.presets || {})
        };
        this.state = { ...DEFAULT_STATE };
        this.manualOverrides = {};
        this.transition = null;
        this.pointerMemory = { x: 0, y: 0 };
        this.time = 0;
        this.currentPreset = options.defaultPreset && this.presets[options.defaultPreset]
            ? options.defaultPreset
            : 'orbitSparkle';
    }

    setPreset(name, overrides = {}) {
        if (!name || !this.presets[name]) {
            return;
        }
        this.currentPreset = name;
        this.manualOverrides = { ...overrides };
        this.transition = null;
    }

    transitionToPreset(name, options = {}) {
        if (!name || !this.presets[name]) {
            return;
        }

        const duration = typeof options.duration === 'number'
            ? Math.max(options.duration, 0.05)
            : 1.5;

        this.transition = {
            from: this.transition?.to || this.currentPreset,
            to: name,
            duration,
            elapsed: 0,
            easing: easingForName(options.easing),
            fromOverrides: { ...this.manualOverrides },
            toOverrides: { ...(options.overrides || {}) }
        };
    }

    getState() {
        return { ...this.state };
    }

    update(deltaTime = 16.6, audioData = {}, context = {}) {
        const dt = Math.max(0.001, deltaTime / 1000);
        this.time += dt;

        let preset = this.presets[this.currentPreset] || PRESETS.orbitSparkle;
        const pointer = context.pointer || {};
        const pointerX = ((pointer.x ?? 0.5) - 0.5) * 2;
        const pointerY = ((pointer.y ?? 0.5) - 0.5) * 2;

        const pointerBlend = 1 - Math.exp(-dt * 6.5);
        this.pointerMemory.x += (pointerX - this.pointerMemory.x) * pointerBlend;
        this.pointerMemory.y += (pointerY - this.pointerMemory.y) * pointerBlend;

        const cameraOffsets = context.cameraChannels || {};
        const lightingOffsets = context.lightingChannels || {};

        const bands = audioData?.bands || {};
        const rhythm = audioData?.rhythmPhases || {};
        const extreme = audioData?.extremeDynamics || {};
        const color = audioData?.colorChoreography || {};
        const onsetEvent = audioData?.onsetEvent;

        const energy = clamp(audioData?.rms ?? audioData?.energy ?? 0, 0, 1);
        const bass = clamp(toNumber(bands.bass), 0, 1);
        const mid = clamp(toNumber(bands.mid), 0, 1);
        const high = clamp(toNumber(bands.high), 0, 1);
        const accent = clamp(rhythm.accentPulse ?? 0, 0, 1);
        const downbeat = clamp(rhythm.downbeatPulse ?? rhythm.downbeat ?? 0, 0, 1);
        const swing = clamp(rhythm.swingPulse ?? 0, -1, 1);
        const triplet = clamp(rhythm.tripletPulse ?? 0, -1, 1);
        const motion = clamp(extreme.motionVelocity ?? 0, 0, 1);
        const chaos = clamp(extreme.chaosSurge ?? 0, 0, 1);
        const dimensionLift = clamp(extreme.dimensionLift ?? 0, 0, 1.5);
        const accentLuma = clamp(color.accentLuma ?? 0, 0, 1);
        const ribbon = clamp(color.ribbon ?? 0, -1, 1);
        const onsetStrength = clamp(
            typeof audioData?.onset === 'number'
                ? audioData.onset
                : onsetEvent?.strength ?? 0,
            0,
            1
        );

        let manual = this.manualOverrides || {};

        if (this.transition) {
            this.transition.elapsed += dt;
            const progress = clamp(this.transition.elapsed / this.transition.duration, 0, 1);
            const eased = typeof this.transition.easing === 'function'
                ? this.transition.easing(progress)
                : progress;

            const fromPreset = this.presets[this.transition.from] || preset;
            const toPreset = this.presets[this.transition.to] || preset;
            preset = blendPresetValues(fromPreset, toPreset, eased);
            manual = blendPresetValues(this.transition.fromOverrides || {}, this.transition.toOverrides || {}, eased);

            if (progress >= 0.999) {
                this.currentPreset = this.transition.to;
                this.manualOverrides = { ...this.transition.toOverrides };
                preset = this.presets[this.currentPreset] || PRESETS.orbitSparkle;
                manual = this.manualOverrides;
                this.transition = null;
            }
        }

        const orbitOffset = toNumber(cameraOffsets.cameraOrbit, 0);
        const orbitIncrement = (preset.orbitSpeed || 0)
            + motion * (preset.orbitMotionScale || 0)
            + swing * (preset.orbitSwingScale || 0)
            + this.pointerMemory.x * (preset.pointerOrbitScale || 0);
        this.state.orbit = wrapAngle(this.state.orbit + orbitIncrement * dt + orbitOffset);

        const elevationBase = (preset.elevationBase ?? DEFAULT_STATE.elevation)
            + (manual.elevation ?? 0)
            + toNumber(cameraOffsets.cameraElevation, 0);
        const elevationTarget = elevationBase
            + bass * (preset.elevationBassScale || 0)
            + dimensionLift * (preset.elevationDimensionScale || 0)
            + this.pointerMemory.y * (preset.pointerElevationScale || 0)
            + ribbon * 0.08;
        this.state.elevation = smooth(
            this.state.elevation,
            clamp(elevationTarget, -0.6, 1.25),
            preset.elevationResponse || 4.5,
            dt
        );

        const dollyBase = (preset.dollyBase ?? DEFAULT_STATE.dolly)
            + (manual.dolly ?? 0)
            + toNumber(cameraOffsets.cameraDolly, 0);
        const dollyTarget = dollyBase
            + energy * (preset.dollyEnergyScale || 0)
            + bass * (preset.dollyBassScale || 0)
            + dimensionLift * (preset.dollyDimensionScale || 0)
            + Math.abs(this.pointerMemory.x) * 0.08;
        this.state.dolly = smooth(
            this.state.dolly,
            clamp(dollyTarget, -1.1, 0.75),
            preset.dollyResponse || 5.0,
            dt
        );

        const rollBase = (preset.rollBase ?? DEFAULT_STATE.roll)
            + (manual.roll ?? 0)
            + toNumber(cameraOffsets.cameraRoll, 0);
        const rollTarget = rollBase
            + swing * (preset.rollSwingScale || 0)
            + triplet * (preset.rollTripletScale || 0)
            + this.pointerMemory.x * (preset.pointerRollScale || 0);
        this.state.roll = smoothAngle(
            this.state.roll,
            rollTarget,
            preset.rollResponse || 5.0,
            dt
        );

        const exposureBase = (preset.exposureBase ?? DEFAULT_STATE.exposure)
            + (manual.exposure ?? 0)
            + toNumber(lightingOffsets.exposure, 0);
        const exposureTarget = exposureBase
            + energy * (preset.exposureEnergyScale || 0)
            + accent * (preset.exposureAccentScale || 0)
            + downbeat * (preset.exposureDownbeatScale || 0)
            + accentLuma * 0.4;
        this.state.exposure = smooth(
            this.state.exposure,
            clamp(exposureTarget, 0.15, 4.2),
            preset.exposureResponse || 6.0,
            dt
        );

        const shutterBase = (preset.shutterBase ?? DEFAULT_STATE.shutter)
            + (manual.shutter ?? 0)
            + toNumber(lightingOffsets.shutter, 0);
        const shutterTarget = shutterBase
            + motion * (preset.shutterMotionScale || 0)
            + onsetStrength * (preset.shutterOnsetScale || 0)
            + chaos * (preset.shutterChaosScale || 0);
        this.state.shutter = smooth(
            this.state.shutter,
            clamp(shutterTarget, 0.2, 3.2),
            preset.shutterResponse || 6.0,
            dt
        );

        const bloomBase = (preset.bloomBase ?? DEFAULT_STATE.bloom)
            + (manual.bloom ?? 0)
            + toNumber(lightingOffsets.bloom, 0);
        const bloomTarget = bloomBase
            + accentLuma * (preset.bloomAccentScale || 0)
            + chaos * (preset.bloomChaosScale || 0)
            + energy * (preset.bloomEnergyScale || 0)
            + high * 0.18;
        this.state.bloom = smooth(
            this.state.bloom,
            clamp(bloomTarget, 0, 2.5),
            preset.bloomResponse || 4.0,
            dt
        );

        const keyBase = (preset.keyBase ?? DEFAULT_STATE.keyLight)
            + (manual.keyLight ?? 0)
            + toNumber(lightingOffsets.keyLight, 0);
        const keyTarget = keyBase
            + energy * (preset.keyEnergyScale || 0)
            + accent * (preset.keyAccentScale || 0)
            + Math.max(0, this.pointerMemory.y) * 0.25;
        this.state.keyLight = smooth(
            this.state.keyLight,
            clamp(keyTarget, 0, 2.2),
            preset.keyResponse || 4.2,
            dt
        );

        const rimBase = (preset.rimBase ?? DEFAULT_STATE.rimLight)
            + (manual.rimLight ?? 0)
            + toNumber(lightingOffsets.rimLight, 0);
        const rimTarget = rimBase
            + Math.abs(swing) * (preset.rimSwingScale || 0)
            + chaos * (preset.rimChaosScale || 0)
            + high * 0.25;
        this.state.rimLight = smooth(
            this.state.rimLight,
            clamp(rimTarget, 0, 2.0),
            preset.rimResponse || 4.5,
            dt
        );

        const ambientBase = (preset.ambientBase ?? DEFAULT_STATE.ambientLight)
            + (manual.ambientLight ?? 0)
            + toNumber(lightingOffsets.ambientLight, 0);
        const ambientTarget = ambientBase
            + energy * (preset.ambientEnergyScale || 0)
            + downbeat * (preset.ambientDownbeatScale || 0)
            - Math.max(0, bass - 0.6) * 0.1;
        this.state.ambientLight = smooth(
            this.state.ambientLight,
            clamp(ambientTarget, 0, 1),
            preset.ambientResponse || 3.6,
            dt
        );

        const vignetteBase = (preset.vignetteBase ?? DEFAULT_STATE.vignette)
            + (manual.vignette ?? 0)
            + toNumber(lightingOffsets.vignette, 0);
        const vignetteTarget = vignetteBase
            + energy * (preset.vignetteEnergyScale || 0)
            + Math.abs(this.pointerMemory.x) * 0.12;
        this.state.vignette = smooth(
            this.state.vignette,
            clamp(vignetteTarget, 0, 1),
            preset.vignetteResponse || 3.5,
            dt
        );

        return this.getState();
    }
}
