/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { CanvasLayerManager } from '../src/visualizers/shared/CanvasLayerManager.js';

class StubVisualizer {
    constructor(id) {
        this.canvas = document.getElementById(id);
        this.gl = {};
        this.params = {};
    }

    updateParameter(name, value) {
        this.params[name] = value;
    }

    updateParameters(map) {
        Object.assign(this.params, map);
    }

    render() {
        this.rendered = true;
    }

    destroy() {
        this.destroyed = true;
    }
}

class FailingVisualizer {
    constructor(id) {
        this.canvas = document.getElementById(id);
        this.gl = null;
    }
}

describe('CanvasLayerManager', () => {
    let warnSpy;

    beforeEach(() => {
        document.body.innerHTML = '<div id="canvas-stack"></div>';
        HTMLCanvasElement.prototype.getContext = function getContext() {
            return {
                getExtension: () => ({ loseContext: () => {} }),
            };
        };
        warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        warnSpy?.mockRestore();
    });

    test('creates visualizers for all layers and propagates parameters', () => {
        const manager = new CanvasLayerManager('canvas-stack', {
            visualizerFactory: { quantum: StubVisualizer },
        });

        manager.setSystem('quantum');
        const state = manager.getState();

        expect(state.total).toBe(5);
        expect(state.ready).toBe(5);
        expect(manager.visualizers).toHaveLength(5);

        manager.updateParameters({ density: 0.42, glow: 0.8 });
        manager.visualizers.forEach(viz => {
            expect(viz.params.density).toBe(0.42);
            expect(viz.params.glow).toBe(0.8);
        });
    });

    test('falls back to single-layer template when WebGL contexts fail', () => {
        const manager = new CanvasLayerManager('canvas-stack', {
            visualizerFactory: { quantum: FailingVisualizer },
        });

        manager.setSystem('quantum');
        const state = manager.getState();

        expect(state.layerTemplate).toBe('fallback');
        expect(state.total).toBe(1);
        expect(state.ready).toBe(0);
        expect(state.fallbackAttempts).toBeGreaterThanOrEqual(1);
    });
});
