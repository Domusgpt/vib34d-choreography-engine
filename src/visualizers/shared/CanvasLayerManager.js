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

export class CanvasLayerManager {
    constructor(containerId = 'canvas-stack') {
        this.container = document.getElementById(containerId) || this.createContainer(containerId);
        this.layers = LAYERS.map(layer => ({ ...layer }));
        this.visualizers = [];
        this.activeSystem = null;

        this.ensureCanvases();
        this.resize = this.resize.bind(this);
        window.addEventListener('resize', this.resize);
        this.resize();
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
            layer.canvas = canvas;
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

    setSystem(type, variant = 0) {
        this.destroyVisualizers();
        this.ensureCanvases();
        this.activeSystem = type;

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
                    return viz && viz.gl ? viz : null;
                } catch (err) {
                    console.warn(`Failed to create ${type} layer ${layer.role}:`, err);
                    return null;
                }
            })
            .filter(Boolean);
    }

    getCtor(type) {
        switch (type) {
            case 'quantum':
                return QuantumHolographicVisualizer;
            case 'faceted':
                return IntegratedHolographicVisualizer;
            case 'holographic':
                return HolographicVisualizer;
            default:
                return null;
        }
    }

    updateParameter(name, value) {
        this.visualizers.forEach(viz => viz?.updateParameter?.(name, value));
    }

    updateParameters(params) {
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

    destroyVisualizers() {
        this.visualizers.forEach(viz => viz?.destroy?.());
        this.visualizers = [];
    }

    destroy() {
        this.destroyVisualizers();
        window.removeEventListener('resize', this.resize);
    }
}
