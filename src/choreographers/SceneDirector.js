/**
 * SceneDirector
 * -------------------------------------------------------------
 * Coordinates multi-parameter scene changes for demo surfaces.
 * A scene can drive palette selection, geometry, parameter curves,
 * and reactivity toggles. The director listens to audio metadata
 * and advances through curated scenes using the same reactive,
 * interval, tempo, and energy heuristics as the palette director.
 */
export class SceneDirector {
    constructor(options = {}) {
        this.scenes = Array.isArray(options.scenes) ? [...options.scenes] : [];
        this.mode = options.mode || 'reactive'; // 'reactive' | 'interval' | 'tempo' | 'energy' | 'off'
        this.intervalSeconds = Math.max(4, options.intervalSeconds || 48);
        this.energyThreshold = Math.max(0, Math.min(1, options.energyThreshold ?? 0.78));
        this.tempoDivision = Math.max(1, Math.floor(options.tempoDivision || 32));
        this.cooldownSeconds = Math.max(1.5, options.cooldownSeconds || 6);
        this.minDurationSeconds = Math.max(1, options.minDurationSeconds || 6);
        this.historyLimit = Math.max(1, Math.floor(options.historyLimit || 12));
        this.ordering = options.ordering === 'shuffle' ? 'shuffle' : 'forward';

        this.rotationSet = new Set();
        this.setRotationSet(options.rotationSet || this.scenes.map((scene) => scene.id));

        this.lastChangeTime = 0;
        this.nextTempoBeat = this.tempoDivision;
        this.lastElapsedBeats = 0;
        this.pendingSceneId = null;

        this.queue = [];
        this.history = [];
        this.sceneWeights = new Map();
        this.setSceneWeights(options.sceneWeights || options.weights || {});
    }

    setScenes(scenes = []) {
        this.scenes = [...scenes];
        const validIds = new Set(this.scenes.map((scene) => scene.id));
        const preservedRotation = [...this.rotationSet].filter((id) => validIds.has(id));
        this.rotationSet = preservedRotation.length ? new Set(preservedRotation) : new Set(validIds);
        this.pendingSceneId = null;

        const nextWeights = new Map();
        this.scenes.forEach((scene) => {
            const existing = this.sceneWeights.get(scene.id);
            if (Number.isFinite(existing) && existing > 0) {
                nextWeights.set(scene.id, existing);
            } else {
                nextWeights.set(scene.id, 1);
            }
        });
        this.sceneWeights = nextWeights;

        this.queue = this.queue.filter((entry) => validIds.has(entry.id));
        this.history = this.history.filter((entry) => validIds.has(entry.id)).slice(0, this.historyLimit);
    }

    setMode(mode = 'reactive') {
        this.mode = mode;
        this.lastChangeTime = 0;
        this.nextTempoBeat = this.tempoDivision;
        this.pendingSceneId = null;
    }

    setInterval(seconds = 48) {
        this.intervalSeconds = Math.max(4, seconds);
        this.pendingSceneId = null;
    }

    setEnergyThreshold(threshold = 0.78) {
        this.energyThreshold = Math.max(0, Math.min(1, threshold));
        this.pendingSceneId = null;
    }

    setTempoDivision(beats = 32) {
        this.tempoDivision = Math.max(1, Math.floor(beats));
        this.nextTempoBeat = this.tempoDivision;
        this.pendingSceneId = null;
    }

    setCooldown(seconds = 6) {
        this.cooldownSeconds = Math.max(1.5, seconds);
    }

    setMinDuration(seconds = 6) {
        this.minDurationSeconds = Math.max(1, seconds);
    }

    setOrdering(ordering = 'forward') {
        this.ordering = ordering === 'shuffle' ? 'shuffle' : 'forward';
        this.pendingSceneId = null;
    }

    setRotationSet(ids = []) {
        const validIds = new Set(this.scenes.map((scene) => scene.id));
        const filtered = ids.filter((id) => validIds.has(id));
        if (filtered.length === 0 && this.scenes.length > 0) {
            this.rotationSet = new Set(this.scenes.map((scene) => scene.id));
        } else {
            this.rotationSet = new Set(filtered);
        }
        this.pendingSceneId = null;
    }

    toggleScene(id) {
        if (!this.scenes.some((scene) => scene.id === id)) {
            return this.rotationSet;
        }

        if (this.rotationSet.has(id)) {
            this.rotationSet.delete(id);
        } else {
            this.rotationSet.add(id);
        }

        if (this.rotationSet.size === 0) {
            this.rotationSet = new Set(this.scenes.map((scene) => scene.id));
        }

        this.pendingSceneId = null;
        return this.rotationSet;
    }

    setSceneWeights(weights = {}) {
        this.sceneWeights.clear();
        if (weights instanceof Map) {
            weights.forEach((weight, id) => {
                const safeWeight = Number.isFinite(weight) ? Math.max(0, weight) : 0;
                if (safeWeight > 0) {
                    this.sceneWeights.set(id, safeWeight);
                }
            });
        } else if (typeof weights === 'object' && weights) {
            Object.entries(weights).forEach(([id, weight]) => {
                const safeWeight = Number.isFinite(weight) ? Math.max(0, weight) : 0;
                if (safeWeight > 0) {
                    this.sceneWeights.set(id, safeWeight);
                }
            });
        }

        this.scenes.forEach((scene) => {
            if (!this.sceneWeights.has(scene.id)) {
                this.sceneWeights.set(scene.id, 1);
            }
        });
    }

    setSceneWeight(id, weight = 1) {
        const safeWeight = Number.isFinite(weight) ? Math.max(0, weight) : 0;
        if (!this.scenes.some((scene) => scene.id === id)) {
            return this.sceneWeights;
        }

        if (safeWeight <= 0) {
            this.sceneWeights.delete(id);
        } else {
            this.sceneWeights.set(id, safeWeight);
        }
        return this.sceneWeights;
    }

    getSceneWeight(id) {
        return this.sceneWeights.get(id) ?? 1;
    }

    setHistoryLimit(limit = 12) {
        this.historyLimit = Math.max(1, Math.floor(limit));
        if (this.history.length > this.historyLimit) {
            this.history.length = this.historyLimit;
        }
    }

    queueScene(id, options = {}) {
        if (!this.scenes.some((scene) => scene.id === id)) {
            return this.getQueue();
        }
        const entry = {
            id,
            immediate: Boolean(options.immediate),
            minDuration: Number.isFinite(options.minDuration) ? Math.max(0, options.minDuration) : null,
            metadata: options.metadata ?? null
        };
        this.queue.push(entry);
        this.pendingSceneId = null;
        return this.getQueue();
    }

    clearQueue() {
        this.queue = [];
        this.pendingSceneId = null;
        return this.getQueue();
    }

    removeQueuedScene(index = 0) {
        if (index < 0 || index >= this.queue.length) {
            return this.getQueue();
        }
        this.queue.splice(index, 1);
        return this.getQueue();
    }

    promoteQueuedScene(index = 0) {
        if (index <= 0 || index >= this.queue.length) {
            return this.getQueue();
        }
        const [entry] = this.queue.splice(index, 1);
        this.queue.unshift(entry);
        return this.getQueue();
    }

    peekQueuedSceneId() {
        return this.queue.length ? this.queue[0].id : null;
    }

    getQueue() {
        return this.queue.map((entry) => ({ ...entry }));
    }

    getHistory() {
        return this.history.map((entry) => ({ ...entry }));
    }

    clearHistory() {
        this.history = [];
    }

    acknowledgeManualSelection(elapsedSeconds = 0, elapsedBeats = null, sceneId = null, options = {}) {
        let resolvedSceneId = sceneId;
        let resolvedOptions = options;
        if (typeof sceneId === 'object' && sceneId !== null) {
            resolvedOptions = sceneId;
            resolvedSceneId = resolvedOptions.sceneId ?? null;
        }

        this.noteSceneChange(resolvedSceneId, {
            ...resolvedOptions,
            manual: true,
            elapsedSeconds,
            elapsedBeats
        });
    }

    noteSceneChange(sceneId, options = {}) {
        if (!sceneId) {
            this.lastChangeTime = options.elapsedSeconds ?? this.lastChangeTime;
            return;
        }

        const {
            elapsedSeconds = 0,
            elapsedBeats = null,
            manual = false,
            timestamp = typeof options.timestamp === 'number' ? options.timestamp : Date.now()
        } = options;

        this.lastChangeTime = elapsedSeconds;

        if (typeof elapsedBeats === 'number' && Number.isFinite(elapsedBeats)) {
            const sanitizedBeats = Math.max(0, elapsedBeats);
            this.lastElapsedBeats = sanitizedBeats;
            this.nextTempoBeat = Math.floor(sanitizedBeats) + this.tempoDivision;
        }

        if (this.queue.length && this.queue[0].id === sceneId) {
            this.queue.shift();
        } else if (this.queue.length) {
            const index = this.queue.findIndex((entry) => entry.id === sceneId);
            if (index !== -1) {
                this.queue.splice(index, 1);
            }
        }

        this.pendingSceneId = null;

        this.history.unshift({
            id: sceneId,
            manual: Boolean(manual),
            timestamp
        });
        if (this.history.length > this.historyLimit) {
            this.history.length = this.historyLimit;
        }
    }

    getSceneById(id) {
        return this.scenes.find((scene) => scene.id === id) || null;
    }

    getAvailableScenes() {
        return this.scenes.filter((scene) => this.rotationSet.has(scene.id));
    }

    computeNextSceneId(currentId) {
        const available = this.getAvailableScenes();
        if (available.length === 0) {
            return currentId;
        }

        if (this.ordering === 'shuffle') {
            const pool = available.filter((scene) => scene.id !== currentId);
            const candidates = pool.length > 0 ? pool : available;
            const weighted = candidates.map((scene) => ({
                scene,
                weight: Math.max(0, this.getSceneWeight(scene.id))
            }));
            let totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
            if (totalWeight <= 0) {
                totalWeight = candidates.length;
                return candidates[Math.floor(Math.random() * candidates.length)].id;
            }
            let pick = Math.random() * totalWeight;
            for (let i = 0; i < weighted.length; i += 1) {
                pick -= weighted[i].weight;
                if (pick <= 0) {
                    return weighted[i].scene.id;
                }
            }
            return weighted[weighted.length - 1].scene.id;
        }

        if (!currentId) {
            return available[0].id;
        }

        const currentIndex = available.findIndex((scene) => scene.id === currentId);
        if (currentIndex === -1) {
            return available[0].id;
        }

        const nextIndex = (currentIndex + 1) % available.length;
        return available[nextIndex].id;
    }

    getNextSceneId(currentId, options = {}) {
        const { preview = false } = options;

        const queuedId = this.peekQueuedSceneId();
        if (queuedId) {
            return queuedId;
        }

        if (this.ordering === 'shuffle') {
            if (preview) {
                if (!this.pendingSceneId || !this.rotationSet.has(this.pendingSceneId) || this.pendingSceneId === currentId) {
                    this.pendingSceneId = this.computeNextSceneId(currentId);
                }
                return this.pendingSceneId;
            }

            const nextId = (this.pendingSceneId && this.rotationSet.has(this.pendingSceneId) && this.pendingSceneId !== currentId)
                ? this.pendingSceneId
                : this.computeNextSceneId(currentId);
            this.pendingSceneId = null;
            return nextId;
        }

        return this.computeNextSceneId(currentId);
    }

    peekNextSceneId(currentId) {
        return this.getNextSceneId(currentId, { preview: true });
    }

    getPreviousSceneId(currentId) {
        const available = this.getAvailableScenes();
        if (available.length === 0) {
            return currentId;
        }

        if (!currentId) {
            return available[available.length - 1].id;
        }

        const currentIndex = available.findIndex((scene) => scene.id === currentId);
        if (currentIndex === -1) {
            return available[available.length - 1].id;
        }

        const previousIndex = (currentIndex - 1 + available.length) % available.length;
        return available[previousIndex].id;
    }

    update(audioData, elapsedSeconds = 0, currentSceneId = null) {
        const sinceLastChange = elapsedSeconds - this.lastChangeTime;

        const queuedEntry = this.queue.length ? this.queue[0] : null;
        if (queuedEntry) {
            const minDuration = queuedEntry.minDuration != null
                ? Math.max(0, queuedEntry.minDuration)
                : this.minDurationSeconds;
            if (queuedEntry.immediate || sinceLastChange >= minDuration) {
                return this.getSceneById(queuedEntry.id);
            }
        }

        if (this.mode === 'off') {
            return null;
        }

        if (this.mode === 'interval') {
            if (sinceLastChange >= this.intervalSeconds) {
                this.lastChangeTime = elapsedSeconds;
                const nextId = this.getNextSceneId(currentSceneId, { preview: false });
                return this.getSceneById(nextId);
            }
            return null;
        }

        const beats = audioData?.rhythmPhases?.elapsedBeats ?? null;
        const downbeat = audioData?.colorChoreography?.downbeatColor ?? 0;
        const transient = audioData?.extremeDynamics?.transientBurst ?? 0;
        const energy = audioData?.rms ?? 0;

        if (this.mode === 'tempo') {
            if (typeof beats === 'number') {
                const beatCount = Math.max(0, Math.floor(beats));
                if (beatCount >= this.nextTempoBeat && sinceLastChange > this.cooldownSeconds * 0.5) {
                    this.nextTempoBeat = beatCount + this.tempoDivision;
                    this.lastChangeTime = elapsedSeconds;
                    const nextId = this.getNextSceneId(currentSceneId, { preview: false });
                    return this.getSceneById(nextId);
                }
                if (beatCount < this.lastElapsedBeats) {
                    this.nextTempoBeat = beatCount + this.tempoDivision;
                }
                this.lastElapsedBeats = beatCount;
            }
            return null;
        }

        if (this.mode === 'energy') {
            if (sinceLastChange > this.cooldownSeconds && energy >= this.energyThreshold) {
                this.lastChangeTime = elapsedSeconds;
                const nextId = this.getNextSceneId(currentSceneId, { preview: false });
                return this.getSceneById(nextId);
            }
            return null;
        }

        if (sinceLastChange > this.cooldownSeconds && downbeat > 0.78 && transient > 0.45) {
            this.lastChangeTime = elapsedSeconds;
            const nextId = this.getNextSceneId(currentSceneId, { preview: false });
            return this.getSceneById(nextId);
        }

        return null;
    }

    calculateCountdown(audioData, sinceLastChange) {
        const queuedEntry = this.queue.length ? this.queue[0] : null;
        if (queuedEntry) {
            const minDuration = queuedEntry.minDuration != null
                ? Math.max(0, queuedEntry.minDuration)
                : this.minDurationSeconds;
            return queuedEntry.immediate ? 0 : Math.max(0, minDuration - sinceLastChange);
        }

        if (this.mode === 'off') {
            return null;
        }

        if (this.mode === 'interval') {
            return Math.max(0, this.intervalSeconds - sinceLastChange);
        }

        if (this.mode === 'tempo') {
            const beats = audioData?.rhythmPhases?.elapsedBeats;
            if (typeof beats === 'number' && Number.isFinite(beats)) {
                const beatsRemaining = Math.max(0, this.nextTempoBeat - beats);
                const bpm = audioData?.bpm || 0;
                if (bpm > 0) {
                    return beatsRemaining * (60 / bpm);
                }
                return beatsRemaining;
            }
            return null;
        }

        return Math.max(0, this.cooldownSeconds - sinceLastChange);
    }

    getStatus(audioData, elapsedSeconds = 0, currentSceneId = null) {
        const sinceLastChange = Math.max(0, elapsedSeconds - this.lastChangeTime);
        const nextId = this.peekNextSceneId(currentSceneId);
        const nextScene = nextId ? this.getSceneById(nextId) : null;

        return {
            mode: this.mode,
            ordering: this.ordering,
            intervalSeconds: this.intervalSeconds,
            energyThreshold: this.energyThreshold,
            tempoDivision: this.tempoDivision,
            cooldownSeconds: this.cooldownSeconds,
            minDurationSeconds: this.minDurationSeconds,
            rotationSet: [...this.rotationSet],
            nextSceneId: nextScene?.id || null,
            nextSceneName: nextScene?.name || null,
            availableScenes: this.getAvailableScenes().length,
            countdownSeconds: this.calculateCountdown(audioData, sinceLastChange),
            sinceLastChange,
            queue: this.getQueue().map((entry) => ({
                id: entry.id,
                name: this.getSceneById(entry.id)?.name || null,
                immediate: entry.immediate,
                minDuration: entry.minDuration
            })),
            history: this.getHistory().map((entry) => ({
                id: entry.id,
                name: this.getSceneById(entry.id)?.name || null,
                manual: entry.manual,
                timestamp: entry.timestamp
            })),
            weights: Object.fromEntries(this.sceneWeights)
        };
    }

    getState() {
        return {
            mode: this.mode,
            intervalSeconds: this.intervalSeconds,
            energyThreshold: this.energyThreshold,
            tempoDivision: this.tempoDivision,
            cooldownSeconds: this.cooldownSeconds,
            rotationSet: [...this.rotationSet],
            ordering: this.ordering,
            minDurationSeconds: this.minDurationSeconds,
            weights: Object.fromEntries(this.sceneWeights)
        };
    }
}

export default SceneDirector;
