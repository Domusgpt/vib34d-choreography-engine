const clamp01 = (value) => Math.max(0, Math.min(1, value));

function hsvToRgb(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;

    if (h < 60) {
        r = c; g = x; b = 0;
    } else if (h < 120) {
        r = x; g = c; b = 0;
    } else if (h < 180) {
        r = 0; g = c; b = x;
    } else if (h < 240) {
        r = 0; g = x; b = c;
    } else if (h < 300) {
        r = x; g = 0; b = c;
    } else {
        r = c; g = 0; b = x;
    }

    return [clamp01(r + m), clamp01(g + m), clamp01(b + m)];
}

export class BehaviorPreviewDriver {
    constructor(options = {}) {
        this.baseHue = options.baseHue ?? 210;
        this.hueJitter = options.hueJitter ?? 35;
        this.paletteStops = options.paletteStops ?? 5;
        this.cycleSeconds = options.cycleSeconds ?? 36;
        this.surgeEvery = options.surgeEvery ?? 8;
        this.densityFloor = options.densityFloor ?? 0.22;
    }

    sample(nowMs = (typeof performance !== 'undefined' ? performance.now() : Date.now())) {
        const t = nowMs / 1000;
        const cycle = (t % this.cycleSeconds) / this.cycleSeconds;
        const phaseIndex = Math.floor(cycle * 3) % 3;
        const journeyPhase = ['orbit', 'pendulum', 'spiral'][phaseIndex];

        const beatPhase = Math.sin(t * (Math.PI * 0.5)) * 0.5 + 0.5;
        const onsetPulse = Math.max(0, Math.sin((t % this.surgeEvery) * Math.PI / this.surgeEvery));
        const beatEnvelope = clamp01(0.35 + beatPhase * 0.55);
        const onsetEnvelope = clamp01(onsetPulse * 0.9);

        const hueBase = (this.baseHue + phaseIndex * this.hueJitter) % 360;
        const hueSpan = [hueBase - 16, hueBase + 32];
        const contrastCurve = 0.82 + phaseIndex * 0.04 + onsetEnvelope * 0.08;

        const cameraPreset = {
            tilt: 0.03 + 0.02 * phaseIndex,
            sway: 0.04 + 0.03 * (1 - phaseIndex % 2)
        };

        const volumetricDensity = this.densityFloor + beatEnvelope * 0.25 + onsetEnvelope * 0.18;

        const paletteBands = Array.from({ length: this.paletteStops }, (_, i) => {
            const position = clamp01(i / (this.paletteStops - 1));
            const hueOffset = (position * 42 + phaseIndex * 24 + onsetEnvelope * 18) % 360;
            const [r, g, b] = hsvToRgb((hueBase + hueOffset + 360) % 360, 0.85, 0.95 - position * 0.25);
            return { position, color: [r, g, b] };
        });

        const rotationTargets = {
            xw: 0.06 + 0.08 * phaseIndex,
            yw: 0.05 + 0.06 * (1 - phaseIndex % 2),
            zw: 0.04 + 0.05 * beatEnvelope
        };

        return {
            journeyPhase,
            beatEnvelope,
            onsetEnvelope,
            hueSpan,
            contrastCurve,
            cameraPreset,
            paletteBands,
            volumetricDensity,
            rotationTargets
        };
    }
}
