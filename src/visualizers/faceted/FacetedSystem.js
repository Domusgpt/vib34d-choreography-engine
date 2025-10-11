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
        this.parameters = new ParameterManager();

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

        // Get color from color system
        const time = this.visualizer.getTime();
        const color = this.colorSystem.getColor(
            this.visualizer.mouseX,
            this.visualizer.mouseY,
            time,
            parameters.hue || 200,
            audioData
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
