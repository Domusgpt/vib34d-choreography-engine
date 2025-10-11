/**
 * Advanced Audio Analyzer - Professional Grade
 * Extended from base AudioAnalyzer with:
 * - Harmonic content analysis
 * - Rhythm/groove detection
 * - Stereo width analysis
 * - Perceptual loudness (LUFS-style)
 * - Beat tracking and phase
 * - Melodic contour tracking
 * - Dynamic range compression detection
 *
 * A Paul Phillips Manifestation
 * © 2025 Clear Seas Solutions LLC
 */

import { AudioAnalyzer } from './AudioAnalyzer.js';

export class AdvancedAudioAnalyzer extends AudioAnalyzer {
    constructor(analyserNode, stereoAnalyserNode = null) {
        super(analyserNode);

        // Stereo analysis (if second analyser provided)
        this.stereoAnalyser = stereoAnalyserNode;
        this.stereoWidth = 0.5; // 0 = mono, 1 = wide stereo

        // Harmonic content tracking
        this.harmonicContent = 0; // 0 = inharmonic/noise, 1 = harmonic/tonal
        this.fundamentalFreq = 0; // Detected fundamental frequency
        this.harmonicRatio = 0; // Ratio of harmonic to total energy

        // Rhythm and groove
        this.beatPhase = 0; // 0-1, position within current beat
        this.downbeatPhase = 0; // 0-1, position within current bar
        this.beatStrength = 0; // How strong the beat is (0-1)
        this.timeSignature = 4; // Detected time signature
        this.swing = 0; // Detected swing amount (-1 to 1)

        // Perceptual loudness (LUFS-style)
        this.perceivedLoudness = 0; // Weighted loudness (0-1)
        this.loudnessHistory = new Array(30).fill(0); // ~500ms history at 60fps
        this.loudnessHistoryIndex = 0;

        // Melodic contour
        this.melodicDirection = 0; // -1 = down, 0 = static, 1 = up
        this.melodicActivity = 0; // How much pitch movement (0-1)
        this.pitchHistory = [];
        this.maxPitchHistory = 16;

        // Dynamic range and compression
        this.dynamicRange = 1.0; // 0 = heavily compressed, 1 = natural dynamics
        this.compressionAmount = 0; // Detected compression (0-1)
        this.peakToAverage = 1.0; // Ratio of peak to average (crest factor)

        // Transient detection
        this.transientStrength = 0; // Strength of transient content (0-1)
        this.sustainedStrength = 0; // Strength of sustained content (0-1)

        // Frequency balance
        this.bassBalance = 0.33; // Relative bass energy
        this.midBalance = 0.33; // Relative mid energy
        this.highBalance = 0.33; // Relative high energy

        // Spectral features extended
        this.spectralSpread = 0; // How spread out the spectrum is
        this.spectralSkewness = 0; // Asymmetry of spectrum
        this.spectralKurtosis = 0; // "Peakedness" of spectrum
        this.spectralFlatness = 0; // How noise-like vs tonal (0 = tonal, 1 = noise)

        // Attack/decay characteristics
        this.attackTime = 0; // Detected attack time (ms)
        this.decayTime = 0; // Detected decay time (ms)
        this.envelopeShape = 0; // 0 = percussive, 1 = sustained

        // Modulation detection
        this.amplitudeModulation = 0; // Tremolo detection (0-1)
        this.frequencyModulation = 0; // Vibrato detection (0-1)
        this.modulationRate = 0; // Hz of detected modulation
    }

    /**
     * Enhanced analysis with all advanced features
     */
    analyze() {
        // Run base analysis first
        const baseAnalysis = super.analyze();

        // Advanced analyses
        this.analyzeHarmonicContent();
        this.analyzeRhythm();
        this.analyzePerceivedLoudness();
        this.analyzeMelodicContour();
        this.analyzeDynamicRange();
        this.analyzeTransients();
        this.analyzeFrequencyBalance();
        this.analyzeSpectralShape();
        this.analyzeEnvelope();
        this.analyzeModulation();

        if (this.stereoAnalyser) {
            this.analyzeStereoWidth();
        }

        return {
            ...baseAnalysis,
            // Harmonic
            harmonicContent: this.harmonicContent,
            fundamentalFreq: this.fundamentalFreq,
            harmonicRatio: this.harmonicRatio,
            // Rhythm
            beatPhase: this.beatPhase,
            downbeatPhase: this.downbeatPhase,
            beatStrength: this.beatStrength,
            swing: this.swing,
            // Loudness
            perceivedLoudness: this.perceivedLoudness,
            // Melodic
            melodicDirection: this.melodicDirection,
            melodicActivity: this.melodicActivity,
            // Dynamics
            dynamicRange: this.dynamicRange,
            compressionAmount: this.compressionAmount,
            peakToAverage: this.peakToAverage,
            // Transients
            transientStrength: this.transientStrength,
            sustainedStrength: this.sustainedStrength,
            // Balance
            bassBalance: this.bassBalance,
            midBalance: this.midBalance,
            highBalance: this.highBalance,
            // Spectral shape
            spectralSpread: this.spectralSpread,
            spectralSkewness: this.spectralSkewness,
            spectralKurtosis: this.spectralKurtosis,
            spectralFlatness: this.spectralFlatness,
            // Envelope
            attackTime: this.attackTime,
            decayTime: this.decayTime,
            envelopeShape: this.envelopeShape,
            // Modulation
            amplitudeModulation: this.amplitudeModulation,
            frequencyModulation: this.frequencyModulation,
            modulationRate: this.modulationRate,
            // Stereo
            stereoWidth: this.stereoWidth
        };
    }

    /**
     * Analyze harmonic content (tonal vs noise-like)
     */
    analyzeHarmonicContent() {
        // Autocorrelation method for fundamental frequency detection
        let maxCorrelation = 0;
        let bestLag = 0;

        for (let lag = 20; lag < 400; lag++) {
            let correlation = 0;
            for (let i = 0; i < this.timeData.length - lag; i++) {
                correlation += this.timeData[i] * this.timeData[i + lag];
            }
            if (correlation > maxCorrelation) {
                maxCorrelation = correlation;
                bestLag = lag;
            }
        }

        // Convert lag to frequency
        this.fundamentalFreq = bestLag > 0 ? this.sampleRate / bestLag : 0;

        // Harmonic content is the correlation strength
        this.harmonicContent = Math.min(1, maxCorrelation / 1000000);

        // Analyze harmonic to noise ratio
        const harmonicBins = this.getHarmonicBins(this.fundamentalFreq);
        let harmonicEnergy = 0;
        let totalEnergy = 0;

        for (let i = 0; i < this.binCount; i++) {
            const energy = this.freqData[i] * this.freqData[i];
            totalEnergy += energy;
            if (harmonicBins.includes(i)) {
                harmonicEnergy += energy;
            }
        }

        this.harmonicRatio = totalEnergy > 0 ? harmonicEnergy / totalEnergy : 0;
    }

    /**
     * Get FFT bins corresponding to harmonics of fundamental
     */
    getHarmonicBins(fundamental) {
        const bins = [];
        if (fundamental === 0) return bins;

        for (let harmonic = 1; harmonic <= 10; harmonic++) {
            const freq = fundamental * harmonic;
            if (freq > this.sampleRate / 2) break;
            const bin = this.freqToBin(freq);
            bins.push(bin);
        }
        return bins;
    }

    /**
     * Analyze rhythm, beat phase, and groove
     */
    analyzeRhythm() {
        if (this.estimatedBPM === 0) {
            this.beatPhase = 0;
            this.beatStrength = 0;
            return;
        }

        const beatDuration = 60000 / this.estimatedBPM; // ms per beat
        const now = Date.now();

        // Calculate phase within current beat
        if (this.onsetHistory.length > 0) {
            const lastOnset = this.onsetHistory[this.onsetHistory.length - 1];
            const timeSinceOnset = now - lastOnset;
            this.beatPhase = (timeSinceOnset % beatDuration) / beatDuration;

            // Beat strength based on recent onset activity
            const recentOnsets = this.onsetHistory.filter(t => now - t < 2000);
            this.beatStrength = Math.min(1, recentOnsets.length / 8);
        }

        // Downbeat phase (assuming 4/4 time)
        this.downbeatPhase = (this.beatPhase * this.timeSignature) % 1;

        // Analyze swing (deviation from straight timing)
        this.analyzeSwing();
    }

    /**
     * Detect swing/shuffle feel
     */
    analyzeSwing() {
        if (this.onsetHistory.length < 8) {
            this.swing = 0;
            return;
        }

        const beatDuration = 60000 / this.estimatedBPM;
        const recentOnsets = this.onsetHistory.slice(-8);

        let swingSum = 0;
        let count = 0;

        for (let i = 1; i < recentOnsets.length - 1; i += 2) {
            const interval1 = recentOnsets[i] - recentOnsets[i - 1];
            const interval2 = recentOnsets[i + 1] - recentOnsets[i];

            // Swing ratio: should be close to 1.0 for straight, >1.0 for swing
            const swingRatio = interval1 / (interval2 || 1);
            swingSum += swingRatio;
            count++;
        }

        if (count > 0) {
            const avgSwing = swingSum / count;
            // Normalize to -1 (reverse swing) to 1 (forward swing)
            this.swing = Math.max(-1, Math.min(1, (avgSwing - 1) * 2));
        }
    }

    /**
     * Perceptual loudness (weighted by frequency sensitivity)
     */
    analyzePerceivedLoudness() {
        // A-weighting approximation for perceptual loudness
        let weightedSum = 0;
        let totalWeight = 0;

        for (let i = 0; i < this.binCount; i++) {
            const freq = this.binToFreq(i);
            const weight = this.aWeighting(freq);
            weightedSum += this.freqData[i] * weight;
            totalWeight += weight;
        }

        const instant = totalWeight > 0 ? weightedSum / totalWeight / 255 : 0;

        // Add to history for smoothing
        this.loudnessHistory[this.loudnessHistoryIndex] = instant;
        this.loudnessHistoryIndex = (this.loudnessHistoryIndex + 1) % this.loudnessHistory.length;

        // Integrated loudness (average over history)
        this.perceivedLoudness = this.loudnessHistory.reduce((a, b) => a + b, 0) / this.loudnessHistory.length;
    }

    /**
     * A-weighting curve for perceptual loudness
     */
    aWeighting(freq) {
        if (freq < 20 || freq > 20000) return 0;

        // Simplified A-weighting (peaks around 3-4kHz)
        const f2 = freq * freq;
        const num = 12194 * 12194 * f2 * f2;
        const den = (f2 + 20.6 * 20.6) * (f2 + 12194 * 12194) *
                    Math.sqrt((f2 + 107.7 * 107.7) * (f2 + 737.9 * 737.9));
        return num / den;
    }

    /**
     * Track melodic contour and pitch movement
     */
    analyzeMelodicContour() {
        // Use spectral centroid as proxy for pitch
        this.pitchHistory.push(this.spectralCentroid);
        if (this.pitchHistory.length > this.maxPitchHistory) {
            this.pitchHistory.shift();
        }

        if (this.pitchHistory.length < 4) {
            this.melodicDirection = 0;
            this.melodicActivity = 0;
            return;
        }

        // Calculate overall direction
        const recent = this.pitchHistory.slice(-4);
        const slope = (recent[3] - recent[0]) / 3;
        this.melodicDirection = Math.max(-1, Math.min(1, slope * 10));

        // Calculate activity (total variation)
        let totalVariation = 0;
        for (let i = 1; i < recent.length; i++) {
            totalVariation += Math.abs(recent[i] - recent[i - 1]);
        }
        this.melodicActivity = Math.min(1, totalVariation * 5);
    }

    /**
     * Analyze dynamic range and compression
     */
    analyzeDynamicRange() {
        // Peak detection
        let peak = 0;
        for (let i = 0; i < this.timeData.length; i++) {
            const abs = Math.abs((this.timeData[i] - 128) / 128);
            if (abs > peak) peak = abs;
        }

        // Peak to average ratio (crest factor)
        this.peakToAverage = this.rms > 0 ? peak / this.rms : 1;

        // Dynamic range estimate (0 = compressed, 1 = natural)
        // Heavily compressed audio has low crest factor (< 2)
        // Natural audio has higher crest factor (4-10)
        this.dynamicRange = Math.min(1, this.peakToAverage / 10);

        // Compression amount (inverse of dynamic range)
        this.compressionAmount = 1 - this.dynamicRange;
    }

    /**
     * Analyze transient vs sustained content
     */
    analyzeTransients() {
        // Transient = high flux, high frequency content
        // Sustained = low flux, harmonic content

        this.transientStrength = this.spectralFlux * (1 + this.spectralCentroid) / 2;
        this.sustainedStrength = this.harmonicContent * (1 - this.spectralFlux);
    }

    /**
     * Analyze frequency balance (bass/mid/high)
     */
    analyzeFrequencyBalance() {
        const bassEnergy = this.smoothedBands.subBass.value + this.smoothedBands.bass.value;
        const midEnergy = this.smoothedBands.lowMid.value + this.smoothedBands.mid.value + this.smoothedBands.highMid.value;
        const highEnergy = this.smoothedBands.high.value + this.smoothedBands.air.value;

        const total = bassEnergy + midEnergy + highEnergy;

        if (total > 0) {
            this.bassBalance = bassEnergy / total;
            this.midBalance = midEnergy / total;
            this.highBalance = highEnergy / total;
        } else {
            this.bassBalance = 0.33;
            this.midBalance = 0.33;
            this.highBalance = 0.33;
        }
    }

    /**
     * Analyze spectral shape characteristics
     */
    analyzeSpectralShape() {
        // Calculate moments of spectrum distribution
        let mean = this.spectralCentroid;
        let m2 = 0, m3 = 0, m4 = 0;
        let totalMag = 0;

        for (let i = 0; i < this.binCount; i++) {
            const freq = this.binToFreq(i);
            const mag = this.freqData[i];
            totalMag += mag;

            const diff = freq / 10000 - mean; // Normalize freq
            m2 += mag * diff * diff;
            m3 += mag * diff * diff * diff;
            m4 += mag * diff * diff * diff * diff;
        }

        if (totalMag > 0) {
            m2 /= totalMag;
            m3 /= totalMag;
            m4 /= totalMag;

            // Spread (standard deviation)
            this.spectralSpread = Math.sqrt(m2);

            // Skewness (asymmetry)
            this.spectralSkewness = m2 > 0 ? m3 / Math.pow(m2, 1.5) : 0;

            // Kurtosis (peakedness)
            this.spectralKurtosis = m2 > 0 ? m4 / (m2 * m2) : 0;
        }

        // Spectral flatness (Wiener entropy)
        let geometricMean = 1;
        let arithmeticMean = 0;
        let count = 0;

        for (let i = 0; i < this.binCount; i++) {
            if (this.freqData[i] > 0) {
                geometricMean *= Math.pow(this.freqData[i], 1 / this.binCount);
                arithmeticMean += this.freqData[i];
                count++;
            }
        }

        arithmeticMean /= count;
        this.spectralFlatness = arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
    }

    /**
     * Analyze envelope characteristics (attack/decay)
     */
    analyzeEnvelope() {
        // Detect attack time (onset to peak)
        // Detect decay time (peak to sustain)

        if (this.onsetHistory.length > 0) {
            const lastOnset = this.onsetHistory[this.onsetHistory.length - 1];
            const timeSinceOnset = Date.now() - lastOnset;

            // Simple envelope shape estimation
            if (timeSinceOnset < 50) {
                this.envelopeShape = 0; // Percussive (fast attack/decay)
                this.attackTime = timeSinceOnset;
            } else if (timeSinceOnset < 200) {
                this.envelopeShape = 0.5; // Medium
            } else {
                this.envelopeShape = 1; // Sustained (slow attack/decay)
                this.decayTime = timeSinceOnset;
            }
        }
    }

    /**
     * Detect amplitude and frequency modulation
     */
    analyzeModulation() {
        // Amplitude modulation (tremolo) - periodic RMS variation
        // Frequency modulation (vibrato) - periodic centroid variation

        // Simple detection: check for periodic oscillation in recent history
        const rmsVariation = this.loudnessHistory.reduce((sum, val, i, arr) => {
            if (i === 0) return 0;
            return sum + Math.abs(val - arr[i - 1]);
        }, 0) / this.loudnessHistory.length;

        this.amplitudeModulation = Math.min(1, rmsVariation * 10);

        // FM detection from pitch history variation
        if (this.pitchHistory.length > 4) {
            const pitchVariation = this.pitchHistory.reduce((sum, val, i, arr) => {
                if (i === 0) return 0;
                return sum + Math.abs(val - arr[i - 1]);
            }, 0) / this.pitchHistory.length;

            this.frequencyModulation = Math.min(1, pitchVariation * 10);
        }

        // Estimate modulation rate (Hz) - simplified
        if (this.amplitudeModulation > 0.3 || this.frequencyModulation > 0.3) {
            // Typical LFO rates: 1-20 Hz
            this.modulationRate = 5; // Placeholder - would need proper autocorrelation
        } else {
            this.modulationRate = 0;
        }
    }

    /**
     * Analyze stereo width (if stereo analyser provided)
     */
    analyzeStereoWidth() {
        if (!this.stereoAnalyser) return;

        const stereoData = new Uint8Array(this.binCount);
        this.stereoAnalyser.getByteFrequencyData(stereoData);

        // Calculate correlation between channels
        let correlation = 0;
        let leftPower = 0;
        let rightPower = 0;

        for (let i = 0; i < this.binCount; i++) {
            const left = this.freqData[i];
            const right = stereoData[i];

            correlation += left * right;
            leftPower += left * left;
            rightPower += right * right;
        }

        const denominator = Math.sqrt(leftPower * rightPower);
        const normalizedCorrelation = denominator > 0 ? correlation / denominator : 1;

        // Stereo width: 0 = mono (high correlation), 1 = wide (low correlation)
        this.stereoWidth = 1 - Math.abs(normalizedCorrelation);
    }

    /**
     * Get comprehensive debug info
     */
    getAdvancedDebugInfo() {
        return {
            ...super.getDebugInfo(),
            harmonic: {
                content: this.harmonicContent.toFixed(3),
                fundamental: this.fundamentalFreq.toFixed(1) + 'Hz',
                ratio: this.harmonicRatio.toFixed(3),
                flatness: this.spectralFlatness.toFixed(3)
            },
            rhythm: {
                beatPhase: this.beatPhase.toFixed(3),
                beatStrength: this.beatStrength.toFixed(3),
                swing: this.swing.toFixed(3),
                timeSignature: this.timeSignature
            },
            dynamics: {
                perceivedLoudness: this.perceivedLoudness.toFixed(3),
                dynamicRange: this.dynamicRange.toFixed(3),
                compression: this.compressionAmount.toFixed(3),
                peakToAvg: this.peakToAverage.toFixed(2)
            },
            melodic: {
                direction: this.melodicDirection > 0 ? 'up' : this.melodicDirection < 0 ? 'down' : 'static',
                activity: this.melodicActivity.toFixed(3)
            },
            texture: {
                transient: this.transientStrength.toFixed(3),
                sustained: this.sustainedStrength.toFixed(3),
                envelope: this.envelopeShape < 0.3 ? 'percussive' : this.envelopeShape > 0.7 ? 'sustained' : 'medium'
            },
            balance: {
                bass: this.bassBalance.toFixed(2),
                mid: this.midBalance.toFixed(2),
                high: this.highBalance.toFixed(2)
            },
            modulation: {
                AM: this.amplitudeModulation.toFixed(3),
                FM: this.frequencyModulation.toFixed(3),
                rate: this.modulationRate.toFixed(1) + 'Hz'
            },
            stereo: {
                width: this.stereoWidth.toFixed(3)
            }
        };
    }
}
