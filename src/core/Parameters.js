/**
 * ParameterManager - centralized baseline + audio-reactive overlay blending
 *
 * Architectural rules enforced:
 *  - Baseline parameters are the source of truth
 *  - Audio reactivity is an additive/multiplicative offset around the baseline
 *  - Offsets decay back to baseline when input energy falls to silence
 *  - Each parameter declares its own reactive range and clamping boundaries
 */
export class ParameterManager {
    constructor(options = {}) {
        this.attack = options.attack ?? 0.35; // how quickly to rise toward reactive targets
        this.release = options.release ?? 0.12; // how quickly to fall back toward baseline
        this.baselineSource = {};
        this.baselineOverrides = {};
        this.baseline = {};
        this.reactiveProfiles = {};
        this.offsetState = {};
        this.lastResolved = {};
        this.lastDiagnostics = {};
        this.lastDriver = 0;
    }

    /**
     * Define or update baseline values. These are the single source of truth.
     */
    setBaseline(values = {}) {
        Object.entries(values).forEach(([key, value]) => {
            this.baselineSource[key] = value;
            this.baseline[key] = value + (this.baselineOverrides[key] || 0);
            if (!(key in this.offsetState)) {
                this.offsetState[key] = 0;
            }
        });
    }

    /**
     * Adjust baseline overrides without mutating the journey/preset source values.
     * @param {Object} overrides - map of parameterName -> additive offset applied to baseline
     */
    setBaselineOverrides(overrides = {}) {
        this.baselineOverrides = { ...this.baselineOverrides, ...overrides };
        Object.keys(this.baselineSource).forEach((key) => {
            this.baseline[key] = this.baselineSource[key] + (this.baselineOverrides[key] || 0);
        });
    }

    /**
     * Define per-parameter reactive profiles.
     * @param {Object} profiles - map of parameterName -> { range, mode, min, max, attack, release, polarity }
     */
    setProfiles(profiles = {}) {
        Object.entries(profiles).forEach(([key, profile]) => {
            const existing = this.reactiveProfiles[key] || {};
            this.reactiveProfiles[key] = {
                range: 0,
                mode: 'add',
                min: -Infinity,
                max: Infinity,
                attack: this.attack,
                release: this.release,
                polarity: 1,
                limit: Infinity,
                ...existing,
                ...profile
            };
        });
    }

    /**
     * Update reactive limits (maximum absolute offset) without redefining the full profile.
     */
    setReactiveLimits(limits = {}) {
        Object.entries(limits).forEach(([key, limit]) => {
            const existing = this.reactiveProfiles[key] || {};
            this.reactiveProfiles[key] = {
                range: 0,
                mode: 'add',
                min: -Infinity,
                max: Infinity,
                attack: this.attack,
                release: this.release,
                polarity: 1,
                limit: Infinity,
                ...existing,
                limit: limit ?? existing.limit ?? Infinity
            };
        });
    }

    /**
     * Resolve current parameter values by blending baseline with audio-reactive envelopes.
     * @param {Object} envelopes - { beatEnvelope, onsetEnvelope, audioLevel }
     * @param {Object} overrides - optional manual overrides applied after blending
     * @returns {Object} resolved parameter map
     */
    resolve(envelopes = {}, overrides = {}) {
        const beatEnvelope = envelopes.beatEnvelope ?? 0;
        const onsetEnvelope = envelopes.onsetEnvelope ?? 0;
        const audioLevel = envelopes.audioLevel ?? 0;
        const weighted = (beatEnvelope * 0.65) + (onsetEnvelope * 0.35);
        const driver = Math.max(0, Math.min(1, Math.max(weighted, audioLevel)));

        this.lastDriver = driver;

        const resolved = {};
        const diagnostics = {};

        Object.entries(this.baseline).forEach(([key, baseValue]) => {
            const profile = this.reactiveProfiles[key] || {};
            const targetOffset = (profile.range || 0) * driver * (profile.polarity ?? 1);
            const currentOffset = this.offsetState[key] || 0;
            const smoothing = driver >= Math.abs(currentOffset) ? (profile.attack ?? this.attack) : (profile.release ?? this.release);
            const unclampedOffset = currentOffset + (targetOffset - currentOffset) * smoothing;
            const limit = Number.isFinite(profile.limit) ? Math.abs(profile.limit) : Infinity;
            const newOffset = Math.max(-limit, Math.min(limit, unclampedOffset));
            this.offsetState[key] = newOffset;

            let value;
            if (profile.mode === 'multiply') {
                value = baseValue * (1 + newOffset);
            } else {
                value = baseValue + newOffset;
            }

            if (Number.isFinite(profile.min)) {
                value = Math.max(profile.min, value);
            }
            if (Number.isFinite(profile.max)) {
                value = Math.min(profile.max, value);
            }

            resolved[key] = value;

            diagnostics[key] = {
                baseline: baseValue,
                offset: newOffset,
                targetOffset,
                resolved: value,
                mode: profile.mode || 'add',
                range: profile.range || 0,
                min: profile.min,
                max: profile.max,
                polarity: profile.polarity ?? 1,
                limit: profile.limit
            };
        });

        this.lastResolved = { ...resolved, ...overrides };
        this.lastDiagnostics = diagnostics;

        return this.lastResolved;
    }

    /**
     * Provide diagnostic information for overlays / QA panels.
     */
    getDiagnostics() {
        return {
            driver: this.lastDriver,
            baseline: { ...this.baseline },
            baselineSource: { ...this.baselineSource },
            baselineOverrides: { ...this.baselineOverrides },
            resolved: { ...this.lastResolved },
            offsets: { ...this.offsetState },
            parameters: this.lastDiagnostics
        };
    }

    /**
     * Backwards-compatible single-parameter setter used by some systems.
     */
    setParameter(name, value) {
        this.setBaseline({ [name]: value });
    }

    /**
     * Return the last resolved values, falling back to baseline when unset.
     */
    getAllParameters() {
        if (Object.keys(this.lastResolved).length) {
            return { ...this.lastResolved };
        }
        return { ...this.baseline };
    }
}
