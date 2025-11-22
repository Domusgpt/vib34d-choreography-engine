/**
 * Faceted System - Simple 2D Patterns
 * Extends BaseSystem with Faceted-specific implementation
 *
 * A Paul Phillips Manifestation
 * © 2025 Clear Seas Solutions LLC
 */

import { BaseSystem } from '../shared/BaseSystem.js';
import { IntegratedHolographicVisualizer } from './FacetedVisualizer.js';
import { ParameterManager } from '../../core/Parameters.js';

export class FacetedSystem extends BaseSystem {
    constructor(config) {
        super({
            ...config,
            name: config.name || 'Faceted',
            type: 'faceted'
        });

        this.role = config.role || 'content';
        this.reactivity = config.reactivity || 1.0;
        this.variant = config.variant || 0;
    }

    /**
     * Create visualizer for Faceted system
     */
    async createVisualizer() {
        console.log('🎨 Creating Faceted visualizer...');

        // Initialize parameter manager
        this.parameters = new ParameterManager({
            geometry: 0,
            gridDensity: 15,
            morphFactor: 1.0,
            chaos: 0.2,
            speed: 1.0,
            hue: 200,
            intensity: 0.5,
            saturation: 0.8,
            dimension: 3.5,
            rot4dXW: 0.0,
            rot4dYW: 0.0,
            rot4dZW: 0.0,
            colorStyle: 0,
            colorProfile: 0,
            colorVibrance: 1.0
        });

        this.controlBus.attachParameterManager(this.parameters);
        this.controlBus.defineChannels({
            colorVibrance: {
                value: 1.0,
                range: [0.3, 2.5],
                smoothing: 0.82,
                audioMap: [
                    { path: 'colorChoreography.saturationPulse', scale: 0.4 },
                    { path: 'extremeDynamics.dimensionLift', scale: 0.25 }
                ],
                tags: ['color']
            },
            colorStyle: {
                value: 0,
                range: [0, 1],
                smoothing: 0.95,
                tags: ['color']
            },
            colorProfile: {
                value: 0,
                range: [0, 9],
                smoothing: 0.95,
                tags: ['color']
            }
        });

        // Create visualizer
        this.visualizer = new IntegratedHolographicVisualizer(
            this.canvasId,
            this.role,
            this.reactivity,
            this.variant
        );

        console.log('✅ Faceted visualizer created');
    }

    /**
     * Setup interactions specific to Faceted
     */
    async setupInteractions() {
        await super.setupInteractions();

        // Add Faceted-specific interactions here if needed
        // For now, using base mouse/click handling
    }

    /**
     * Update method called every frame
     */
    update(deltaTime, parameters, audioData) {
        // Update click intensity decay
        if (this.visualizer.updateClickIntensity) {
            this.visualizer.updateClickIntensity(deltaTime);
        }

        // Update visualizer with parameters
        if (this.visualizer.setParameters) {
            this.visualizer.setParameters(parameters);
        }

        const activeAudio = this.audioEnabled ? audioData : null;
        if (this.visualizer.setAudioData) {
            this.visualizer.setAudioData(activeAudio);
        }

        // Get color from color system
        const time = this.visualizer.getTime();
        const color = this.colorSystem.getColor(
            this.visualizer.mouseX,
            this.visualizer.mouseY,
            time,
            parameters.hue || 200,
            activeAudio
        );

        // Update color in visualizer
        if (this.visualizer.setColor) {
            this.visualizer.setColor(color);
        }

        // Render frame
        this.visualizer.render(parameters);
    }

    /**
     * Override parameter update to pass to visualizer
     */
    updateParameter(name, value) {
        super.updateParameter(name, value);

        // Faceted visualizer expects specific parameter format
        if (this.visualizer && this.visualizer.updateParameter) {
            this.visualizer.updateParameter(name, value);
        }
    }
}
