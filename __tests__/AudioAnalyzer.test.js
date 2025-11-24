import { AudioAnalyzer } from '../src/audio/AudioAnalyzer.js';

class FakeAnalyserNode {
    constructor({ sampleRate = 4000 } = {}) {
        this.context = { sampleRate };
        this._fftSize = 32;
        this.frequencyBinCount = this._fftSize / 2;
        this.minDecibels = -100;
        this.maxDecibels = 0;
        this.smoothingTimeConstant = 0;
        this._freqFrame = new Uint8Array(this.frequencyBinCount);
        this._timeFrame = new Uint8Array(this.frequencyBinCount);
    }

    set fftSize(value) {
        this._fftSize = value;
        this.frequencyBinCount = value / 2;
        this._freqFrame = new Uint8Array(this.frequencyBinCount);
        this._timeFrame = new Uint8Array(this.frequencyBinCount);
    }

    get fftSize() {
        return this._fftSize;
    }

    loadFrame({ freq = [], time = [] }) {
        this._freqFrame = Uint8Array.from(freq);
        this._timeFrame = Uint8Array.from(time.length ? time : new Array(this.frequencyBinCount).fill(128));
    }

    getByteFrequencyData(array) {
        array.set(this._freqFrame);
    }

    getByteTimeDomainData(array) {
        array.set(this._timeFrame);
    }
}

describe('AudioAnalyzer', () => {
    it('analyzes bands, spectral metrics, and rms from analyser frames', () => {
        const analyserNode = new FakeAnalyserNode();
        const analyzer = new AudioAnalyzer(analyserNode, {
            fftSize: 32,
            bandSmoothing: 0,
            onsetThreshold: 0.5,
            timeProvider: () => 0
        });

        analyserNode.loadFrame({
            freq: [
                200, 180, 50, 0, // sub bass + bass energy
                10, 10, 10, 10,
                30, 30, 30, 30,
                60, 80, 90, 100
            ],
            time: new Array(16).fill(128)
        });

        const frame = analyzer.analyze();

        expect(frame.bands.subBass).toBeGreaterThan(0.5);
        expect(frame.bands.bass).toBeGreaterThan(frame.bands.mid);
        expect(frame.rms).toBe(0);
        expect(frame.spectralCentroid).toBeGreaterThan(0);
        expect(frame.spectralRolloff).toBeGreaterThan(0);
        expect(frame.onsetEvent.detected).toBe(false);
    });

    it('detects onset events when spectral flux increases significantly', () => {
        let currentTime = 0;
        const analyserNode = new FakeAnalyserNode();
        const analyzer = new AudioAnalyzer(analyserNode, {
            fftSize: 32,
            bandSmoothing: 0,
            onsetThreshold: 0.05,
            timeProvider: () => currentTime
        });

        analyserNode.loadFrame({
            freq: new Array(16).fill(20),
            time: new Array(16).fill(128)
        });
        analyzer.analyze();

        currentTime = 200;
        analyserNode.loadFrame({
            freq: new Array(16).fill(20).map((value, index) => value + (index % 2 === 0 ? 120 : 0)),
            time: new Array(16).fill(180)
        });

        const frame = analyzer.analyze();

        expect(frame.onsetEvent.detected).toBe(true);
        expect(frame.onsetEvent.strength).toBeGreaterThan(0.05);
        expect(frame.spectralFlux).toBe(frame.onsetEvent.strength);
        expect(analyzer.onsetHistory.length).toBe(1);
        expect(analyzer.estimatedBPM).toBeGreaterThanOrEqual(60);
    });
});
