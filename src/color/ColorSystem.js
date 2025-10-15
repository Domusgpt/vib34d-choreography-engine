/**
 * Hypercolor Palette System
 * -------------------------------------------------------------
 * Drives chroma choreography for every visualizer. Palettes are
 * curated sets of joyful, high-energy colours that blend in CIE L*a*b*
 * space so transitions remain smooth while embracing extreme dynamics.
 */

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const D65 = { X: 95.047, Y: 100.0, Z: 108.883 };

function srgbToLinear(component) {
    if (component <= 0.04045) {
        return component / 12.92;
    }
    return Math.pow((component + 0.055) / 1.055, 2.4);
}

function linearToSrgb(component) {
    if (component <= 0.0031308) {
        return 12.92 * component;
    }
    return 1.055 * Math.pow(component, 1 / 2.4) - 0.055;
}

function hexToRgb(hex) {
    if (typeof hex !== 'string') {
        return [0, 0, 0];
    }

    const normalized = hex.trim().replace('#', '');
    if (normalized.length === 3) {
        const r = parseInt(normalized[0] + normalized[0], 16);
        const g = parseInt(normalized[1] + normalized[1], 16);
        const b = parseInt(normalized[2] + normalized[2], 16);
        return [r / 255, g / 255, b / 255];
    }

    if (normalized.length !== 6) {
        return [0, 0, 0];
    }

    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return [r / 255, g / 255, b / 255];
}

function rgbToXyz([r, g, b]) {
    const rl = srgbToLinear(r);
    const gl = srgbToLinear(g);
    const bl = srgbToLinear(b);

    const X = rl * 0.4124 + gl * 0.3576 + bl * 0.1805;
    const Y = rl * 0.2126 + gl * 0.7152 + bl * 0.0722;
    const Z = rl * 0.0193 + gl * 0.1192 + bl * 0.9505;
    return { X: X * 100, Y: Y * 100, Z: Z * 100 };
}

function xyzToLab({ X, Y, Z }) {
    const x = X / D65.X;
    const y = Y / D65.Y;
    const z = Z / D65.Z;

    const fx = x > 0.008856 ? Math.cbrt(x) : (7.787 * x) + (16 / 116);
    const fy = y > 0.008856 ? Math.cbrt(y) : (7.787 * y) + (16 / 116);
    const fz = z > 0.008856 ? Math.cbrt(z) : (7.787 * z) + (16 / 116);

    return {
        L: (116 * fy) - 16,
        a: 500 * (fx - fy),
        b: 200 * (fy - fz)
    };
}

function labToXyz({ L, a, b }) {
    const fy = (L + 16) / 116;
    const fx = a / 500 + fy;
    const fz = fy - b / 200;

    const fx3 = fx ** 3;
    const fy3 = fy ** 3;
    const fz3 = fz ** 3;

    const xr = fx3 > 0.008856 ? fx3 : (fx - 16 / 116) / 7.787;
    const yr = L > (903.3 * 0.008856) ? fy3 : L / 903.3;
    const zr = fz3 > 0.008856 ? fz3 : (fz - 16 / 116) / 7.787;

    return {
        X: xr * D65.X,
        Y: yr * D65.Y,
        Z: zr * D65.Z
    };
}

function xyzToRgb({ X, Y, Z }) {
    const x = X / 100;
    const y = Y / 100;
    const z = Z / 100;

    let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    let b = x * 0.0557 + y * -0.2040 + z * 1.0570;

    r = linearToSrgb(r);
    g = linearToSrgb(g);
    b = linearToSrgb(b);

    return [clamp01(r), clamp01(g), clamp01(b)];
}

function hexToLab(hex) {
    return xyzToLab(rgbToXyz(hexToRgb(hex)));
}

function labToRgb(lab) {
    return xyzToRgb(labToXyz(lab));
}

function mixLab(a, b, t) {
    if (!a) return b;
    if (!b) return a;
    const mix = Math.max(0, Math.min(1, t));
    return {
        L: a.L + (b.L - a.L) * mix,
        a: a.a + (b.a - a.a) * mix,
        b: a.b + (b.b - a.b) * mix
    };
}

function scaleLabSaturation(lab, scale) {
    return {
        L: lab.L,
        a: lab.a * scale,
        b: lab.b * scale
    };
}

function adjustLab(lab, lightnessShift = 0, saturationScale = 1) {
    const scaled = scaleLabSaturation(lab, saturationScale);
    return {
        L: Math.min(100, Math.max(0, scaled.L + lightnessShift)),
        a: scaled.a,
        b: scaled.b
    };
}

function resamplePalette(hexColors = [], samples = 6) {
    const labs = hexColors.map((color) => hexToLab(color));
    if (labs.length === 0) {
        labs.push(hexToLab('#ffffff'));
        labs.push(hexToLab('#000000'));
    }

    const points = [];
    for (let i = 0; i < samples; i += 1) {
        const t = samples === 1 ? 0 : i / (samples - 1);
        const scaled = t * (labs.length - 1);
        const idx = Math.floor(scaled);
        const frac = scaled - idx;
        const current = labs[idx];
        const next = labs[Math.min(idx + 1, labs.length - 1)];
        points.push(mixLab(current, next, frac));
    }
    return points;
}

function clonePaletteState(state) {
    return {
        gradientLabs: state.gradientLabs.map((lab) => ({ ...lab })),
        accentLab: { ...state.accentLab },
        shadowLab: { ...state.shadowLab }
    };
}

const HYPERCOLOR_PALETTES = {
    kawaiiPastel: {
        name: 'Pastel Kawaii',
        description: 'Soft candy clouds with optimistic sparkle.',
        colors: ['#FFE6F7', '#FF9AA2', '#FFDAC1', '#E2F0CB', '#B5EAD7'],
        accent: '#FF6F91',
        shadow: '#6B5B95',
        energyRange: [0.2, 0.6],
        chaosRange: [0.0, 0.45]
    },
    neonRave: {
        name: 'Neon Rave',
        description: 'Hyper-saturated lasers and club strobes.',
        colors: ['#0400FF', '#6F00FF', '#FF007C', '#FFB800', '#00FFC6'],
        accent: '#FF3366',
        shadow: '#11001F',
        energyRange: [0.55, 1.0],
        chaosRange: [0.4, 1.0]
    },
    deepSpace: {
        name: 'Deep Space Bloom',
        description: 'Cosmic gradients with nebula violets and teals.',
        colors: ['#0B132B', '#1C2541', '#3A506B', '#5BC0BE', '#FFE066'],
        accent: '#F25F5C',
        shadow: '#05060B',
        energyRange: [0.25, 0.7],
        chaosRange: [0.2, 0.7]
    },
    auroraDreams: {
        name: 'Aurora Dreams',
        description: 'Northern lights ribbons with iridescent shimmer.',
        colors: ['#051937', '#004d7a', '#008793', '#00bf72', '#a8eb12'],
        accent: '#FFCF71',
        shadow: '#02101F',
        energyRange: [0.3, 0.75],
        chaosRange: [0.1, 0.6]
    },
    cosmicSorbet: {
        name: 'Cosmic Sorbet',
        description: 'Iridescent sherbet swirls with glitter pops.',
        colors: ['#FFB3FF', '#FF9D76', '#FFD452', '#9CEAEF', '#7480FF'],
        accent: '#FF61D2',
        shadow: '#2A1E5C',
        energyRange: [0.4, 0.9],
        chaosRange: [0.2, 0.8]
    }
};

function paletteStateFromDefinition(definition, gradientSize) {
    return {
        gradientLabs: resamplePalette(definition.colors, gradientSize),
        accentLab: hexToLab(definition.accent || definition.colors[0]),
        shadowLab: hexToLab(definition.shadow || '#111111')
    };
}

function weightForRange(range = [0, 1], value = 0.5) {
    const [min, max] = range;
    const center = (min + max) / 2;
    const span = Math.max(0.0001, (max - min) / 2);
    const distance = Math.abs(value - center);
    return Math.max(0, 1 - distance / span);
}

export class ColorSystem {
    constructor(options = {}) {
        this.currentMode = options.mode || 'hypercolor';
        this.availablePalettes = { ...HYPERCOLOR_PALETTES, ...(options.palettes || {}) };
        this.gradientSize = options.gradientSize || 6;

        const initialKey = (options.initialPalette && this.availablePalettes[options.initialPalette])
            ? options.initialPalette
            : 'kawaiiPastel';

        this.currentPaletteKey = initialKey;
        this.targetPaletteKey = initialKey;

        const initialState = paletteStateFromDefinition(
            this.availablePalettes[initialKey],
            this.gradientSize
        );

        this.currentPalette = clonePaletteState(initialState);
        this.targetPalette = clonePaletteState(initialState);

        this.transitionSpeed = options.transitionSpeed || 3.2;
        this.elapsed = 0;
        this.dynamicOrbit = 0;
        this.intensityMemory = 0;
        this.lastPaletteShift = 0;
        this.minimumShiftInterval = options.minimumShiftInterval || 3.6;
    }

    registerPalette(key, paletteDefinition) {
        if (!key || !paletteDefinition) {
            return;
        }
        this.availablePalettes[key] = paletteDefinition;
        if (!this.currentPaletteKey) {
            this.setPalette(key, { immediate: true });
        }
    }

    setMode(mode) {
        this.currentMode = mode;
    }

    setPalette(key, options = {}) {
        if (!this.availablePalettes[key]) {
            return;
        }

        this.targetPaletteKey = key;
        this.targetPalette = paletteStateFromDefinition(
            this.availablePalettes[key],
            this.gradientSize
        );

        if (options.immediate) {
            this.currentPaletteKey = key;
            this.currentPalette = clonePaletteState(this.targetPalette);
        }
    }

    pickPaletteKey(energy = 0.5, chaos = 0.5) {
        const keys = Object.keys(this.availablePalettes);
        if (keys.length <= 1) {
            return this.currentPaletteKey || keys[0];
        }

        let bestKey = this.currentPaletteKey;
        let bestScore = -Infinity;

        keys.forEach((key) => {
            const palette = this.availablePalettes[key];
            const energyWeight = weightForRange(palette.energyRange, energy);
            const chaosWeight = weightForRange(palette.chaosRange, chaos);
            const noveltyPenalty = (key === this.currentPaletteKey || key === this.targetPaletteKey) ? -0.25 : 0;
            const score = energyWeight * 0.6 + chaosWeight * 0.4 + noveltyPenalty + Math.random() * 0.08;
            if (score > bestScore) {
                bestScore = score;
                bestKey = key;
            }
        });

        return bestKey;
    }

    update(deltaTime = 16.6, audioData = null) {
        const dt = Math.max(0, deltaTime / 1000);
        this.elapsed += dt;

        const blend = 1 - Math.exp(-dt * this.transitionSpeed);
        for (let i = 0; i < this.gradientSize; i += 1) {
            const current = this.currentPalette.gradientLabs[i];
            const target = this.targetPalette.gradientLabs[i];
            this.currentPalette.gradientLabs[i] = mixLab(current, target, blend);
        }
        this.currentPalette.accentLab = mixLab(this.currentPalette.accentLab, this.targetPalette.accentLab, blend);
        this.currentPalette.shadowLab = mixLab(this.currentPalette.shadowLab, this.targetPalette.shadowLab, blend);

        const closeToTarget = this.currentPalette.gradientLabs.every((lab, index) => {
            const target = this.targetPalette.gradientLabs[index];
            return Math.abs(lab.L - target.L) < 0.25
                && Math.abs(lab.a - target.a) < 0.25
                && Math.abs(lab.b - target.b) < 0.25;
        });
        if (closeToTarget) {
            this.currentPaletteKey = this.targetPaletteKey;
        }

        if (audioData) {
            const downbeat = audioData.colorChoreography?.downbeatColor ?? 0;
            const transient = audioData.extremeDynamics?.transientBurst ?? 0;
            const energy = audioData.rms ?? 0;
            const chaos = audioData.extremeDynamics?.chaosSurge ?? 0;
            const orbit = audioData.colorChoreography?.orbit;

            if (typeof orbit === 'number') {
                this.dynamicOrbit = orbit;
            } else {
                this.dynamicOrbit = (this.dynamicOrbit + dt * 0.12) % 1;
            }

            const targetIntensity = Math.min(1, downbeat * 0.5 + transient * 0.7 + energy * 0.4);
            const response = 1 - Math.exp(-dt * 6.5);
            this.intensityMemory += (targetIntensity - this.intensityMemory) * response;

            const shouldShift = downbeat > 0.92
                && (transient > 0.55 || energy > 0.72)
                && (this.elapsed - this.lastPaletteShift) > this.minimumShiftInterval;

            if (shouldShift) {
                this.lastPaletteShift = this.elapsed;
                const nextKey = this.pickPaletteKey(energy, chaos);
                if (nextKey && nextKey !== this.targetPaletteKey) {
                    this.setPalette(nextKey);
                }
            }
        } else {
            this.dynamicOrbit = (this.dynamicOrbit + dt * 0.08) % 1;
            this.intensityMemory *= Math.pow(0.65, dt);
        }
    }

    sampleLabFromState(state, t) {
        const normalized = ((t % 1) + 1) % 1;
        const scaled = normalized * (state.gradientLabs.length - 1);
        const idx = Math.floor(scaled);
        const frac = scaled - idx;
        const current = state.gradientLabs[idx];
        const next = state.gradientLabs[Math.min(idx + 1, state.gradientLabs.length - 1)];
        return mixLab(current, next, frac);
    }

    getColor(mouseX = 0.5, mouseY = 0.5, time = 0, baseHue = 0, audioData = null) {
        const pointerX = mouseX - 0.5;
        const pointerY = mouseY - 0.5;
        const pointerRadius = Math.min(1, Math.sqrt(pointerX * pointerX + pointerY * pointerY) * 1.35);
        const pointerTheta = Math.atan2(pointerY, pointerX);
        const pointerOrbit = (pointerTheta / (Math.PI * 2) + 1) % 1;

        const colorChoreo = audioData?.colorChoreography || {};
        const dynamics = audioData?.extremeDynamics || {};
        const rhythm = audioData?.rhythmPhases || {};

        const orbit = typeof colorChoreo.orbit === 'number' ? colorChoreo.orbit : this.dynamicOrbit;
        const swing = dynamics.swingEnergy ?? 0;
        const chaos = dynamics.chaosSurge ?? 0;
        const accentLuma = colorChoreo.accentLuma ?? 0;
        const downbeat = colorChoreo.downbeatColor ?? 0;
        const saturationPulse = colorChoreo.saturationPulse ?? 0.5;
        const ribbon = colorChoreo.ribbon ?? 0.5;
        const beatPhase = rhythm.beatPhase ?? 0;
        const energy = audioData?.rms ?? 0;

        const jitter = Math.sin(time * 0.007 + baseHue * 0.01) * 0.08;
        const primaryT = (orbit + pointerOrbit * 0.2 + jitter + this.intensityMemory * 0.12) % 1;
        const secondaryT = (primaryT + 0.32 + swing * 0.2 + pointerRadius * 0.18 + Math.sin(beatPhase * Math.PI * 2) * 0.07) % 1;
        const accentT = (primaryT + 0.61 + chaos * 0.2 + ribbon * 0.18) % 1;

        const primaryLab = this.sampleLabFromState(this.currentPalette, primaryT);
        const secondaryLab = this.sampleLabFromState(this.currentPalette, secondaryT);
        const paletteAccentLab = this.sampleLabFromState(this.currentPalette, accentT);

        const accentBlend = Math.min(1, 0.35 + downbeat * 0.45 + accentLuma * 0.4 + this.intensityMemory * 0.25);
        const accentLab = mixLab(this.currentPalette.accentLab, paletteAccentLab, accentBlend);

        const saturationScalePrimary = 1 + (saturationPulse - 0.5) * 0.75 + pointerRadius * 0.25;
        const saturationScaleSecondary = 1 + chaos * 0.55;
        const saturationScaleAccent = 1 + downbeat * 0.8 + accentLuma * 0.35;

        const lightBoostPrimary = energy * 22 + this.intensityMemory * 16 + pointerRadius * 12 - 6;
        const lightBoostSecondary = swing * 18 - 4 + chaos * 8;
        const lightBoostAccent = downbeat * 28 + accentLuma * 18 + this.intensityMemory * 22;
        const lightBoostShadow = energy * -12 - chaos * 8;

        const primaryAdjusted = adjustLab(primaryLab, lightBoostPrimary, saturationScalePrimary);
        const secondaryAdjusted = adjustLab(secondaryLab, lightBoostSecondary, saturationScaleSecondary);
        const accentAdjusted = adjustLab(accentLab, lightBoostAccent, saturationScaleAccent);
        const shadowAdjusted = adjustLab(this.currentPalette.shadowLab, lightBoostShadow, 1 + chaos * 0.3);

        return {
            primary: labToRgb(primaryAdjusted),
            secondary: labToRgb(secondaryAdjusted),
            accent: labToRgb(accentAdjusted),
            shadow: labToRgb(shadowAdjusted),
            paletteKey: this.currentPaletteKey,
            paletteName: this.availablePalettes[this.currentPaletteKey]?.name || this.currentPaletteKey,
            pointerRadius,
            accentLevel: accentLuma,
            energy,
            orbit
        };
    }

    getPaletteSummary() {
        return {
            mode: this.currentMode,
            paletteKey: this.currentPaletteKey,
            paletteName: this.availablePalettes[this.currentPaletteKey]?.name || this.currentPaletteKey,
            availablePalettes: Object.entries(this.availablePalettes).map(([key, palette]) => ({
                key,
                name: palette.name,
                description: palette.description
            }))
        };
    }
}

export default ColorSystem;
