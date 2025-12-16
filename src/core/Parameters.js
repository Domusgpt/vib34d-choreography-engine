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
        this.driverFloor = Math.max(0, options.driverFloor ?? 0.015);
        this.baselineSource = {};
        this.baselineOverrides = {};
        this.baseline = {};
        this.reactiveProfiles = {};
        this.reactiveEnabled = {};
        this.offsetState = {};
        this.lastResolved = {};
        this.lastDiagnostics = {};
        this.lastDriver = 0;

        this.driverWeights = { beat: 0.65, onset: 0.35, audio: 0 };
        this.setDriverWeights(options.driverWeights || this.driverWeights);
    }

    reapplyBaselines() {
        Object.keys(this.baselineSource).forEach((key) => {
            const profile = this.reactiveProfiles[key] || {};
            const combined = (this.baselineSource[key] ?? 0) + (this.baselineOverrides[key] || 0);
            this.baseline[key] = this.clampToProfile(combined, profile);

            if (!(key in this.offsetState)) {
                this.offsetState[key] = 0;
            }

            const limit = Number.isFinite(profile.limit) ? Math.abs(profile.limit) : Infinity;
            if (Math.abs(this.offsetState[key]) > limit) {
                this.offsetState[key] = Math.sign(this.offsetState[key]) * Math.min(Math.abs(this.offsetState[key]), limit);
            }
        });
    }

    clampToProfile(value, profile = {}) {
        let clamped = value;
        if (Number.isFinite(profile.min)) {
            clamped = Math.max(profile.min, clamped);
        }
        if (Number.isFinite(profile.max)) {
            clamped = Math.min(profile.max, clamped);
        }
        return clamped;
    }

    normalizeWeights(weights = {}) {
        const beat = Math.max(0, Number(weights.beat ?? this.driverWeights.beat ?? 0));
        const onset = Math.max(0, Number(weights.onset ?? this.driverWeights.onset ?? 0));
        const audio = Math.max(0, Number(weights.audio ?? this.driverWeights.audio ?? 0));
        const total = beat + onset + audio;
        if (total <= 0) {
            return { beat: 0.5, onset: 0.5, audio: 0 };
        }
        return {
            beat: beat / total,
            onset: onset / total,
            audio: audio / total
        };
    }

    setDriverWeights(weights = {}) {
        this.driverWeights = this.normalizeWeights(weights);
    }

    setDriverFloor(floor = 0) {
        this.driverFloor = Math.max(0, Number(floor));
    }

    /**
     * Define or update baseline values. These are the single source of truth.
     */
    setBaseline(values = {}) {
        Object.entries(values).forEach(([key, value]) => {
            const profile = this.reactiveProfiles[key] || {};
            this.baselineSource[key] = value;
            const combined = value + (this.baselineOverrides[key] || 0);
            this.baseline[key] = this.clampToProfile(combined, profile);
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
        this.reapplyBaselines();
    }

    /**
     * Register parameters with optional baseline values and reactive profiles.
     * @param {Object} definitions - map of parameterName -> { baseline, profile, reactive }
     */
    registerParameters(definitions = {}) {
        Object.entries(definitions).forEach(([key, definition]) => {
            if (definition && Object.prototype.hasOwnProperty.call(definition, 'baseline')) {
                if (!(key in this.baselineSource)) {
                    this.baselineSource[key] = definition.baseline;
                    this.baseline[key] = definition.baseline + (this.baselineOverrides[key] || 0);
                }
            }

            if (definition && definition.profile) {
                this.setProfiles({ [key]: definition.profile });
            } else if (!(key in this.reactiveProfiles)) {
                this.setProfiles({ [key]: {} });
            }

            if (!(key in this.offsetState)) {
                this.offsetState[key] = 0;
            }

            if (definition && Object.prototype.hasOwnProperty.call(definition, 'reactive')) {
                this.reactiveEnabled[key] = !!definition.reactive;
            } else if (!(key in this.reactiveEnabled)) {
                this.reactiveEnabled[key] = true;
            }
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

            if (key in this.baseline) {
                const combined = this.baselineSource[key] + (this.baselineOverrides[key] || 0);
                this.baseline[key] = this.clampToProfile(combined, this.reactiveProfiles[key]);
            }
        });

        this.reapplyBaselines();
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
                limit: Math.max(0, Number(limit ?? existing.limit ?? Infinity))
            };
        });

        this.reapplyBaselines();
    }

    /**
     * Enable/disable reactive offsets per-parameter without altering baseline values.
     */
    setReactiveEnabled(map = {}) {
        Object.entries(map).forEach(([key, enabled]) => {
            this.reactiveEnabled[key] = !!enabled;
        });

        Object.keys(map).forEach((key) => {
            if (map[key] === false) {
                this.offsetState[key] = 0;
            }
        });
    }

    resetOffsets(keys) {
        const targets = Array.isArray(keys) ? keys : Object.keys(this.offsetState);
        targets.forEach((key) => {
            this.offsetState[key] = 0;
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

        const weights = this.normalizeWeights(this.driverWeights);
        const contribution = {
            beat: beatEnvelope * weights.beat,
            onset: onsetEnvelope * weights.onset,
            audio: audioLevel * weights.audio
        };
        const weighted = contribution.beat + contribution.onset + contribution.audio;
        const driverRaw = Math.max(0, Math.min(1, weighted));
        const driver = driverRaw < this.driverFloor ? 0 : driverRaw;

        this.lastDriver = driver;

        const resolved = {};
        const diagnostics = {};

        Object.entries(this.baseline).forEach(([key, baseValue]) => {
            const profile = this.reactiveProfiles[key] || {};
            const enabled = this.reactiveEnabled[key] !== false && (profile.enabled ?? true);
            const targetOffset = enabled ? (profile.range || 0) * driver * (profile.polarity ?? 1) : 0;
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
                limit: profile.limit,
                enabled,
                driver,
                driverRaw,
                driverFloor: this.driverFloor,
                driverWeights: { ...weights },
                driverContribution: { ...contribution }
            };
        });

        this.lastResolved = { ...resolved, ...overrides };
        this.lastDiagnostics = diagnostics;

        this.lastDiagnosticsDriver = {
            driver,
            driverRaw,
            driverFloor: this.driverFloor,
            weights,
            contribution
        };

        return this.lastResolved;
    }

    /**
     * Provide diagnostic information for overlays / QA panels.
     */
    getDiagnostics() {
        const weights = this.lastDiagnosticsDriver?.weights || this.driverWeights || {};
        const contribution = this.lastDiagnosticsDriver?.contribution || {};
        return {
            driver: this.lastDriver,
            driverRaw: this.lastDiagnosticsDriver?.driverRaw,
            driverFloor: this.lastDiagnosticsDriver?.driverFloor ?? this.driverFloor,
            driverWeights: { ...weights },
            driverContribution: { ...contribution },
            baseline: { ...this.baseline },
            baselineSource: { ...this.baselineSource },
            baselineOverrides: { ...this.baselineOverrides },
            resolved: { ...this.lastResolved },
            offsets: { ...this.offsetState },
            parameters: this.lastDiagnostics,
            reactiveEnabled: { ...this.reactiveEnabled },
            profiles: { ...this.reactiveProfiles }
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

    getProfile(key) {
        return { ...(this.reactiveProfiles[key] || {}) };
    }
}
