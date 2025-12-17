import { QuantumHolographicVisualizer } from '../quantum/QuantumVisualizer.js';
import { IntegratedHolographicVisualizer } from '../faceted/FacetedVisualizer.js';
import { HolographicVisualizer } from '../holographic/HolographicVisualizer.js';

const LAYERS = [
    { id: 'canvas-bg', role: 'background', zIndex: 1, reactivity: 0.45 },
    { id: 'canvas-shadow', role: 'shadow', zIndex: 2, reactivity: 0.7 },
    { id: 'canvas', role: 'content', zIndex: 3, reactivity: 1.0 },
    { id: 'canvas-highlight', role: 'highlight', zIndex: 4, reactivity: 1.25 },
    { id: 'canvas-accent', role: 'accent', zIndex: 5, reactivity: 1.5 }
];

const FALLBACK_LAYERS = [
    { id: 'canvas', role: 'content', zIndex: 3, reactivity: 1.0 }
];

export class CanvasLayerManager {
    constructor(containerId = 'canvas-stack', options = {}) {
        const { visualizerFactory, layerTemplate } = options;
        this.container = document.getElementById(containerId) || this.createContainer(containerId);
        this.visualizerFactory =
            visualizerFactory ||
            {
                quantum: QuantumHolographicVisualizer,
                faceted: IntegratedHolographicVisualizer,
                holographic: HolographicVisualizer,
            };
        this.layerTemplate = layerTemplate || 'full';
        this.layers = this.getActiveLayerTemplate().map(layer => ({ ...layer }));
        this.fallbackAttempts = 0;
        this.visualizers = [];
        this.activeSystem = null;
        this.activeVariant = 0;
        this.state = { layers: [] };
        this.parameterCache = {};
        this.rebuilds = 0;
        this.lastReadyAt = null;
        this.rebuildTimeout = null;
        this.stateChangeCallback = null;

        this.handleContextLost = this.handleContextLost.bind(this);
        this.handleContextRestored = this.handleContextRestored.bind(this);

        this.pruneDetachedLayers();
        this.ensureCanvases();
        this.resize = this.resize.bind(this);
        window.addEventListener('resize', this.resize);
        this.resize();
    }

    getActiveLayerTemplate() {
        return this.layerTemplate === 'fallback' ? FALLBACK_LAYERS : LAYERS;
    }

    createContainer(id) {
        const container = document.createElement('div');
        container.id = id;
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100vw';
        container.style.height = '100vh';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);
        return container;
    }

    pruneDetachedLayers() {
        const validIds = new Set(this.getActiveLayerTemplate().map(layer => layer.id));
        document.querySelectorAll('.viz-layer').forEach(canvas => {
            const belongsToStack = canvas.parentElement === this.container;
            if (!belongsToStack || !validIds.has(canvas.id)) {
                canvas.remove();
            }
        });
    }

    ensureCanvases() {
        this.layers.forEach((layer, index) => {
            let canvas = document.getElementById(layer.id);
            if (!canvas) {
                canvas = document.createElement('canvas');
                canvas.id = layer.id;
                canvas.className = 'viz-layer';
                canvas.style.zIndex = String(layer.zIndex || index + 1);
                this.container.appendChild(canvas);
            }

            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.pointerEvents = 'none';
            canvas.style.mixBlendMode = 'screen';

            canvas.removeEventListener('webglcontextlost', this.handleContextLost);
            canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
            canvas.addEventListener('webglcontextlost', this.handleContextLost, false);
            canvas.addEventListener('webglcontextrestored', this.handleContextRestored, false);

            layer.canvas = canvas;
            layer.ready = false;
        });
    }

    resize() {
        const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const width = window.innerWidth * devicePixelRatio;
        const height = window.innerHeight * devicePixelRatio;

        this.layers.forEach(layer => {
            if (!layer.canvas) return;
            layer.canvas.width = width;
            layer.canvas.height = height;

            if (layer.canvas.style) {
                layer.canvas.style.width = '100vw';
                layer.canvas.style.height = '100vh';
            }

            this.visualizers.forEach(viz => {
                if (viz.canvas === layer.canvas && viz.handleResize) {
                    viz.handleResize(width, height);
                }
            });
        });
    }

    resetCanvases() {
        this.layers.forEach(layer => {
            if (!layer.canvas) return;

            try {
                const existingContext = layer.canvas.getContext('webgl2') || layer.canvas.getContext('webgl');
                const lose = existingContext?.getExtension('WEBGL_lose_context');
                lose?.loseContext();
            } catch (err) {
                console.warn('Failed to reset WebGL context', err);
            }

            layer.canvas.width = 0;
            layer.canvas.height = 0;
        });
    }

    setSystem(type, variant = 0) {
        if (this.activeSystem) {
            this.rebuilds += 1;
        }

        this.destroyVisualizers();
        this.resetCanvases();

        this.layers = this.getActiveLayerTemplate().map(layer => ({ ...layer }));

        this.pruneDetachedLayers();
        this.ensureCanvases();
        this.resize();
        this.activeSystem = type;
        this.activeVariant = variant;
        this.state = { layers: [], system: type };

        const VisualizerCtor = this.getCtor(type);
        if (!VisualizerCtor) {
            console.warn(`Unknown visualizer type: ${type}`);
            return;
        }

        this.visualizers = this.layers
            .map(layer => {
                try {
                    const viz = new VisualizerCtor(
                        layer.id,
                        layer.role,
                        layer.reactivity,
                        variant
                    );

                    layer.ready = Boolean(viz && viz.gl);
                    layer.activeSystem = type;

                    if (!layer.ready) {
                        return null;
                    }

                    return viz;
                } catch (err) {
                    console.warn(`Failed to create ${type} layer ${layer.role}:`, err);
                    layer.ready = false;
                    return null;
                }
            })
            .filter(Boolean);

        if (Object.keys(this.parameterCache).length > 0) {
            this.updateParameters(this.parameterCache);
        }

        if (this.visualizers.length === 0 || this.layers.every(layer => !layer.ready)) {
            this.handleEmptyStack();
        } else if (this.layers.every(layer => layer.ready)) {
            this.lastReadyAt = Date.now();
            this.fallbackAttempts = 0;
        }

        this.refreshState();
    }

    handleEmptyStack() {
        if (this.layerTemplate === 'fallback') {
            console.warn('CanvasLayerManager fallback failed to create any visualizers');
            return;
        }

        if (this.fallbackAttempts >= 2) {
            console.warn('CanvasLayerManager: max fallback attempts reached');
            return;
        }

        this.fallbackAttempts += 1;
        this.layerTemplate = 'fallback';
        this.setSystem(this.activeSystem, this.activeVariant);
    }

    getCtor(type) {
        return this.visualizerFactory?.[type] || null;
    }

    updateParameter(name, value) {
        this.parameterCache[name] = value;
        this.visualizers.forEach(viz => viz?.updateParameter?.(name, value));
    }

    updateParameters(params) {
        Object.assign(this.parameterCache, params);
        this.visualizers.forEach(viz => {
            if (viz?.updateParameters) {
                viz.updateParameters(params);
            } else if (viz?.setParameters) {
                viz.setParameters(params);
            } else {
                Object.entries(params).forEach(([key, val]) => viz?.updateParameter?.(key, val));
            }
        });
    }

    render() {
        this.visualizers.forEach(viz => viz?.render?.());
    }

    forceRebuild() {
        if (!this.activeSystem) return;
        this.layerTemplate = 'full';
        this.fallbackAttempts = 0;
        this.setSystem(this.activeSystem, this.activeVariant);
    }

    seedParameters(params = {}) {
        this.parameterCache = { ...params, ...this.parameterCache };
        if (Object.keys(params).length) {
            this.updateParameters(params);
        }
    }

    destroyVisualizers() {
        this.visualizers.forEach(viz => viz?.destroy?.());
        this.visualizers = [];
    }

    handleContextLost(event) {
        event?.preventDefault?.();
        const canvasId = event?.target?.id;
        const layer = this.layers.find(l => l.id === canvasId);
        if (layer) {
            layer.ready = false;
        }

        this.refreshState();

        if (!this.rebuildTimeout) {
            this.rebuildTimeout = setTimeout(() => {
                this.rebuildTimeout = null;
                if (this.activeSystem) {
                    this.setSystem(this.activeSystem, this.activeVariant);
                }
            }, 30);
        }
    }

    handleContextRestored() {
        this.refreshState();
        if (Object.keys(this.parameterCache).length) {
            this.updateParameters(this.parameterCache);
        }
    }

    onStateChange(callback) {
        this.stateChangeCallback = callback;
    }

    emitState() {
        if (typeof this.stateChangeCallback === 'function') {
            this.stateChangeCallback(this.getState());
        }
    }

    refreshState() {
        this.state.layers = this.layers.map(layer => ({
            id: layer.id,
            role: layer.role,
            ready: layer.ready,
            system: layer.activeSystem,
            zIndex: layer.zIndex,
        }));
        this.emitState();
    }

    destroy() {
        this.destroyVisualizers();
        window.removeEventListener('resize', this.resize);
        this.layers.forEach(layer => {
            if (!layer.canvas) return;
            layer.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
            layer.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
        });
    }

    getState() {
        return {
            system: this.activeSystem,
            layers: this.state.layers,
            total: this.layers.length,
            ready: this.state.layers?.filter(layer => layer.ready).length || 0,
            rebuilds: this.rebuilds,
            cacheSize: Object.keys(this.parameterCache).length,
            lastReadyAt: this.lastReadyAt,
            layerTemplate: this.layerTemplate,
            fallbackAttempts: this.fallbackAttempts,
        };
    }
}
