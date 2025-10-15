/**
 * ChoreographyEngine - Main Timeline-Based Choreography System
 *
 * Creates SEQUENCES not just REACTIONS
 * - Timeline management
 * - Sequence orchestration
 * - Multi-parameter coordination
 * - Beat synchronization
 * - Memory and evolution
 *
 * A Paul Phillips Manifestation
 */

export class ChoreographyEngine {
    constructor(config = {}) {
        this.visualizers = config.visualizers || [];
        this.audioAnalyzer = config.audioAnalyzer;
        this.bpm = config.bpm || 120;
        this.beatDuration = (60 / this.bpm) * 1000; // ms

        // State
        this.running = false;
        this.startTime = null;
        this.currentBeat = 0;
        this.currentMeasure = 0;
        this.beatsPerMeasure = 4;

        // Sequence management
        this.sequences = new Map();
        this.activeSequences = [];
        this.sequenceHistory = [];

        // Memory system
        this.memory = {
            recentBassHits: [],
            colorJourneyPosition: 0,
            geometrySequence: [],
            rotationMomentum: { xw: 0, yw: 0, zw: 0 },
            energyTrend: "neutral",
            lastOnsetTime: 0,
            lastOnsetEvent: null,
            energyHistory: []
        };

        // Audio snapshot tracking for derivative-based dynamics
        this.prevAudioSnapshot = null;

        // Performance tracking
        this.lastFrameTime = 0;
        this.deltaTime = 0;

        console.log('🌌 ChoreographyEngine initialized', {
            bpm: this.bpm,
            beatDuration: this.beatDuration,
            visualizers: this.visualizers.length
        });
    }

    /**
     * Define a choreography sequence
     */
    defineSequence(sequence) {
        if (!sequence.name) {
            throw new Error('Sequence must have a name');
        }

        this.sequences.set(sequence.name, {
            ...sequence,
            id: `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });

        console.log(`📋 Sequence defined: ${sequence.name}`);
        return sequence.name;
    }

    /**
     * Load sequence library from JSON
     */
    async loadSequenceLibrary(path) {
        try {
            const response = await fetch(path);
            const library = await response.json();

            library.sequences.forEach(seq => this.defineSequence(seq));

            console.log(`📚 Loaded ${library.sequences.length} sequences from ${path}`);
        } catch (error) {
            console.error(`❌ Failed to load sequence library: ${path}`, error);
        }
    }

    /**
     * Start choreography engine
     */
    start() {
        if (this.running) return;

        this.running = true;
        this.startTime = Date.now();
        this.lastFrameTime = this.startTime;

        console.log('🎬 Choreography engine started');

        // Start animation loop
        this.animate();
    }

    /**
     * Stop choreography engine
     */
    stop() {
        this.running = false;
        console.log('⏹️ Choreography engine stopped');
    }

    /**
     * Main animation loop
     */
    animate() {
        if (!this.running) return;

        const currentTime = Date.now();
        this.deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        // Get audio data
        const rawAudioData = this.audioAnalyzer ? this.audioAnalyzer.analyze() : this.getMockAudioData();
        const audioData = this.normalizeAudioData(rawAudioData);

        // Update beat tracking
        this.updateBeatTracking(currentTime, audioData);

        // Update memory system
        this.updateMemory(audioData, currentTime);

        // Check sequence triggers
        this.checkTriggers(audioData, currentTime);

        // Update active sequences
        this.updateActiveSequences(currentTime, audioData);

        // Apply choreography to visualizers
        this.applyChoreography(audioData, currentTime);

        // Continue loop
        requestAnimationFrame(() => this.animate());
    }

    /**
     * Update beat tracking
     */
    updateBeatTracking(currentTime, audioData) {
        const elapsed = currentTime - this.startTime;
        const beatNumber = Math.floor(elapsed / this.beatDuration);

        if (beatNumber > this.currentBeat) {
            this.currentBeat = beatNumber;
            this.currentMeasure = Math.floor(this.currentBeat / this.beatsPerMeasure);

            // Beat event
            this.onBeat(this.currentBeat % this.beatsPerMeasure, audioData);
        }

        // Check for onset - higher threshold to avoid constant triggering
        const onsetEvent = audioData.onsetEvent;
        if (onsetEvent?.detected && onsetEvent.strength > 0) {
            this.onOnset(onsetEvent.strength, currentTime, onsetEvent);
        }
    }

    /**
     * Beat event handler
     */
    onBeat(beatInMeasure, audioData) {
        console.log(`🥁 Beat ${this.currentBeat} (measure ${this.currentMeasure}, beat ${beatInMeasure})`);

        // Downbeat (first beat of measure)
        if (beatInMeasure === 0) {
            this.onDownbeat(audioData);
        }

        // Backbeat (third beat)
        if (beatInMeasure === 2) {
            this.onBackbeat(audioData);
        }
    }

    /**
     * Downbeat event (strongest beat)
     */
    onDownbeat(audioData) {
        // Opportunity for strong visual changes
        console.log('💥 Downbeat');
    }

    /**
     * Backbeat event
     */
    onBackbeat(audioData) {
        // Secondary emphasis
        console.log('🎵 Backbeat');
    }

    /**
     * Onset event handler
     */
    onOnset(intensity, time, event = null) {
        console.log(`⚡ Onset detected: intensity=${intensity.toFixed(2)}`);
        this.memory.lastOnsetTime = time;

        if (event) {
            this.memory.lastOnsetEvent = event;
        }

        // Trigger immediate visual responses
        this.visualizers.forEach(viz => {
            if (viz.triggerClick) {
                viz.triggerClick(0.5, 0.5);
            }
        });
    }

    /**
     * Update memory system
     */
    updateMemory(audioData, currentTime) {
        // Track bass hits
        if (audioData.bands && audioData.bands.bass > 0.7) {
            this.memory.recentBassHits.push(currentTime);

            // Keep last 10
            if (this.memory.recentBassHits.length > 10) {
                this.memory.recentBassHits.shift();
            }

            // Predict next bass hit
            if (this.memory.recentBassHits.length >= 3) {
                const intervals = [];
                for (let i = 1; i < this.memory.recentBassHits.length; i++) {
                    intervals.push(this.memory.recentBassHits[i] - this.memory.recentBassHits[i - 1]);
                }
                const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
                this.memory.predictedNextBass = currentTime + avgInterval;
            }
        }

        // Track energy trend
        this.memory.energyHistory.push(audioData.rms || 0);
        if (this.memory.energyHistory.length > 20) {
            this.memory.energyHistory.shift();
        }

        if (this.memory.energyHistory.length >= 10) {
            const slope = this.calculateSlope(this.memory.energyHistory);
            if (slope > 0.01) this.memory.energyTrend = "building";
            else if (slope < -0.01) this.memory.energyTrend = "releasing";
            else this.memory.energyTrend = "stable";
        }

        // Accumulate rotation momentum
        if (audioData.bands && audioData.bands.bass > 0.5) {
            this.memory.rotationMomentum.zw += audioData.bands.bass * 0.1;
        }
        this.memory.rotationMomentum.zw *= 0.98; // Decay
    }

    /**
     * Calculate slope of data for trend detection
     */
    calculateSlope(data) {
        if (data.length < 2) return 0;

        const n = data.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += data[i];
            sumXY += i * data[i];
            sumX2 += i * i;
        }

        return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    }

    /**
     * Check sequence triggers
     */
    checkTriggers(audioData, currentTime) {
        this.sequences.forEach((sequence, name) => {
            // Skip if already active
            if (this.activeSequences.find(as => as.name === name)) return;

            // Check trigger condition
            let triggered = false;

            if (typeof sequence.trigger === 'function') {
                triggered = sequence.trigger(audioData, this.memory);
            } else if (typeof sequence.trigger === 'string') {
                // Simple expression evaluation
                triggered = this.evaluateTrigger(sequence.trigger, audioData);
            }

            if (triggered) {
                this.startSequence(name, currentTime);
            }
        });
    }

    /**
     * Evaluate trigger expression
     */
    evaluateTrigger(expression, audioData) {
        try {
            // Simple eval replacement with safe checks
            const bass = audioData.bands?.bass || 0;
            const mid = audioData.bands?.mid || 0;
            const high = audioData.bands?.high || 0;
            const energy = audioData.rms || 0;
            const onset = audioData.onset || 0;

            // Replace variables and evaluate
            const safeExpr = expression
                .replace(/bass/g, bass)
                .replace(/mid/g, mid)
                .replace(/high/g, high)
                .replace(/energy/g, energy)
                .replace(/onset/g, onset);

            return eval(safeExpr);
        } catch (error) {
            console.error(`❌ Failed to evaluate trigger: ${expression}`, error);
            return false;
        }
    }

    /**
     * Start a sequence
     */
    startSequence(name, startTime) {
        const sequence = this.sequences.get(name);
        if (!sequence) return;

        console.log(`🎬 Starting sequence: ${name}`);

        this.activeSequences.push({
            ...sequence,
            startTime,
            currentStage: 0
        });

        this.sequenceHistory.push({
            name,
            startTime,
            trigger: 'auto'
        });
    }

    /**
     * Update active sequences
     */
    updateActiveSequences(currentTime, audioData) {
        this.activeSequences = this.activeSequences.filter(activeSeq => {
            const elapsed = currentTime - activeSeq.startTime;

            // Check if sequence is complete
            if (elapsed >= activeSeq.duration) {
                console.log(`✅ Sequence completed: ${activeSeq.name}`);
                return false; // Remove from active
            }

            // Update sequence (apply choreography)
            this.updateSequence(activeSeq, elapsed, audioData);

            return true; // Keep active
        });
    }

    /**
     * Update individual sequence
     */
    updateSequence(sequence, elapsed, audioData) {
        if (!sequence.stages) return;

        // Find current stage
        let accumulatedTime = 0;
        for (let i = 0; i < sequence.stages.length; i++) {
            const stage = sequence.stages[i];
            const stageStart = stage.start || accumulatedTime;
            const stageDuration = stage.duration;

            if (elapsed >= stageStart && elapsed < stageStart + stageDuration) {
                // We're in this stage
                const stageProgress = (elapsed - stageStart) / stageDuration;
                this.applyStage(sequence, stage, stageProgress, audioData);
                break;
            }

            accumulatedTime = stageStart + stageDuration;
        }
    }

    /**
     * Apply stage choreography
     */
    applyStage(sequence, stage, progress, audioData) {
        // Apply parameter changes from this stage
        Object.keys(stage).forEach(param => {
            if (param === 'start' || param === 'duration') return;

            const change = stage[param];

            // Calculate value based on change type
            let value = null;

            if (change.from !== undefined && change.to !== undefined) {
                // Interpolation
                const easing = this.getEasingFunction(change.easing || 'linear');
                const t = easing(progress);

                const from = change.from === 'current' ? this.getCurrentParam(param) : change.from;
                const to = change.to === 'current' ? this.getCurrentParam(param) : change.to;

                value = from + (to - from) * t;
            } else if (change.spike !== undefined) {
                // Spike with decay
                const decay = change.decay || 0.95;
                value = change.spike * Math.pow(decay, progress * 100);
            } else if (change.jump !== undefined) {
                // Instant change
                value = change.jump;
            }

            if (value !== null) {
                this.setChoreographedParam(param, value);
            }
        });
    }

    /**
     * Get easing function
     */
    getEasingFunction(name) {
        const easings = {
            linear: t => t,
            easeIn: t => t * t,
            easeOut: t => t * (2 - t),
            easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            exponential: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1))
        };

        return easings[name] || easings.linear;
    }

    /**
     * Get current parameter value
     */
    getCurrentParam(param) {
        // Would need to query visualizers for current value
        // For now return default
        return 0;
    }

    /**
     * Set choreographed parameter across all visualizers
     */
    setChoreographedParam(param, value) {
        this.visualizers.forEach(viz => {
            if (viz.updateParameter) {
                viz.updateParameter(param, value);
            }
        });
    }

    /**
     * Apply choreography to visualizers
     */
    applyChoreography(audioData, currentTime) {
        // This is where active sequences influence visualizers
        // Already handled in updateActiveSequences
    }

    /**
     * Normalize audio data into a consistent structure for the engine
     */
    normalizeAudioData(audioData) {
        const baseBands = ['subBass', 'bass', 'lowMid', 'mid', 'highMid', 'high', 'air', 'ultraHigh'];
        const normalized = { ...(audioData || {}) };

        const incomingBandDetails = audioData?.bandDetails || {};
        const incomingBands = audioData?.bands || {};
        const normalizedBands = {};
        const normalizedDetails = {};

        const assignBand = (name, value, detail) => {
            const numericValue = typeof value === 'number' ? value : typeof value?.value === 'number' ? value.value : 0;
            normalizedBands[name] = numericValue;
            const sourceDetail = detail || value;
            if (sourceDetail && typeof sourceDetail === 'object') {
                normalizedDetails[name] = {
                    low: sourceDetail.low ?? 0,
                    high: sourceDetail.high ?? 0,
                    value: numericValue
                };
            } else {
                normalizedDetails[name] = { low: 0, high: 0, value: numericValue };
            }
        };

        Object.entries(incomingBands).forEach(([name, value]) => {
            assignBand(name, value, incomingBandDetails[name]);
        });

        Object.entries(incomingBandDetails).forEach(([name, detail]) => {
            if (!(name in normalizedBands)) {
                assignBand(name, detail?.value ?? 0, detail);
            }
        });

        // Ensure base bands exist with safe defaults
        baseBands.forEach(name => {
            if (!(name in normalizedBands)) {
                normalizedBands[name] = 0;
                normalizedDetails[name] = { low: 0, high: 0, value: 0 };
            }
        });

        // Alias ultraHigh to air if only one exists
        const ultraHighProvided = Object.prototype.hasOwnProperty.call(incomingBands, 'ultraHigh') ||
            Object.prototype.hasOwnProperty.call(incomingBandDetails, 'ultraHigh');
        if (!ultraHighProvided && normalizedBands.air !== undefined) {
            normalizedBands.ultraHigh = normalizedBands.air;
            const sourceDetail = normalizedDetails.air || { low: 0, high: 0, value: normalizedBands.ultraHigh };
            normalizedDetails.ultraHigh = { ...sourceDetail, value: normalizedBands.ultraHigh };
        }

        const onsetEvent = audioData?.onsetEvent || (typeof audioData?.onset === 'object' ? audioData.onset : null);
        const onsetStrength = typeof audioData?.onset === 'number'
            ? audioData.onset
            : onsetEvent?.strength || 0;

        normalized.bands = normalizedBands;
        normalized.bandDetails = normalizedDetails;
        normalized.onset = onsetStrength;
        normalized.onsetEvent = onsetEvent || {
            detected: false,
            strength: onsetStrength,
            time: Date.now()
        };

        normalized.rms = normalized.rms ?? 0;
        normalized.spectralCentroid = normalized.spectralCentroid ?? 0;
        normalized.spectralRolloff = normalized.spectralRolloff ?? 0;
        normalized.spectralFlux = normalized.spectralFlux ?? 0;
        normalized.bpm = normalized.bpm ?? this.bpm;

        // Derived rhythmic phases for richer choreography
        const now = Date.now();
        const elapsedFromStart = this.startTime ? now - this.startTime : 0;
        const beatDuration = Math.max(1, this.beatDuration || 1);
        const measureDuration = Math.max(beatDuration * this.beatsPerMeasure, beatDuration);
        const beatPhase = (elapsedFromStart % beatDuration) / beatDuration;
        const measurePhase = (elapsedFromStart % measureDuration) / measureDuration;
        const swingPulse = Math.sin(beatPhase * Math.PI * 2) + Math.sin(beatPhase * Math.PI * 4) * 0.35;
        const tripletPulse = Math.sin(beatPhase * Math.PI * 6);
        const quintuplePulse = Math.sin(beatPhase * Math.PI * 10);
        const septuplePulse = Math.sin(beatPhase * Math.PI * 14);
        const accentPulse = Math.max(0, Math.sin(beatPhase * Math.PI * 2));
        const downbeatPulse = Math.max(0, 1 - beatPhase * 1.3);

        normalized.rhythmPhases = {
            beatPhase,
            measurePhase,
            swingPulse,
            tripletPulse,
            quintuplePulse,
            septuplePulse,
            accentPulse,
            downbeatPulse,
            beatStrength: Math.max(accentPulse, onsetStrength),
            elapsedBeats: elapsedFromStart / beatDuration
        };

        // Momentum tracking for extreme dynamics
        const bass = normalizedBands.bass || 0;
        const mid = normalizedBands.mid || 0;
        const high = normalizedBands.high || 0;
        const energy = normalized.rms || 0;
        const spectralFlux = normalized.spectralFlux || 0;
        const nowSeconds = now / 1000;

        let bassMomentum = 0;
        let midMomentum = 0;
        let highMomentum = 0;

        if (this.prevAudioSnapshot) {
            const dt = Math.max(0.016, nowSeconds - this.prevAudioSnapshot.time);
            bassMomentum = (bass - this.prevAudioSnapshot.bass) / dt;
            midMomentum = (mid - this.prevAudioSnapshot.mid) / dt;
            highMomentum = (high - this.prevAudioSnapshot.high) / dt;
        }

        const swingEnergy = 0.5 + 0.5 * Math.tanh(swingPulse);
        const transientBurst = Math.max(0, onsetStrength * 0.8 + Math.max(0, highMomentum) * 0.2);
        const chaosSurge = Math.min(
            1,
            Math.abs(tripletPulse) * 0.4 + Math.abs(quintuplePulse) * 0.25 + Math.max(0, highMomentum) * 0.1
        );
        const dimensionLift = Math.min(
            1.5,
            0.3 * energy + 0.25 * mid + 0.18 * swingEnergy + Math.max(0, bassMomentum) * 0.12
        );
        const intensityExponent = Math.max(
            0.35,
            0.9 + energy * 0.9 + onsetStrength * 0.7 + spectralFlux * 0.5
        );
        const motionVelocity = Math.min(
            1,
            Math.sqrt(
                bassMomentum * bassMomentum +
                midMomentum * midMomentum +
                highMomentum * highMomentum
            ) * 0.12
        );

        normalized.extremeDynamics = {
            intensityExponent,
            dimensionLift,
            chaosSurge,
            motionVelocity,
            transientBurst,
            swingEnergy,
            rhythmAccent: accentPulse
        };

        const orbit = (beatPhase + spectralFlux * 0.1 + high * 0.08 + motionVelocity * 0.05) % 1;
        const saturationPulse = Math.max(
            0,
            0.5 + 0.5 * Math.sin(measurePhase * Math.PI * 2 + tripletPulse * 0.35)
        );
        const ribbon = 0.5 + 0.5 * Math.sin(quintuplePulse + swingPulse * 0.4);
        const downbeatColor = Math.min(1, downbeatPulse * (0.6 + onsetStrength * 0.6));

        normalized.colorChoreography = {
            orbit,
            saturationPulse,
            ribbon,
            downbeatColor,
            accentLuma: Math.min(1, energy * 0.8 + transientBurst * 0.6)
        };

        this.prevAudioSnapshot = {
            time: nowSeconds,
            bass,
            mid,
            high,
            energy
        };

        return normalized;
    }

    /**
     * Get mock audio data for testing
     */
    getMockAudioData() {
        const time = (Date.now() - this.startTime) / 1000;
        const bandDetails = {
            subBass: { low: 20, high: 60 },
            bass: { low: 60, high: 250 },
            lowMid: { low: 250, high: 500 },
            mid: { low: 500, high: 2000 },
            highMid: { low: 2000, high: 4000 },
            high: { low: 4000, high: 8000 },
            air: { low: 8000, high: 20000 },
            ultraHigh: { low: 12000, high: 22000 }
        };

        const bassValue = Math.abs(Math.sin(time * 0.5)) * 0.7;
        const midValue = Math.abs(Math.sin(time * 0.7)) * 0.5;
        const highValue = Math.abs(Math.sin(time * 1.3)) * 0.3;
        const onsetStrength = Math.random() > 0.95 ? Math.random() : 0;
        const onsetEvent = {
            detected: onsetStrength > 0.75,
            strength: onsetStrength,
            time: Date.now()
        };

        const bandValues = {
            subBass: bassValue * 0.9,
            bass: bassValue,
            lowMid: midValue * 0.6,
            mid: midValue,
            highMid: highValue * 0.8,
            high: highValue,
            air: highValue * 0.6,
            ultraHigh: highValue * 0.6
        };

        const detailedBands = {};
        Object.entries(bandDetails).forEach(([name, detail]) => {
            detailedBands[name] = { ...detail, value: bandValues[name] ?? 0 };
        });
        Object.entries(bandValues).forEach(([name, value]) => {
            if (!detailedBands[name]) {
                detailedBands[name] = { low: 0, high: 0, value };
            }
        });

        return {
            bands: bandValues,
            bandDetails: detailedBands,
            rms: Math.abs(Math.sin(time * 0.3)) * 0.6,
            onset: onsetStrength,
            onsetEvent,
            spectralCentroid: 1000 + Math.random() * 3000,
            spectralRolloff: 5000 + Math.random() * 5000
        };
    }
}
