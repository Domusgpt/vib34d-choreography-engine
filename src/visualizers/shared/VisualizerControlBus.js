/**
 * VisualizerControlBus
 * -------------------------------------------------------------
 * Central hub for routing parameters, gestures, macros, and audio
 * choreography data into the visualizer layer. Channels are defined
 * declaratively with ranges, smoothing, and audio mappings so each
 * visualizer can share expressive controls without duplicating logic.
 *
 * The bus keeps a ParameterManager in sync, supports transient
 * modulations, and captures/plays back gesture macros so wildly
 * dynamic colour and geometry events become easy to choreograph.
 */

const EPSILON = 1e-5;

function clamp(value, min, max) {
    let result = value;
    if (typeof min === 'number') {
        result = Math.max(min, result);
    }
    if (typeof max === 'number') {
        result = Math.min(max, result);
    }
    return result;
}

function toNumber(value) {
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
    return 0;
}

function resolvePath(target, path) {
    if (!target || typeof path !== 'string') {
        return undefined;
    }

    return path.split('.').reduce((acc, key) => {
        if (acc == null) {
            return undefined;
        }
        const next = acc[key];
        if (typeof next === 'number' || typeof next === 'string' || typeof next === 'boolean' || next == null) {
            return next;
        }
        if (typeof next === 'object') {
            return next;
        }
        return undefined;
    }, target);
}

function easingForName(name) {
    switch (name) {
        case 'ease-in':
            return (t) => t * t;
        case 'ease-out':
            return (t) => 1 - (1 - t) * (1 - t);
        case 'ease-in-out':
            return (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
        case 'smoothstep':
            return (t) => t * t * (3 - 2 * t);
        default:
            return (t) => t;
    }
}

function aggregateBlend(current, incoming) {
    const c = clamp(current ?? 0, 0, 1);
    const i = clamp(incoming ?? 0, 0, 1);
    return 1 - (1 - c) * (1 - i);
}

export class VisualizerControlBus {
    constructor(options = {}) {
        this.defaultSmoothing = typeof options.defaultSmoothing === 'number'
            ? clamp(options.defaultSmoothing, 0, 0.99)
            : 0.75;
        this.channels = new Map();
        this.tags = new Map();
        this.parameterManager = null;
        this.elapsed = 0;

        this.recording = null;
        this.macros = new Map();
        this.playingMacros = [];
    }

    attachParameterManager(parameterManager) {
        this.parameterManager = parameterManager;
    }

    defineChannels(definition = {}) {
        Object.entries(definition).forEach(([name, config]) => {
            this.defineChannel(name, config);
        });
    }

    defineChannel(name, config = {}) {
        if (!name) {
            return;
        }

        const previous = this.channels.get(name) || {};
        const defaultValue = typeof config.value === 'number'
            ? config.value
            : typeof config.default === 'number'
                ? config.default
                : typeof previous.defaultValue === 'number'
                    ? previous.defaultValue
                    : 0;

        const min = typeof config.min === 'number'
            ? config.min
            : Array.isArray(config.range)
                ? config.range[0]
                : previous.min;

        const max = typeof config.max === 'number'
            ? config.max
            : Array.isArray(config.range)
                ? config.range[1]
                : previous.max;

        const channel = {
            name,
            defaultValue,
            baseValue: previous.baseValue ?? defaultValue,
            value: previous.value ?? defaultValue,
            target: previous.target ?? defaultValue,
            min: typeof min === 'number' ? min : undefined,
            max: typeof max === 'number' ? max : undefined,
            smoothing: typeof config.smoothing === 'number'
                ? clamp(config.smoothing, 0, 0.995)
                : (typeof previous.smoothing === 'number' ? previous.smoothing : this.defaultSmoothing),
            audioMap: config.audioMap ?? previous.audioMap ?? null,
            audioWeight: typeof config.audioWeight === 'number'
                ? config.audioWeight
                : (typeof previous.audioWeight === 'number' ? previous.audioWeight : 1),
            modulators: previous.modulators ? [...previous.modulators] : [],
            ramp: previous.ramp || null,
            tags: new Set(Array.isArray(config.tags) ? config.tags : (previous.tags ? Array.from(previous.tags) : []))
        };

        this.channels.set(name, channel);

        channel.tags.forEach((tag) => {
            if (!this.tags.has(tag)) {
                this.tags.set(tag, new Set());
            }
            this.tags.get(tag).add(name);
        });

        if (this.parameterManager && typeof this.parameterManager.setParameter === 'function') {
            const current = this.parameterManager.getParameter
                ? this.parameterManager.getParameter(name)
                : undefined;
            if (typeof current === 'undefined') {
                this.parameterManager.setParameter(name, defaultValue);
            }
        }
    }

    setBaseValue(name, value, options = {}) {
        const channel = this.channels.get(name);
        if (!channel) {
            this.defineChannel(name, { value });
            return this.setBaseValue(name, value, options);
        }

        const numeric = clamp(value, channel.min, channel.max);
        channel.baseValue = numeric;
        channel.target = numeric;
        if (options.immediate) {
            channel.value = numeric;
        }

        if (this.parameterManager && typeof this.parameterManager.setParameter === 'function') {
            this.parameterManager.setParameter(name, numeric);
        }
    }

    modulateChannel(name, amount, options = {}) {
        const channel = this.channels.get(name);
        if (!channel) {
            return undefined;
        }

        const id = options.id || Symbol(name);
        const decay = typeof options.decay === 'number' ? Math.max(options.decay, 0) : 1.6;
        const mode = options.mode || 'add';
        const clampRange = options.clamp || null;
        const polarity = options.polarity || 'bidirectional';

        let modAmount = amount;
        if (polarity === 'positive') {
            modAmount = Math.max(0, modAmount);
        } else if (polarity === 'negative') {
            modAmount = Math.min(0, modAmount);
        }

        channel.modulators = channel.modulators.filter((mod) => mod.id !== id);
        channel.modulators.push({
            id,
            amount: modAmount,
            decay,
            mode,
            clamp: clampRange,
            active: true
        });

        return id;
    }

    queueRamp(name, toValue, duration, options = {}) {
        const channel = this.channels.get(name);
        if (!channel) {
            return;
        }

        const start = typeof options.fromValue === 'number' ? options.fromValue : channel.value;
        const eased = easingForName(options.easing);
        channel.ramp = {
            start,
            end: toValue,
            duration: Math.max(duration, EPSILON),
            elapsed: 0,
            easing: eased,
            clamp: options.clamp || null
        };
    }

    startMacroRecording(name) {
        if (!name) {
            throw new Error('VisualizerControlBus.startMacroRecording requires a name');
        }
        this.recording = {
            name,
            startTime: this.elapsed,
            frames: []
        };
    }

    stopMacroRecording() {
        if (!this.recording) {
            return null;
        }

        const record = this.recording;
        this.recording = null;

        const duration = record.frames.length
            ? record.frames[record.frames.length - 1].time
            : 0;

        const macro = {
            name: record.name,
            duration,
            frames: record.frames
        };

        this.macros.set(record.name, macro);
        return macro;
    }

    playMacro(name, options = {}) {
        const macro = this.macros.get(name);
        if (!macro || !macro.frames.length) {
            return null;
        }

        const state = {
            macro,
            time: Math.max(0, options.offset || 0),
            playbackRate: options.playbackRate || 1,
            blend: typeof options.blend === 'number' ? clamp(options.blend, 0, 1) : 1,
            weight: typeof options.weight === 'number' ? options.weight : 1,
            loop: Boolean(options.loop),
            id: Symbol(name)
        };

        this.playingMacros.push(state);
        return state.id;
    }

    stopMacro(idOrName) {
        if (!idOrName) {
            return;
        }

        this.playingMacros = this.playingMacros.filter((state) => {
            if (state.id === idOrName) {
                return false;
            }
            if (typeof idOrName === 'string' && state.macro.name === idOrName) {
                return false;
            }
            return true;
        });
    }

    evaluateAudioMap(map, audioData, channel) {
        if (!map) {
            return 0;
        }

        if (typeof map === 'function') {
            return map(audioData, channel);
        }

        if (Array.isArray(map)) {
            return map.reduce((acc, entry) => acc + this.evaluateAudioMap(entry, audioData, channel), 0);
        }

        if (typeof map === 'string') {
            return toNumber(resolvePath(audioData, map));
        }

        if (typeof map === 'object') {
            let value = 0;
            if (typeof map.path === 'string') {
                value = toNumber(resolvePath(audioData, map.path));
            } else if (typeof map.get === 'function') {
                value = toNumber(map.get(audioData, channel));
            }

            if (typeof map.power === 'number' && map.power !== 1) {
                const sign = value >= 0 ? 1 : -1;
                value = sign * Math.pow(Math.abs(value), map.power);
            }

            const scale = typeof map.scale === 'number' ? map.scale : 1;
            const bias = typeof map.bias === 'number' ? map.bias : 0;
            value = value * scale + bias;

            if (Array.isArray(map.clamp)) {
                value = clamp(value, map.clamp[0], map.clamp[1]);
            }

            return value;
        }

        return 0;
    }

    sampleMacro(state, time) {
        const { frames, duration } = state.macro;
        if (!frames.length) {
            return null;
        }

        if (frames.length === 1) {
            return frames[0].values;
        }

        if (time <= frames[0].time) {
            return frames[0].values;
        }

        if (time >= duration) {
            return frames[frames.length - 1].values;
        }

        let index = 0;
        for (let i = 0; i < frames.length - 1; i += 1) {
            if (frames[i + 1].time >= time) {
                index = i;
                break;
            }
        }

        const a = frames[index];
        const b = frames[index + 1];
        const span = Math.max(b.time - a.time, EPSILON);
        const t = clamp((time - a.time) / span, 0, 1);

        const keys = new Set([...Object.keys(a.values), ...Object.keys(b.values)]);
        const interpolated = {};

        keys.forEach((key) => {
            const va = a.values[key];
            const vb = b.values[key];
            if (typeof va === 'number' && typeof vb === 'number') {
                interpolated[key] = va + (vb - va) * t;
            } else if (typeof va === 'number') {
                interpolated[key] = va;
            } else if (typeof vb === 'number') {
                interpolated[key] = vb;
            }
        });

        return interpolated;
    }

    update(deltaTime = 0, context = {}) {
        const dt = Math.max(0, deltaTime || 0);
        this.elapsed += dt;

        const baseParameters = context.baseParameters || {};
        const audioData = context.audioData || {};
        const snapshot = { ...baseParameters };

        // Prepare macro contributions first so they can be blended per channel
        const macroContributions = new Map();
        const remainingMacros = [];

        this.playingMacros.forEach((state) => {
            const valueMap = this.sampleMacro(state, state.time);
            if (valueMap) {
                Object.entries(valueMap).forEach(([name, value]) => {
                    if (!this.channels.has(name)) {
                        return;
                    }
                    const existing = macroContributions.get(name);
                    const weight = state.weight || 1;
                    const blend = clamp(state.blend, 0, 1);
                    if (!existing) {
                        macroContributions.set(name, {
                            weightedValue: value * weight,
                            totalWeight: weight,
                            blend
                        });
                    } else {
                        existing.weightedValue += value * weight;
                        existing.totalWeight += weight;
                        existing.blend = aggregateBlend(existing.blend, blend);
                    }
                });
            }

            state.time += dt * (state.playbackRate || 1);
            const duration = state.macro.duration || 0;
            if (duration > 0 && state.time > duration + EPSILON) {
                if (state.loop) {
                    state.time = state.time % duration;
                    remainingMacros.push(state);
                }
            } else if (duration === 0 || state.time <= duration + EPSILON) {
                remainingMacros.push(state);
            }
        });

        this.playingMacros = remainingMacros;

        this.channels.forEach((channel, name) => {
            const baseValue = typeof baseParameters[name] === 'number'
                ? baseParameters[name]
                : channel.baseValue;
            channel.baseValue = baseValue;

            let target = baseValue;

            if (channel.audioMap) {
                const audioContribution = this.evaluateAudioMap(channel.audioMap, audioData, channel);
                if (Number.isFinite(audioContribution)) {
                    target += audioContribution * (channel.audioWeight ?? 1);
                }
            }

            if (channel.ramp) {
                channel.ramp.elapsed += dt;
                const t = clamp(channel.ramp.elapsed / channel.ramp.duration, 0, 1);
                const eased = channel.ramp.easing(t);
                let rampValue = channel.ramp.start + (channel.ramp.end - channel.ramp.start) * eased;
                if (channel.ramp.clamp) {
                    rampValue = clamp(rampValue, channel.ramp.clamp[0], channel.ramp.clamp[1]);
                }
                target = rampValue;
                if (t >= 1 - EPSILON) {
                    channel.ramp = null;
                }
            }

            let modulation = 0;
            const activeMods = [];
            channel.modulators.forEach((mod) => {
                if (!mod.active) {
                    return;
                }

                if (mod.mode === 'scale') {
                    modulation += (target * (mod.amount - 1));
                } else {
                    modulation += mod.amount;
                }

                if (mod.decay > EPSILON) {
                    const falloff = Math.exp(-mod.decay * dt);
                    mod.amount *= falloff;
                }

                if (Math.abs(mod.amount) > EPSILON) {
                    activeMods.push(mod);
                }
            });
            channel.modulators = activeMods;
            target += modulation;

            const macroData = macroContributions.get(name);
            if (macroData && macroData.totalWeight > 0) {
                const macroValue = macroData.weightedValue / macroData.totalWeight;
                const blend = clamp(macroData.blend, 0, 1);
                target = target * (1 - blend) + macroValue * blend;
            }

            target = clamp(target, channel.min, channel.max);

            const smoothing = channel.smoothing ?? this.defaultSmoothing;
            const lerpFactor = clamp(1 - smoothing, 0, 1);
            channel.value += (target - channel.value) * lerpFactor;

            if (!Number.isFinite(channel.value)) {
                channel.value = target;
            }

            snapshot[name] = channel.value;
        });

        if (this.recording) {
            const frameValues = {};
            this.channels.forEach((channel, name) => {
                frameValues[name] = channel.value;
            });
            this.recording.frames.push({
                time: this.elapsed - this.recording.startTime,
                values: frameValues
            });
        }

        return snapshot;
    }

    getSnapshot(baseParameters = {}) {
        const snapshot = { ...baseParameters };
        this.channels.forEach((channel, name) => {
            snapshot[name] = channel.value;
        });
        return snapshot;
    }

    getTaggedSnapshot(tag, baseParameters = {}) {
        const snapshot = {};
        const names = this.tags.get(tag);
        if (!names) {
            return snapshot;
        }
        names.forEach((name) => {
            if (this.channels.has(name)) {
                snapshot[name] = this.channels.get(name).value;
            } else if (typeof baseParameters[name] !== 'undefined') {
                snapshot[name] = baseParameters[name];
            }
        });
        return snapshot;
    }
}
