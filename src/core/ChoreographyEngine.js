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
            energyHistory: []
        };

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
        const audioData = this.audioAnalyzer ? this.audioAnalyzer.analyze() : this.getMockAudioData();

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
        if (audioData.onset > 0.85) {
            this.onOnset(audioData.onset, currentTime);
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
    onOnset(intensity, time) {
        console.log(`⚡ Onset detected: intensity=${intensity.toFixed(2)}`);
        this.memory.lastOnsetTime = time;

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
     * Get mock audio data for testing
     */
    getMockAudioData() {
        const time = (Date.now() - this.startTime) / 1000;

        return {
            bands: {
                bass: Math.abs(Math.sin(time * 0.5)) * 0.7,
                mid: Math.abs(Math.sin(time * 0.7)) * 0.5,
                high: Math.abs(Math.sin(time * 1.3)) * 0.3
            },
            rms: Math.abs(Math.sin(time * 0.3)) * 0.6,
            onset: Math.random() > 0.95 ? Math.random() : 0,
            spectralCentroid: 1000 + Math.random() * 3000,
            spectralRolloff: 5000 + Math.random() * 5000
        };
    }
}
