/**
 * Polychora System - 4D Polytope Mathematics
 * Extends BaseSystem with 4D polytopal visualization
 *
 * A Paul Phillips Manifestation
 * © 2025 Clear Seas Solutions LLC
 */

import { BaseSystem } from '../shared/BaseSystem.js';
import { ParameterManager } from '../../core/Parameters.js';

export class PolychoraSystem extends BaseSystem {
    constructor(config) {
        super({
            ...config,
            name: config.name || 'Polychora',
            type: 'polychora'
        });

        // 4D-specific state
        this.rotation4D = {
            xy: 0,
            xz: 0,
            xw: 0,
            yz: 0,
            yw: 0,
            zw: 0
        };
    }

    /**
     * Create visualizer for Polychora system
     */
    async createVisualizer() {
        console.log('🔮 Creating Polychora 4D visualizer...');

        // Initialize parameter manager with 4D parameters
        this.parameters = new ParameterManager();

        // For now, we'll import the full PolychoraSystem from original
        // In a complete implementation, we'd extract just the visualizer
        const { PolychoraSystem: OriginalPolychora } = await import('./PolychoraVisualizer.js');

        // Create instance (it's a combined system+visualizer in original)
        this.visualizer = new OriginalPolychora(this.canvas);

        console.log('✅ Polychora 4D visualizer created');
    }

    /**
     * Setup interactions specific to 4D rotation
     */
    async setupInteractions() {
        await super.setupInteractions();

        // 4D rotation with keyboard
        window.addEventListener('keydown', (e) => {
            const rotSpeed = 0.05;

            switch(e.key.toLowerCase()) {
                // XW plane rotation
                case 'q':
                    this.rotation4D.xw += rotSpeed;
                    break;
                case 'w':
                    this.rotation4D.xw -= rotSpeed;
                    break;

                // YW plane rotation
                case 'a':
                    this.rotation4D.yw += rotSpeed;
                    break;
                case 's':
                    this.rotation4D.yw -= rotSpeed;
                    break;

                // ZW plane rotation
                case 'z':
                    this.rotation4D.zw += rotSpeed;
                    break;
                case 'x':
                    this.rotation4D.zw -= rotSpeed;
                    break;
            }

            // Update visualizer
            if (this.visualizer && this.visualizer.set4DRotation) {
                this.visualizer.set4DRotation(this.rotation4D);
            }
        });

        // Mouse drag for 4D rotation
        let isDragging = false;
        let lastX = 0;
        let lastY = 0;

        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - lastX;
            const deltaY = e.clientY - lastY;

            // Mouse X controls XW rotation
            this.rotation4D.xw += deltaX * 0.01;

            // Mouse Y controls YW rotation
            this.rotation4D.yw += deltaY * 0.01;

            lastX = e.clientX;
            lastY = e.clientY;

            if (this.visualizer && this.visualizer.set4DRotation) {
                this.visualizer.set4DRotation(this.rotation4D);
            }
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
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

        // Get color from color system
        const time = this.visualizer.getTime ? this.visualizer.getTime() : Date.now() * 0.001;
        const color = this.colorSystem.getColor(
            this.visualizer.mouseX || 0.5,
            this.visualizer.mouseY || 0.5,
            time,
            parameters.hue || 200,
            audioData
        );

        // 4D rotation from audio
        if (audioData && this.audioEnabled) {
            // Each frequency band controls a different rotation plane
            const subBass = audioData.bands.subBass?.value || 0;
            const bass = audioData.bands.bass?.value || 0;
            const mid = audioData.bands.mid?.value || 0;
            const high = audioData.bands.high?.value || 0;

            // Audio-driven 4D rotations
            this.rotation4D.xw += bass * this.audioReactivity * 0.05;
            this.rotation4D.yw += mid * this.audioReactivity * 0.05;
            this.rotation4D.zw += high * this.audioReactivity * 0.05;

            // Onsets cause 4D "punches"
            if (audioData.onset.detected) {
                const strength = audioData.onset.strength;
                this.rotation4D.xy += strength * this.audioReactivity * 0.2;
                this.rotation4D.yz += strength * this.audioReactivity * 0.15;
            }

            if (this.visualizer && this.visualizer.set4DRotation) {
                this.visualizer.set4DRotation(this.rotation4D);
            }
        }

        // Apply parameters with 4D enhancements
        const enhanced4DParams = {
            ...parameters,
            rot4dXW: (parameters.rot4dXW || 0) + this.rotation4D.xw,
            rot4dYW: (parameters.rot4dYW || 0) + this.rotation4D.yw,
            rot4dZW: (parameters.rot4dZW || 0) + this.rotation4D.zw,
            dimension: parameters.dimension || 4.0
        };

        // Update visualizer
        if (this.visualizer.setParameters) {
            this.visualizer.setParameters(enhanced4DParams);
        }

        if (this.visualizer.setColor) {
            this.visualizer.setColor(color);
        }

        // Render frame
        if (this.visualizer.render) {
            this.visualizer.render(enhanced4DParams);
        } else if (this.visualizer.update) {
            this.visualizer.update(deltaTime);
        }
    }

    /**
     * Get 4D rotation state for debugging
     */
    get4DRotation() {
        return { ...this.rotation4D };
    }

    /**
     * Reset 4D rotation
     */
    reset4DRotation() {
        this.rotation4D = {
            xy: 0,
            xz: 0,
            xw: 0,
            yz: 0,
            yw: 0,
            zw: 0
        };
    }

    /**
     * Override destroy to clean up 4D-specific listeners
     */
    destroy() {
        // Remove keyboard listener for 4D rotation
        // (Would need to store the bound function to remove properly)

        super.destroy();
    }
}
