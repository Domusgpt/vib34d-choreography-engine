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
    vignette: 0.25,
    parallax: 0.0,
    focus: 0.8,
    focusSpread: 0.65,
    chromaticAberration: 0.12,
    lightTemperature: 0.5,
    shadowContrast: 0.45,
    fogDensity: 0.1,
    godrayIntensity: 0.2,
    filmGrain: 0.18,
    lensDistortion: 0.06,
    frameBlend: 0.28,
    lightWrap: 0.32,
    colorBleed: 0.26
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
        vignetteResponse: 3.6,
        parallaxBase: 0.18,
        parallaxEnergyScale: 0.28,
        parallaxPointerScale: 0.36,
        parallaxChaosScale: 0.18,
        parallaxResponse: 4.9,
        focusBase: 0.82,
        focusBassScale: -0.18,
        focusAccentScale: -0.12,
        focusDimensionScale: 0.32,
        focusPointerScale: -0.08,
        focusResponse: 4.6,
        focusSpreadBase: 0.68,
        focusSpreadEnergyScale: 0.38,
        focusSpreadChaosScale: 0.22,
        focusSpreadResponse: 5.2,
        chromaticBase: 0.12,
        chromaticEnergyScale: 0.32,
        chromaticHighScale: 0.35,
        chromaticChaosScale: 0.16,
        chromaticResponse: 6.3,
        temperatureBase: 0.54,
        temperatureEnergyScale: 0.22,
        temperatureHueScale: 0.34,
        temperatureResponse: 3.4,
        shadowContrastBase: 0.48,
        shadowContrastEnergyScale: 0.36,
        shadowContrastAccentScale: 0.22,
        shadowContrastResponse: 4.4,
        fogBase: 0.14,
        fogEnergyScale: -0.1,
        fogDimensionScale: 0.34,
        fogPointerScale: 0.16,
        fogResponse: 3.8,
        godrayBase: 0.24,
        godrayAccentScale: 0.42,
        godrayChaosScale: 0.24,
        godrayEnergyScale: 0.22,
        godrayResponse: 4.7,
        grainBase: 0.22,
        grainEnergyScale: 0.26,
        grainChaosScale: 0.18,
        grainPointerScale: 0.12,
        grainSwingScale: 0.08,
        grainResponse: 6.1,
        distortionBase: 0.07,
        distortionEnergyScale: 0.22,
        distortionDimensionScale: 0.12,
        distortionPointerScale: 0.18,
        distortionResponse: 5.2,
        frameBlendBase: 0.25,
        frameBlendAccentScale: 0.32,
        frameBlendChaosScale: 0.2,
        frameBlendEnergyScale: 0.24,
        frameBlendResponse: 5.6,
        lightWrapBase: 0.34,
        lightWrapEnergyScale: 0.28,
        lightWrapPointerScale: 0.18,
        lightWrapFocusScale: 0.24,
        lightWrapResponse: 4.8,
        colorBleedBase: 0.24,
        colorBleedEnergyScale: 0.26,
        colorBleedOrbitScale: 0.22,
        colorBleedChaosScale: 0.14,
        colorBleedResponse: 5.4
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
        vignetteResponse: 3.2,
        parallaxBase: 0.12,
        parallaxEnergyScale: 0.22,
        parallaxPointerScale: 0.42,
        parallaxChaosScale: 0.12,
        parallaxResponse: 4.2,
        focusBase: 1.02,
        focusBassScale: -0.12,
        focusAccentScale: -0.15,
        focusDimensionScale: 0.28,
        focusPointerScale: -0.2,
        focusResponse: 4.1,
        focusSpreadBase: 0.82,
        focusSpreadEnergyScale: 0.28,
        focusSpreadChaosScale: 0.18,
        focusSpreadResponse: 4.9,
        chromaticBase: 0.08,
        chromaticEnergyScale: 0.22,
        chromaticHighScale: 0.28,
        chromaticChaosScale: 0.12,
        chromaticResponse: 5.8,
        temperatureBase: 0.62,
        temperatureEnergyScale: 0.18,
        temperatureHueScale: 0.28,
        temperatureResponse: 3.0,
        shadowContrastBase: 0.42,
        shadowContrastEnergyScale: 0.32,
        shadowContrastAccentScale: 0.24,
        shadowContrastResponse: 3.8,
        fogBase: 0.18,
        fogEnergyScale: -0.06,
        fogDimensionScale: 0.28,
        fogPointerScale: 0.22,
        fogResponse: 3.2,
        godrayBase: 0.18,
        godrayAccentScale: 0.38,
        godrayChaosScale: 0.18,
        godrayEnergyScale: 0.18,
        godrayResponse: 4.0,
        grainBase: 0.18,
        grainEnergyScale: 0.2,
        grainChaosScale: 0.14,
        grainPointerScale: 0.08,
        grainSwingScale: 0.12,
        grainResponse: 5.5,
        distortionBase: 0.04,
        distortionEnergyScale: 0.16,
        distortionDimensionScale: 0.1,
        distortionPointerScale: 0.12,
        distortionResponse: 4.6,
        frameBlendBase: 0.32,
        frameBlendAccentScale: 0.26,
        frameBlendChaosScale: 0.16,
        frameBlendEnergyScale: 0.2,
        frameBlendResponse: 5.1,
        lightWrapBase: 0.38,
        lightWrapEnergyScale: 0.22,
        lightWrapPointerScale: 0.16,
        lightWrapFocusScale: 0.2,
        lightWrapResponse: 4.4,
        colorBleedBase: 0.28,
        colorBleedEnergyScale: 0.18,
        colorBleedOrbitScale: 0.18,
        colorBleedChaosScale: 0.1,
        colorBleedResponse: 4.8
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
        vignetteResponse: 4.0,
        parallaxBase: 0.26,
        parallaxEnergyScale: 0.42,
        parallaxPointerScale: 0.32,
        parallaxChaosScale: 0.26,
        parallaxResponse: 5.3,
        focusBase: 0.68,
        focusBassScale: -0.25,
        focusAccentScale: -0.18,
        focusDimensionScale: 0.35,
        focusPointerScale: -0.05,
        focusResponse: 5.0,
        focusSpreadBase: 0.58,
        focusSpreadEnergyScale: 0.45,
        focusSpreadChaosScale: 0.32,
        focusSpreadResponse: 5.6,
        chromaticBase: 0.16,
        chromaticEnergyScale: 0.38,
        chromaticHighScale: 0.42,
        chromaticChaosScale: 0.22,
        chromaticResponse: 6.6,
        temperatureBase: 0.48,
        temperatureEnergyScale: 0.28,
        temperatureHueScale: 0.42,
        temperatureResponse: 3.6,
        shadowContrastBase: 0.54,
        shadowContrastEnergyScale: 0.42,
        shadowContrastAccentScale: 0.28,
        shadowContrastResponse: 4.8,
        fogBase: 0.12,
        fogEnergyScale: -0.14,
        fogDimensionScale: 0.45,
        fogPointerScale: 0.12,
        fogResponse: 4.1,
        godrayBase: 0.32,
        godrayAccentScale: 0.48,
        godrayChaosScale: 0.32,
        godrayEnergyScale: 0.24,
        godrayResponse: 5.2,
        grainBase: 0.28,
        grainEnergyScale: 0.32,
        grainChaosScale: 0.24,
        grainPointerScale: 0.16,
        grainSwingScale: 0.1,
        grainResponse: 6.4,
        distortionBase: 0.1,
        distortionEnergyScale: 0.28,
        distortionDimensionScale: 0.18,
        distortionPointerScale: 0.2,
        distortionResponse: 5.8,
        frameBlendBase: 0.22,
        frameBlendAccentScale: 0.38,
        frameBlendChaosScale: 0.26,
        frameBlendEnergyScale: 0.32,
        frameBlendResponse: 6.0,
        lightWrapBase: 0.42,
        lightWrapEnergyScale: 0.34,
        lightWrapPointerScale: 0.2,
        lightWrapFocusScale: 0.3,
        lightWrapResponse: 5.2,
        colorBleedBase: 0.32,
        colorBleedEnergyScale: 0.3,
        colorBleedOrbitScale: 0.24,
        colorBleedChaosScale: 0.2,
        colorBleedResponse: 5.8
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
        const pointerRadius = clamp(
            Math.sqrt((this.pointerMemory.x ** 2) + (this.pointerMemory.y ** 2)),
            0,
            1.6
        );

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
        const colorOrbit = clamp(((color.orbit ?? 0.5) - 0.5) * 2, -1, 1);
        const colorEnergy = clamp(color.energy ?? 0, 0, 1);
        const colorPointer = clamp(color.pointerRadius ?? 0, 0, 1.5);
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

        const parallaxBase = (preset.parallaxBase ?? DEFAULT_STATE.parallax)
            + (manual.parallax ?? manual.cameraParallax ?? 0)
            + toNumber(cameraOffsets.cameraParallax, 0);
        const parallaxTarget = parallaxBase
            + energy * (preset.parallaxEnergyScale || 0)
            + pointerRadius * (preset.parallaxPointerScale || 0)
            + chaos * (preset.parallaxChaosScale || 0)
            + colorPointer * 0.12;
        this.state.parallax = smooth(
            this.state.parallax,
            clamp(parallaxTarget, -1.2, 1.2),
            preset.parallaxResponse || 4.5,
            dt
        );

        const focusBase = (preset.focusBase ?? DEFAULT_STATE.focus)
            + (manual.focus ?? manual.focusDistance ?? 0)
            + toNumber(lightingOffsets.focusDistance, 0);
        const focusTarget = focusBase
            + bass * (preset.focusBassScale || 0)
            + accent * (preset.focusAccentScale || 0)
            + dimensionLift * (preset.focusDimensionScale || 0)
            + pointerRadius * (preset.focusPointerScale || 0);
        this.state.focus = smooth(
            this.state.focus,
            clamp(focusTarget, 0.15, 3.5),
            preset.focusResponse || 4.4,
            dt
        );

        const focusSpreadBase = (preset.focusSpreadBase ?? DEFAULT_STATE.focusSpread)
            + (manual.focusSpread ?? manual.depthOfField ?? 0)
            + toNumber(lightingOffsets.focusSpread, 0);
        const focusSpreadTarget = focusSpreadBase
            + energy * (preset.focusSpreadEnergyScale || 0)
            + chaos * (preset.focusSpreadChaosScale || 0)
            - onsetStrength * 0.12;
        this.state.focusSpread = smooth(
            this.state.focusSpread,
            clamp(focusSpreadTarget, 0.05, 4.2),
            preset.focusSpreadResponse || 4.9,
            dt
        );

        const chromaBase = (preset.chromaticBase ?? DEFAULT_STATE.chromaticAberration)
            + (manual.chromaticAberration ?? manual.aberration ?? 0)
            + toNumber(lightingOffsets.chromaticAberration, 0);
        const chromaTarget = chromaBase
            + energy * (preset.chromaticEnergyScale || 0)
            + high * (preset.chromaticHighScale || 0)
            + chaos * (preset.chromaticChaosScale || 0);
        this.state.chromaticAberration = smooth(
            this.state.chromaticAberration,
            clamp(chromaTarget, 0, 1.6),
            preset.chromaticResponse || 6.0,
            dt
        );

        const temperatureBase = (preset.temperatureBase ?? DEFAULT_STATE.lightTemperature)
            + (manual.lightTemperature ?? manual.colorTemperature ?? 0)
            + toNumber(lightingOffsets.lightTemperature, 0);
        const temperatureTarget = temperatureBase
            + energy * (preset.temperatureEnergyScale || 0)
            + colorOrbit * (preset.temperatureHueScale || 0)
            + colorEnergy * 0.25;
        this.state.lightTemperature = smooth(
            this.state.lightTemperature,
            clamp(temperatureTarget, 0, 1.5),
            preset.temperatureResponse || 3.2,
            dt
        );

        const shadowBase = (preset.shadowContrastBase ?? DEFAULT_STATE.shadowContrast)
            + (manual.shadowContrast ?? manual.shadow ?? 0)
            + toNumber(lightingOffsets.shadowContrast, 0);
        const shadowTarget = shadowBase
            + energy * (preset.shadowContrastEnergyScale || 0)
            + accent * (preset.shadowContrastAccentScale || 0)
            + colorPointer * 0.2;
        this.state.shadowContrast = smooth(
            this.state.shadowContrast,
            clamp(shadowTarget, 0, 2.2),
            preset.shadowContrastResponse || 4.2,
            dt
        );

        const fogBase = (preset.fogBase ?? DEFAULT_STATE.fogDensity)
            + (manual.fogDensity ?? manual.fog ?? 0)
            + toNumber(lightingOffsets.fogDensity, 0);
        const fogTarget = fogBase
            + energy * (preset.fogEnergyScale || 0)
            + dimensionLift * (preset.fogDimensionScale || 0)
            + pointerRadius * (preset.fogPointerScale || 0);
        this.state.fogDensity = smooth(
            this.state.fogDensity,
            clamp(fogTarget, 0, 1.6),
            preset.fogResponse || 3.6,
            dt
        );

        const godrayBase = (preset.godrayBase ?? DEFAULT_STATE.godrayIntensity)
            + (manual.godrayIntensity ?? manual.godrays ?? 0)
            + toNumber(lightingOffsets.godrayIntensity, 0);
        const godrayTarget = godrayBase
            + accent * (preset.godrayAccentScale || 0)
            + chaos * (preset.godrayChaosScale || 0)
            + energy * (preset.godrayEnergyScale || 0)
            + accentLuma * 0.35;
        this.state.godrayIntensity = smooth(
            this.state.godrayIntensity,
            clamp(godrayTarget, 0, 2.0),
            preset.godrayResponse || 4.6,
            dt
        );

        const grainBase = (preset.grainBase ?? DEFAULT_STATE.filmGrain)
            + (manual.filmGrain ?? manual.grain ?? 0)
            + toNumber(lightingOffsets.filmGrain, 0);
        const grainTarget = grainBase
            + energy * (preset.grainEnergyScale || 0)
            + chaos * (preset.grainChaosScale || 0)
            + pointerRadius * (preset.grainPointerScale || 0)
            + Math.abs(swing) * (preset.grainSwingScale || 0);
        this.state.filmGrain = smooth(
            this.state.filmGrain,
            clamp(grainTarget, 0, 1.8),
            preset.grainResponse || 5.6,
            dt
        );

        const distortionBase = (preset.distortionBase ?? DEFAULT_STATE.lensDistortion)
            + (manual.lensDistortion ?? manual.distortion ?? 0)
            + toNumber(lightingOffsets.lensDistortion, 0);
        const distortionTarget = distortionBase
            + energy * (preset.distortionEnergyScale || 0)
            + dimensionLift * (preset.distortionDimensionScale || 0)
            + pointerRadius * (preset.distortionPointerScale || 0);
        this.state.lensDistortion = smooth(
            this.state.lensDistortion,
            clamp(distortionTarget, -0.5, 0.9),
            preset.distortionResponse || 5.0,
            dt
        );

        const frameBlendBase = (preset.frameBlendBase ?? DEFAULT_STATE.frameBlend)
            + (manual.frameBlend ?? manual.motionBlend ?? 0)
            + toNumber(lightingOffsets.frameBlend, 0);
        const frameBlendTarget = frameBlendBase
            + accent * (preset.frameBlendAccentScale || 0)
            + chaos * (preset.frameBlendChaosScale || 0)
            + energy * (preset.frameBlendEnergyScale || 0)
            + onsetStrength * 0.12;
        this.state.frameBlend = smooth(
            this.state.frameBlend,
            clamp(frameBlendTarget, 0, 1.2),
            preset.frameBlendResponse || 5.2,
            dt
        );

        const lightWrapBase = (preset.lightWrapBase ?? DEFAULT_STATE.lightWrap)
            + (manual.lightWrap ?? manual.wrap ?? 0)
            + toNumber(lightingOffsets.lightWrap, 0);
        const lightWrapTarget = lightWrapBase
            + energy * (preset.lightWrapEnergyScale || 0)
            + pointerRadius * (preset.lightWrapPointerScale || 0)
            + this.state.focus * (preset.lightWrapFocusScale || 0) * 0.2;
        this.state.lightWrap = smooth(
            this.state.lightWrap,
            clamp(lightWrapTarget, 0, 1.6),
            preset.lightWrapResponse || 4.6,
            dt
        );

        const colorBleedBase = (preset.colorBleedBase ?? DEFAULT_STATE.colorBleed)
            + (manual.colorBleed ?? manual.colorWrap ?? 0)
            + toNumber(lightingOffsets.colorBleed, 0);
        const colorBleedTarget = colorBleedBase
            + energy * (preset.colorBleedEnergyScale || 0)
            + colorOrbit * (preset.colorBleedOrbitScale || 0)
            + chaos * (preset.colorBleedChaosScale || 0)
            + colorEnergy * 0.18;
        this.state.colorBleed = smooth(
            this.state.colorBleed,
            clamp(colorBleedTarget, 0, 1.6),
            preset.colorBleedResponse || 5.0,
            dt
        );

        return this.getState();
    }
}
