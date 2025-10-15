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
            rot4dZW: 0.0
        });

        this.controlBus.attachParameterManager(this.parameters);
        this.controlBus.defineChannels({
            gridDensity: {
                value: 15,
                range: [6, 42],
                smoothing: 0.86,
                audioMap: [
                    { path: 'bands.mid', scale: 6.0 },
                    { path: 'extremeDynamics.motionVelocity', scale: 5.0, clamp: [-2.5, 6] }
                ],
                tags: ['geometry']
            },
            morphFactor: {
                value: 1.0,
                range: [0, 1.8],
                smoothing: 0.82,
                audioMap: [
                    { path: 'extremeDynamics.dimensionLift', scale: 1.1 },
                    { path: 'bands.mid', scale: 0.4 }
                ],
                tags: ['geometry']
            },
            chaos: {
                value: 0.2,
                range: [0, 1.6],
                smoothing: 0.8,
                audioMap: [
                    { path: 'extremeDynamics.chaosSurge', scale: 0.9 },
                    { path: 'spectralFlux', scale: 0.6 }
                ],
                tags: ['geometry']
            },
            speed: {
                value: 1.0,
                range: [0.3, 2.5],
                smoothing: 0.8,
                audioMap: [
                    { path: 'extremeDynamics.motionVelocity', scale: 1.2 },
                    { path: 'rhythmPhases.accentPulse', scale: 0.4 }
                ],
                tags: ['motion']
            },
            hue: {
                value: 200,
                range: [0, 360],
                smoothing: 0.92,
                audioMap: [
                    { path: 'colorChoreography.orbit', scale: 80 },
                    { path: 'colorChoreography.accentLuma', scale: 55 }
                ],
                tags: ['color']
            },
            intensity: {
                value: 0.5,
                range: [0, 1.6],
                smoothing: 0.78,
                audioMap: [
                    { path: 'rms', scale: 0.9 }
                ],
                tags: ['lighting']
            },
            saturation: {
                value: 0.8,
                range: [0.25, 1],
                smoothing: 0.84,
                audioMap: [
                    { path: 'colorChoreography.saturationPulse', scale: 0.28 }
                ],
                tags: ['color']
            },
            dimension: {
                value: 3.5,
                range: [2.4, 5.2],
                smoothing: 0.88,
                audioMap: [
                    { path: 'extremeDynamics.dimensionLift', scale: 1.1 }
                ],
                tags: ['geometry']
            },
            rot4dXW: {
                value: 0,
                range: [-6.28318, 6.28318],
                smoothing: 0.94,
                audioMap: [
                    { path: 'bands.bass', scale: 0.6 },
                    { path: 'extremeDynamics.motionVelocity', scale: 0.45 }
                ]
            },
            rot4dYW: {
                value: 0,
                range: [-6.28318, 6.28318],
                smoothing: 0.93,
                audioMap: [
                    { path: 'bands.mid', scale: 0.5 },
                    { path: 'extremeDynamics.swingEnergy', scale: 0.4 }
                ]
            },
            rot4dZW: {
                value: 0,
                range: [-6.28318, 6.28318],
                smoothing: 0.93,
                audioMap: [
                    { path: 'bands.high', scale: 0.55 },
                    { path: 'extremeDynamics.chaosSurge', scale: 0.35 }
                ]
            }
        });

        // Create visualizer
        this.visualizer = new QuantumHolographicVisualizer(
            this.canvasId,
            this.role,
            this.reactivity,
            this.variant
        );

        const initialParams = this.controlBus.getSnapshot(this.parameters.getAllParameters());
        if (this.visualizer.updateParameters) {
            this.visualizer.updateParameters(initialParams);
        } else if (this.visualizer.setParameters) {
            this.visualizer.setParameters(initialParams);
        }

        console.log('✅ Quantum visualizer created');
    }

    /**
     * Setup interactions specific to Quantum
     */
    async setupInteractions() {
        await super.setupInteractions();

        const modulatePointer = (x, y) => {
            if (!this.controlBus) {
                return;
            }

            const centeredX = (x - 0.5) * 2;
            const centeredY = (y - 0.5) * 2;
            const pointerRadius = Math.min(1, Math.sqrt(centeredX ** 2 + centeredY ** 2));

            this.controlBus.modulateChannel('hue', centeredX * 60, { decay: 2.8 });
            this.controlBus.modulateChannel('saturation', pointerRadius * 0.25, {
                decay: 3.2,
                polarity: 'positive'
            });
            this.controlBus.modulateChannel('chaos', centeredY * 0.35, { decay: 2.6 });
        };

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            modulatePointer(x, y);
        });

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

            modulatePointer(x, y);
        });
    }

    /**
     * Update method called every frame
     */
    update(deltaTime, parameters = {}, audioData) {
        // Update click intensity decay
        if (this.visualizer.updateClickIntensity) {
            this.visualizer.updateClickIntensity(deltaTime);
        }

        const controlParams = this.prepareControlParameters(
            deltaTime,
            parameters,
            this.audioEnabled ? audioData : null
        );

        if (this.visualizer.updateParameters) {
            this.visualizer.updateParameters(controlParams);
        } else if (this.visualizer.setParameters) {
            this.visualizer.setParameters(controlParams);
        }

        // Get color from color system
        const time = this.visualizer.getTime();
        const color = this.colorSystem.getColor(
            this.visualizer.mouseX,
            this.visualizer.mouseY,
            time,
            controlParams.hue || 200,
            audioData
        );

        // Update color in visualizer
        if (this.visualizer.setColor) {
            this.visualizer.setColor(color);
        }

        // Share expanded audio choreography data with the visualizer
        if (audioData && this.visualizer && this.visualizer.setAudioChoreography) {
            this.visualizer.setAudioChoreography(audioData);
        }

        // Apply audio reactivity to specific Quantum parameters
        if (audioData && this.audioEnabled) {
            // Enhance volumetric effects with audio
            const volumetricBoost = audioData.rms * this.audioReactivity;

            // Add particle intensity from high frequencies
            const bands = audioData.bands || {};
            const bandDetails = audioData.bandDetails || {};
            const particleIntensity = typeof bands.high === 'number'
                ? bands.high
                : (bandDetails.high?.value || (bands.high?.value || 0));

            if (this.visualizer.setVolumetricIntensity) {
                this.visualizer.setVolumetricIntensity(volumetricBoost);
            }

            if (this.visualizer.setParticleIntensity) {
                this.visualizer.setParticleIntensity(particleIntensity * this.audioReactivity);
            }

            if (this.controlBus) {
                this.controlBus.modulateChannel('intensity', volumetricBoost * 0.6, {
                    decay: 3.4,
                    polarity: 'positive'
                });
                this.controlBus.modulateChannel('gridDensity', particleIntensity * -2.2, { decay: 2.8 });
                this.controlBus.modulateChannel('rot4dZW', particleIntensity * 0.9, { decay: 2.6 });
            }
        }

        // Render frame
        this.visualizer.render(controlParams);
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
