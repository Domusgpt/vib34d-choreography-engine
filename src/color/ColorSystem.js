/**
 * Lightweight ColorSystem placeholder to keep visualizers stable during preview.
 * Provides basic HSV cycling with optional audio/envelope modulation.
 */
export class ColorSystem {
    constructor() {
        this.time = 0;
    }

    update(deltaTime = 0) {
        this.time += deltaTime;
    }

    /**
     * Returns a simple color payload that visualizers can consume for hue/saturation/value.
     */
    getColor(x = 0.5, y = 0.5, timeMs = 0, baseHue = 200, audioData = {}) {
        const beat = audioData?.beatEnvelope ?? audioData?.rms ?? 0;
        const onset = audioData?.onsetEnvelope ?? audioData?.onset ?? 0;
        const wobble = Math.sin((timeMs + this.time) * 0.0015) * 18;
        const hue = (baseHue + wobble + beat * 60 + onset * 90) % 360;
        const saturation = 0.7 + Math.min(0.25, (beat + onset) * 0.3);
        const value = 0.75 + Math.min(0.2, (beat * 0.5) + onset * 0.5 + (0.5 - Math.abs(y - 0.5)) * 0.1);

        return { hue, saturation, value, position: { x, y } };
    }
}
