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
        this.ordering = options.ordering === 'shuffle' ? 'shuffle' : 'forward';

        this.rotationSet = new Set();
        this.manualQueue = [];
        this.history = [];
        this.historyLimit = Math.max(3, options.historyLimit || 12);
        this.favorites = new Set();

        this.setRotationSet(options.rotationSet || this.scenes.map((scene) => scene.id));
        this.setFavorites(options.favorites || []);

        this.lastChangeTime = 0;
        this.nextTempoBeat = this.tempoDivision;
        this.lastElapsedBeats = 0;
        this.pendingSceneId = null;
    }

    setScenes(scenes = []) {
        this.scenes = [...scenes];
        const validIds = new Set(this.scenes.map((scene) => scene.id));

        const preservedRotation = [...this.rotationSet].filter((id) => validIds.has(id));
        this.rotationSet = preservedRotation.length > 0 ? new Set(preservedRotation) : new Set(validIds);

        this.manualQueue = this.manualQueue.filter((id) => validIds.has(id));
        this.favorites = new Set([...this.favorites].filter((id) => validIds.has(id)));

        this.pendingSceneId = null;
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

    setFavorites(ids = []) {
        const validIds = new Set(this.scenes.map((scene) => scene.id));
        const filtered = ids.filter((id) => validIds.has(id));
        this.favorites = new Set(filtered);
    }

    toggleFavorite(id) {
        if (!this.scenes.some((scene) => scene.id === id)) {
            return this.favorites;
        }

        if (this.favorites.has(id)) {
            this.favorites.delete(id);
        } else {
            this.favorites.add(id);
        }

        return this.favorites;
    }

    isFavorite(id) {
        return this.favorites.has(id);
    }

    getFavorites() {
        return [...this.favorites];
    }

    queueScene(id) {
        if (!this.scenes.some((scene) => scene.id === id)) {
            return this.manualQueue;
        }

        if (!this.manualQueue.includes(id)) {
            this.manualQueue.push(id);
        }

        return this.manualQueue;
    }

    removeFromQueue(id) {
        this.manualQueue = this.manualQueue.filter((queuedId) => queuedId !== id);
        return this.manualQueue;
    }

    clearQueue() {
        this.manualQueue = [];
        return this.manualQueue;
    }

    reorderQueue(ids = []) {
        const validIds = new Set(this.scenes.map((scene) => scene.id));
        const unique = [];
        ids.forEach((id) => {
            if (validIds.has(id) && !unique.includes(id)) {
                unique.push(id);
            }
        });
        this.manualQueue = unique;
        return this.manualQueue;
    }

    getQueue() {
        return [...this.manualQueue];
    }

    setHistoryLimit(limit = 12) {
        this.historyLimit = Math.max(3, limit);
        if (this.history.length > this.historyLimit) {
            this.history.length = this.historyLimit;
        }
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

    acknowledgeManualSelection(elapsedSeconds = 0, elapsedBeats = null, sceneId = null, options = {}) {
        this.lastChangeTime = elapsedSeconds;
        if (typeof elapsedBeats === 'number' && Number.isFinite(elapsedBeats)) {
            const sanitizedBeats = Math.max(0, elapsedBeats);
            this.lastElapsedBeats = sanitizedBeats;
            this.nextTempoBeat = Math.floor(sanitizedBeats) + this.tempoDivision;
        }
        this.pendingSceneId = null;

        if (sceneId) {
            if (options.consumeQueue !== false) {
                this.removeFromQueue(sceneId);
            }
            this.registerSceneActivation(sceneId, {
                elapsedSeconds,
                manual: options.manual ?? true,
                reason: options.reason || 'manual'
            });
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

        while (this.manualQueue.length > 0) {
            const queuedId = this.manualQueue[0];
            const queuedScene = this.getSceneById(queuedId);
            if (!queuedScene) {
                this.manualQueue.shift();
                continue;
            }
            return queuedScene.id;
        }

        if (this.ordering === 'shuffle') {
            const pool = available.filter((scene) => scene.id !== currentId);
            if (pool.length === 0) {
                return available[0].id;
            }
            const randomIndex = Math.floor(Math.random() * pool.length);
            return pool[randomIndex].id;
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

        if (this.manualQueue.length > 0) {
            const queuedId = this.manualQueue[0];
            const queuedScene = this.getSceneById(queuedId);
            if (!queuedScene) {
                this.manualQueue.shift();
                return this.getNextSceneId(currentId, options);
            }

            if (!preview) {
                this.manualQueue.shift();
            }

            return queuedScene.id;
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
        if (this.mode === 'off') {
            return null;
        }

        const sinceLastChange = elapsedSeconds - this.lastChangeTime;

        if (this.mode === 'interval') {
            if (sinceLastChange >= this.intervalSeconds) {
                this.lastChangeTime = elapsedSeconds;
                const nextId = this.getNextSceneId(currentSceneId, { preview: false });
                const nextScene = this.getSceneById(nextId);
                if (nextScene) {
                    this.registerSceneActivation(nextScene.id, {
                        elapsedSeconds,
                        manual: false,
                        reason: 'interval'
                    });
                }
                return nextScene;
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
                    const nextScene = this.getSceneById(nextId);
                    if (nextScene) {
                        this.registerSceneActivation(nextScene.id, {
                            elapsedSeconds,
                            manual: false,
                            reason: 'tempo'
                        });
                    }
                    return nextScene;
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
                const nextScene = this.getSceneById(nextId);
                if (nextScene) {
                    this.registerSceneActivation(nextScene.id, {
                        elapsedSeconds,
                        manual: false,
                        reason: 'energy'
                    });
                }
                return nextScene;
            }
            return null;
        }

        if (sinceLastChange > this.cooldownSeconds && downbeat > 0.78 && transient > 0.45) {
            this.lastChangeTime = elapsedSeconds;
            const nextId = this.getNextSceneId(currentSceneId, { preview: false });
            const nextScene = this.getSceneById(nextId);
            if (nextScene) {
                this.registerSceneActivation(nextScene.id, {
                    elapsedSeconds,
                    manual: false,
                    reason: 'reactive'
                });
            }
            return nextScene;
        }

        return null;
    }

    calculateCountdown(audioData, sinceLastChange) {
        if (this.mode === 'off') {
            return null;
        }

        if (this.manualQueue.length > 0) {
            return 0;
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
            rotationSet: [...this.rotationSet],
            nextSceneId: nextScene?.id || null,
            nextSceneName: nextScene?.name || null,
            availableScenes: this.getAvailableScenes().length,
            countdownSeconds: this.calculateCountdown(audioData, sinceLastChange),
            sinceLastChange,
            queue: this.manualQueue
                .map((id) => {
                    const scene = this.getSceneById(id);
                    return scene
                        ? { id: scene.id, name: scene.name, description: scene.description || null }
                        : null;
                })
                .filter(Boolean),
            favorites: [...this.favorites]
                .map((id) => {
                    const scene = this.getSceneById(id);
                    return scene
                        ? { id: scene.id, name: scene.name }
                        : null;
                })
                .filter(Boolean),
            history: this.getHistory().map((entry) => ({ ...entry }))
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
            favorites: [...this.favorites],
            queue: [...this.manualQueue]
        };
    }

    getHistory(limit = this.historyLimit) {
        return this.history.slice(0, limit);
    }

    registerSceneActivation(sceneId, context = {}) {
        const scene = this.getSceneById(sceneId);
        if (!scene) {
            return;
        }

        const entry = {
            id: scene.id,
            name: scene.name,
            description: scene.description || null,
            timestamp: Date.now(),
            mode: context.mode || this.mode,
            ordering: context.ordering || this.ordering,
            elapsedSeconds: context.elapsedSeconds ?? null,
            manual: context.manual ?? false,
            reason: context.reason || (context.manual ? 'manual' : 'auto')
        };

        this.history.unshift(entry);
        if (this.history.length > this.historyLimit) {
            this.history.length = this.historyLimit;
        }
    }
}

export default SceneDirector;
