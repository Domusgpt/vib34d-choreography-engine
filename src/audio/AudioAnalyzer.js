/**
 * Professional Audio Analyzer
 * 7-band frequency analysis + spectral features + onset detection
 *
 * A Paul Phillips Manifestation
 * © 2025 Clear Seas Solutions LLC
 */

export class AudioAnalyzer {
    constructor(analyserNode) {
        this.analyser = analyserNode;
        this.sampleRate = analyserNode.context.sampleRate;
        this.fftSize = analyserNode.fftSize;
        this.binCount = analyserNode.frequencyBinCount;

        // Data buffers
        this.freqData = new Uint8Array(this.binCount);
        this.timeData = new Uint8Array(this.binCount);
        this.prevFreqData = new Uint8Array(this.binCount);

        // 7 frequency bands for professional audio analysis
        this.bands = {
            subBass: { low: 20, high: 60, value: 0 },      // Kick drums, sub bass
            bass: { low: 60, high: 250, value: 0 },        // Bass guitar, low toms
            lowMid: { low: 250, high: 500, value: 0 },     // Guitars, keyboards
            mid: { low: 500, high: 2000, value: 0 },       // Vocals, snares
            highMid: { low: 2000, high: 4000, value: 0 },  // Cymbals, guitars
            high: { low: 4000, high: 8000, value: 0 },     // Hi-hats, strings
            air: { low: 8000, high: 20000, value: 0 }      // Airiness, sparkle
        };

        // Smoothed band values for less jitter
        this.smoothedBands = { ...this.bands };
        this.smoothingFactor = 0.8; // 0 = instant, 1 = no change

        // Spectral features
        this.spectralCentroid = 0;  // Brightness of sound (weighted average frequency)
        this.spectralRolloff = 0;   // Frequency threshold for 85% of energy
        this.spectralFlux = 0;      // Rate of spectral change (onset detection)
        this.rms = 0;               // Root mean square (overall loudness)

        // Onset detection (kicks, snares, transients)
        this.onsetHistory = [];
        this.lastOnsetTime = 0;
        this.onsetThreshold = 0.15; // Minimum flux for onset detection

        // BPM estimation
        this.estimatedBPM = 120;
        this.maxOnsetHistory = 32; // Keep last 32 onsets for BPM calculation
    }

    /**
     * Main analysis method - call this every frame
     */
    analyze() {
        // Get current audio data
        this.analyser.getByteFrequencyData(this.freqData);
        this.analyser.getByteTimeDomainData(this.timeData);

        // Analyze frequency bands
        this.analyzeBands();

        // Calculate spectral features
        this.calcSpectralCentroid();
        this.calcSpectralRolloff();
        this.calcSpectralFlux();
        this.calcRMS();

        // Detect onsets (kicks, snares)
        const onset = this.detectOnset();

        // Estimate BPM if we have enough data
        if (this.onsetHistory.length >= 4) {
            this.estimateBPM();
        }

        // Store for next frame (for flux calculation)
        this.prevFreqData.set(this.freqData);

        return {
            bands: this.smoothedBands,
            spectralCentroid: this.spectralCentroid,
            spectralRolloff: this.spectralRolloff,
            spectralFlux: this.spectralFlux,
            rms: this.rms,
            onset: onset,
            bpm: this.estimatedBPM
        };
    }

    /**
     * Analyze 7 frequency bands
     */
    analyzeBands() {
        for (const [name, band] of Object.entries(this.bands)) {
            const lowBin = this.freqToBin(band.low);
            const highBin = this.freqToBin(band.high);

            let sum = 0;
            let count = 0;

            for (let i = lowBin; i <= highBin; i++) {
                sum += this.freqData[i];
                count++;
            }

            const avgValue = count > 0 ? sum / count / 255 : 0; // Normalize to 0-1

            // Apply exponential smoothing to reduce jitter
            const smoothed = this.smoothedBands[name];
            smoothed.value = (this.smoothingFactor * smoothed.value) +
                           ((1 - this.smoothingFactor) * avgValue);
        }
    }

    /**
     * Calculate spectral centroid (brightness of sound)
     * Higher values = brighter sound (more high frequencies)
     */
    calcSpectralCentroid() {
        let weightedSum = 0;
        let sum = 0;

        for (let i = 0; i < this.binCount; i++) {
            const magnitude = this.freqData[i];
            const frequency = this.binToFreq(i);

            weightedSum += frequency * magnitude;
            sum += magnitude;
        }

        // Normalize to 0-1 range (assuming max centroid around 10kHz)
        this.spectralCentroid = sum > 0 ? Math.min(1, weightedSum / sum / 10000) : 0;
    }

    /**
     * Calculate spectral rolloff
     * Frequency below which 85% of energy is contained
     */
    calcSpectralRolloff() {
        let totalEnergy = 0;
        for (let i = 0; i < this.binCount; i++) {
            totalEnergy += this.freqData[i];
        }

        const threshold = totalEnergy * 0.85;
        let cumulativeEnergy = 0;

        for (let i = 0; i < this.binCount; i++) {
            cumulativeEnergy += this.freqData[i];
            if (cumulativeEnergy >= threshold) {
                // Normalize to 0-1 (assuming Nyquist frequency is max)
                this.spectralRolloff = i / this.binCount;
                return;
            }
        }

        this.spectralRolloff = 1.0;
    }

    /**
     * Calculate spectral flux (rate of spectral change)
     * High flux = onset/transient event (kick, snare, etc)
     */
    calcSpectralFlux() {
        let flux = 0;

        for (let i = 0; i < this.binCount; i++) {
            const diff = this.freqData[i] - this.prevFreqData[i];
            // Only positive changes (energy increases)
            if (diff > 0) {
                flux += diff;
            }
        }

        // Normalize to 0-1 range
        this.spectralFlux = Math.min(1, flux / (this.binCount * 128));
    }

    /**
     * Calculate RMS (root mean square) for overall loudness
     */
    calcRMS() {
        let sumSquares = 0;

        for (let i = 0; i < this.timeData.length; i++) {
            const normalized = (this.timeData[i] - 128) / 128; // Convert to -1 to 1
            sumSquares += normalized * normalized;
        }

        this.rms = Math.sqrt(sumSquares / this.timeData.length);
    }

    /**
     * Detect onset events (kicks, snares, transients)
     */
    detectOnset() {
        const now = Date.now();

        // Check if flux exceeds threshold and enough time has passed since last onset
        if (this.spectralFlux > this.onsetThreshold &&
            now - this.lastOnsetTime > 100) { // Minimum 100ms between onsets

            this.lastOnsetTime = now;
            this.onsetHistory.push(now);

            // Keep history limited
            if (this.onsetHistory.length > this.maxOnsetHistory) {
                this.onsetHistory.shift();
            }

            return {
                detected: true,
                strength: this.spectralFlux,
                time: now
            };
        }

        return {
            detected: false,
            strength: this.spectralFlux,
            time: now
        };
    }

    /**
     * Estimate BPM from onset history
     */
    estimateBPM() {
        if (this.onsetHistory.length < 4) {
            return 120; // Default
        }

        // Calculate intervals between onsets
        const intervals = [];
        for (let i = 1; i < this.onsetHistory.length; i++) {
            intervals.push(this.onsetHistory[i] - this.onsetHistory[i - 1]);
        }

        // Get median interval (more robust than average)
        intervals.sort((a, b) => a - b);
        const medianInterval = intervals[Math.floor(intervals.length / 2)];

        // Convert interval to BPM (60000ms per minute)
        const bpm = 60000 / medianInterval;

        // Clamp to reasonable range
        this.estimatedBPM = Math.max(60, Math.min(200, bpm));

        return this.estimatedBPM;
    }

    /**
     * Convert frequency to FFT bin index
     */
    freqToBin(frequency) {
        return Math.round(frequency / (this.sampleRate / 2) * this.binCount);
    }

    /**
     * Convert FFT bin index to frequency
     */
    binToFreq(bin) {
        return bin * (this.sampleRate / 2) / this.binCount;
    }

    /**
     * Get current state for debugging
     */
    getDebugInfo() {
        return {
            bands: Object.entries(this.smoothedBands).map(([name, band]) => ({
                name,
                value: band.value.toFixed(3),
                range: `${band.low}-${band.high}Hz`
            })),
            spectralCentroid: this.spectralCentroid.toFixed(3),
            spectralRolloff: this.spectralRolloff.toFixed(3),
            spectralFlux: this.spectralFlux.toFixed(3),
            rms: this.rms.toFixed(3),
            bpm: this.estimatedBPM.toFixed(1),
            onsetCount: this.onsetHistory.length
        };
    }
}
