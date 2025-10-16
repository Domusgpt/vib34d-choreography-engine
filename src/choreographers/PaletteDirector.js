/**
 * PaletteDirector
 * -------------------------------------------------------------
 * Keeps palette selection lively by sequencing curated colour profiles
 * against live audio dynamics. Designed for lightweight demo surfaces
 * that talk directly to WebGL visualizers without the full control bus.
 */
export class PaletteDirector {
    constructor(options = {}) {
        this.palettes = Array.isArray(options.palettes) ? [...options.palettes] : [];
        this.mode = options.mode || 'reactive'; // 'reactive' | 'interval' | 'tempo' | 'energy' | 'off'
        this.intervalSeconds = Math.max(2, options.intervalSeconds || 32);
        this.energyThreshold = Math.max(0, Math.min(1, options.energyThreshold ?? 0.72));
        this.tempoDivision = Math.max(1, Math.floor(options.tempoDivision || 8));
        this.cooldownSeconds = Math.max(1.5, options.cooldownSeconds || 3);
        this.playlist = new Set();
        this.setPlaylist(options.playlist || this.palettes.map((palette) => palette.id));

        this.lastChangeTime = 0;
        this.nextTempoBeat = this.tempoDivision;
        this.lastElapsedBeats = 0;
    }

    setPalettes(palettes = []) {
        this.palettes = [...palettes];
        // Refresh playlist to keep only valid ids
        const validIds = new Set(this.palettes.map((palette) => palette.id));
        const preserved = [...this.playlist].filter((id) => validIds.has(id));
        this.playlist = new Set(preserved);
        if (this.playlist.size === 0) {
            this.playlist = new Set(validIds);
        }
    }

    setMode(mode = 'reactive') {
        this.mode = mode;
        // Reset timers so new mode starts fresh
        this.lastChangeTime = 0;
        this.nextTempoBeat = this.tempoDivision;
    }

    setInterval(seconds = 32) {
        this.intervalSeconds = Math.max(2, seconds);
    }

    setEnergyThreshold(threshold = 0.72) {
        this.energyThreshold = Math.max(0, Math.min(1, threshold));
    }

    setTempoDivision(beats = 8) {
        this.tempoDivision = Math.max(1, Math.floor(beats));
        this.nextTempoBeat = this.tempoDivision;
    }

    setPlaylist(ids = []) {
        const validIds = new Set(this.palettes.map((palette) => palette.id));
        const filtered = ids.filter((id) => validIds.has(id));
        if (filtered.length === 0 && this.palettes.length > 0) {
            this.playlist = new Set(this.palettes.map((palette) => palette.id));
        } else {
            this.playlist = new Set(filtered);
        }
    }

    togglePlaylist(id) {
        if (!this.palettes.some((palette) => palette.id === id)) {
            return this.playlist;
        }

        if (this.playlist.has(id)) {
            this.playlist.delete(id);
        } else {
            this.playlist.add(id);
        }

        if (this.playlist.size === 0) {
            this.playlist = new Set(this.palettes.map((palette) => palette.id));
        }
        return this.playlist;
    }

    acknowledgeManualSelection(elapsedSeconds = 0) {
        this.lastChangeTime = elapsedSeconds;
    }

    /**
     * Determine next palette id from playlist after current one.
     */
    getNextPalette(currentId) {
        const available = [...this.playlist];
        if (available.length === 0) {
            return currentId;
        }

        const currentIndex = available.indexOf(currentId);
        if (currentIndex === -1) {
            return available[0];
        }

        const nextIndex = (currentIndex + 1) % available.length;
        return available[nextIndex];
    }

    /**
     * Main update loop. Returns a palette id when a change is requested.
     */
    update(audioData, elapsedSeconds = 0, currentPaletteId = null) {
        if (this.mode === 'off') {
            return null;
        }

        const sinceLastChange = elapsedSeconds - this.lastChangeTime;

        if (this.mode === 'interval') {
            if (sinceLastChange >= this.intervalSeconds) {
                this.lastChangeTime = elapsedSeconds;
                return this.getNextPalette(currentPaletteId);
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
                    return this.getNextPalette(currentPaletteId);
                }
                if (beatCount < this.lastElapsedBeats) {
                    // Handle BPM restarts by resetting the target beat
                    this.nextTempoBeat = beatCount + this.tempoDivision;
                }
                this.lastElapsedBeats = beatCount;
            }
            return null;
        }

        if (this.mode === 'energy') {
            if (sinceLastChange > this.cooldownSeconds && energy >= this.energyThreshold) {
                this.lastChangeTime = elapsedSeconds;
                return this.getNextPalette(currentPaletteId);
            }
            return null;
        }

        // Reactive (default) - wait for strong downbeats & transients
        if (sinceLastChange > this.cooldownSeconds && downbeat > 0.85 && transient > 0.35) {
            this.lastChangeTime = elapsedSeconds;
            return this.getNextPalette(currentPaletteId);
        }

        return null;
    }

    getState() {
        return {
            mode: this.mode,
            intervalSeconds: this.intervalSeconds,
            energyThreshold: this.energyThreshold,
            tempoDivision: this.tempoDivision,
            playlist: [...this.playlist]
        };
    }
}

export default PaletteDirector;
