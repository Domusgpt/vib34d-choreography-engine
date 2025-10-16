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

        this.rotationSet = new Set();
        this.setRotationSet(options.rotationSet || this.scenes.map((scene) => scene.id));

        this.lastChangeTime = 0;
        this.nextTempoBeat = this.tempoDivision;
        this.lastElapsedBeats = 0;
    }

    setScenes(scenes = []) {
        this.scenes = [...scenes];
        const validIds = new Set(this.scenes.map((scene) => scene.id));
        const preserved = [...this.rotationSet].filter((id) => validIds.has(id));
        this.rotationSet = new Set(preserved);
        if (this.rotationSet.size === 0) {
            this.rotationSet = new Set(validIds);
        }
    }

    setMode(mode = 'reactive') {
        this.mode = mode;
        this.lastChangeTime = 0;
        this.nextTempoBeat = this.tempoDivision;
    }

    setInterval(seconds = 48) {
        this.intervalSeconds = Math.max(4, seconds);
    }

    setEnergyThreshold(threshold = 0.78) {
        this.energyThreshold = Math.max(0, Math.min(1, threshold));
    }

    setTempoDivision(beats = 32) {
        this.tempoDivision = Math.max(1, Math.floor(beats));
        this.nextTempoBeat = this.tempoDivision;
    }

    setCooldown(seconds = 6) {
        this.cooldownSeconds = Math.max(1.5, seconds);
    }

    setRotationSet(ids = []) {
        const validIds = new Set(this.scenes.map((scene) => scene.id));
        const filtered = ids.filter((id) => validIds.has(id));
        if (filtered.length === 0 && this.scenes.length > 0) {
            this.rotationSet = new Set(this.scenes.map((scene) => scene.id));
        } else {
            this.rotationSet = new Set(filtered);
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

        return this.rotationSet;
    }

    acknowledgeManualSelection(elapsedSeconds = 0) {
        this.lastChangeTime = elapsedSeconds;
    }

    getSceneById(id) {
        return this.scenes.find((scene) => scene.id === id) || null;
    }

    getNextSceneId(currentId) {
        const available = this.scenes.filter((scene) => this.rotationSet.has(scene.id));
        if (available.length === 0) {
            return currentId;
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

    update(audioData, elapsedSeconds = 0, currentSceneId = null) {
        if (this.mode === 'off') {
            return null;
        }

        const sinceLastChange = elapsedSeconds - this.lastChangeTime;

        if (this.mode === 'interval') {
            if (sinceLastChange >= this.intervalSeconds) {
                this.lastChangeTime = elapsedSeconds;
                const nextId = this.getNextSceneId(currentSceneId);
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
                    const nextId = this.getNextSceneId(currentSceneId);
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
                const nextId = this.getNextSceneId(currentSceneId);
                return this.getSceneById(nextId);
            }
            return null;
        }

        if (sinceLastChange > this.cooldownSeconds && downbeat > 0.78 && transient > 0.45) {
            this.lastChangeTime = elapsedSeconds;
            const nextId = this.getNextSceneId(currentSceneId);
            return this.getSceneById(nextId);
        }

        return null;
    }

    getState() {
        return {
            mode: this.mode,
            intervalSeconds: this.intervalSeconds,
            energyThreshold: this.energyThreshold,
            tempoDivision: this.tempoDivision,
            cooldownSeconds: this.cooldownSeconds,
            rotationSet: [...this.rotationSet]
        };
    }
}

export default SceneDirector;
