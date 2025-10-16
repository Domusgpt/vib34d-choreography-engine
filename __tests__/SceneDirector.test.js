import { jest } from '@jest/globals';
import { SceneDirector } from '../src/choreographers/SceneDirector.js';

describe('SceneDirector', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const baseScenes = [
        { id: 'calm', name: 'Calm Current' },
        { id: 'neon', name: 'Neon Surge' },
        { id: 'pulse', name: 'Pulse Drift' }
    ];

    it('uses weighted shuffle selection when computing next scene', () => {
        const director = new SceneDirector({
            scenes: baseScenes,
            ordering: 'shuffle'
        });

        director.setSceneWeights({
            calm: 1,
            neon: 4,
            pulse: 1
        });

        const randomSpy = jest.spyOn(global.Math, 'random');
        randomSpy.mockReturnValue(0.7); // 0.7 * totalWeight(5) = 3.5 -> selects neon
        expect(director.computeNextSceneId('calm')).toBe('neon');

        randomSpy.mockReturnValue(0.98); // 0.98 * 5 = 4.9 -> selects pulse
        expect(director.computeNextSceneId('calm')).toBe('pulse');
    });

    it('honours queued scenes before automation and records history', () => {
        const director = new SceneDirector({
            scenes: baseScenes,
            mode: 'off'
        });

        director.queueScene('pulse', { immediate: true });
        const nextScene = director.update({}, 0, 'calm');
        expect(nextScene?.id).toBe('pulse');

        expect(director.getQueue()).toHaveLength(1); // still pending until acknowledged
        director.noteSceneChange('pulse', { elapsedSeconds: 12 });
        expect(director.getQueue()).toHaveLength(0);
        const history = director.getHistory();
        expect(history[0].id).toBe('pulse');
        expect(history[0].manual).toBe(false);
    });

    it('tracks manual acknowledgements and tempo state updates', () => {
        const director = new SceneDirector({ scenes: baseScenes, tempoDivision: 16 });

        director.acknowledgeManualSelection(32, 48, 'neon');
        expect(director.lastElapsedBeats).toBe(48);
        expect(director.nextTempoBeat).toBe(Math.floor(48) + 16);
        const history = director.getHistory();
        expect(history[0].id).toBe('neon');
        expect(history[0].manual).toBe(true);
    });

    it('reports countdown for queued scenes respecting minimum duration', () => {
        const director = new SceneDirector({ scenes: baseScenes, minDurationSeconds: 10 });

        director.queueScene('neon', { minDuration: 12 });
        const countdown = director.calculateCountdown({}, 5);
        expect(countdown).toBeCloseTo(7);

        const status = director.getStatus({}, 3, 'calm');
        expect(status.queue[0].id).toBe('neon');
        expect(status.countdownSeconds).toBeCloseTo(9); // 12 - (sinceLastChange=3)
    });
});
