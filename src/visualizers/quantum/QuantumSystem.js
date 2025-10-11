/**
 * Quantum System - Complex 3D Lattice with Volumetric Lighting
 * Extends BaseSystem with Quantum-specific implementation
 *
 * A Paul Phillips Manifestation
 * © 2025 Clear Seas Solutions LLC
 */

import { BaseSystem } from '../shared/BaseSystem.js';
import { QuantumHolographicVisualizer } from './QuantumVisualizer.js';
import { ParameterManager } from '../../core/Parameters.js';

export class QuantumSystem extends BaseSystem {
    constructor(config) {
        super({
            ...config,
            name: config.name || 'Quantum',
            type: 'quantum'
        });

        this.role = config.role || 'content';
        this.reactivity = config.reactivity || 1.0;
        this.variant = config.variant || 0;
    }

    /**
     * Create visualizer for Quantum system
     */
    async createVisualizer() {
        console.log('🌌 Creating Quantum visualizer...');

        // Initialize parameter manager
        this.parameters = new ParameterManager();

        // Create visualizer
        this.visualizer = new QuantumHolographicVisualizer(
            this.canvasId,
            this.role,
            this.reactivity,
            this.variant
        );

        console.log('✅ Quantum visualizer created');
    }

    /**
     * Setup interactions specific to Quantum
     */
    async setupInteractions() {
        await super.setupInteractions();

        // Quantum has enhanced touch interactions
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) / rect.width;
            const y = (touch.clientY - rect.top) / rect.height;

            if (this.visualizer && this.visualizer.setMousePosition) {
                this.visualizer.setMousePosition(x, y);
            }
        });
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

        // Apply audio reactivity to specific Quantum parameters
        if (audioData && this.audioEnabled) {
            // Enhance volumetric effects with audio
            const volumetricBoost = audioData.rms * this.audioReactivity;

            // Add particle intensity from high frequencies
            const particleIntensity = audioData.bands.high?.value || 0;

            if (this.visualizer.setVolumetricIntensity) {
                this.visualizer.setVolumetricIntensity(volumetricBoost);
            }

            if (this.visualizer.setParticleIntensity) {
                this.visualizer.setParticleIntensity(particleIntensity * this.audioReactivity);
            }
        }

        // Render frame
        this.visualizer.render(parameters);
    }

    /**
     * Override parameter update for Quantum-specific behavior
     */
    updateParameter(name, value) {
        super.updateParameter(name, value);

        // Quantum visualizer has special parameter handling
        if (this.visualizer && this.visualizer.updateParameter) {
            this.visualizer.updateParameter(name, value);
        }
    }
}
