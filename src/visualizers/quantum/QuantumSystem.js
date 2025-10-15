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

const clamp = (value, min, max) => {
    const numeric = typeof value === 'number' && Number.isFinite(value) ? value : min;
    return Math.min(Math.max(numeric, min), max);
};

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
        this._cameraPresetCooldownMs = 0;
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

        this.controlBus.defineChannels({
            cameraOrbit: {
                value: 0,
                range: [-Math.PI, Math.PI],
                smoothing: 0.95,
                tags: ['camera']
            },
            cameraElevation: {
                value: 0,
                range: [-0.8, 1.2],
                smoothing: 0.9,
                tags: ['camera']
            },
            cameraDolly: {
                value: 0,
                range: [-1.2, 0.8],
                smoothing: 0.88,
                tags: ['camera']
            },
            cameraRoll: {
                value: 0,
                range: [-Math.PI, Math.PI],
                smoothing: 0.94,
                tags: ['camera']
            },
            exposure: {
                value: 0,
                range: [-1.5, 1.5],
                smoothing: 0.82,
                tags: ['lighting']
            },
            shutter: {
                value: 0,
                range: [-1, 1],
                smoothing: 0.82,
                tags: ['lighting']
            },
            bloom: {
                value: 0,
                range: [0, 1.5],
                smoothing: 0.8,
                tags: ['lighting']
            },
            keyLight: {
                value: 0,
                range: [-0.8, 1.2],
                smoothing: 0.84,
                tags: ['lighting']
            },
            rimLight: {
                value: 0,
                range: [-0.6, 1.2],
                smoothing: 0.84,
                tags: ['lighting']
            },
            ambientLight: {
                value: 0,
                range: [-0.5, 0.6],
                smoothing: 0.82,
                tags: ['lighting']
            },
            vignette: {
                value: 0,
                range: [0, 0.9],
                smoothing: 0.8,
                tags: ['lighting']
            }
        });

        // Create visualizer
        this.visualizer = new QuantumHolographicVisualizer(
            this.canvasId,
            this.role,
            this.reactivity,
            this.variant
        );

        this.setCameraPreset('orbitSparkle');

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

            this.controlBus.recordGesture('pointerMove', { x, y });

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
        this.canvas.addEventListener('touchstart', (e) => {
            if (!this.controlBus) {
                return;
            }
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.touches[0].clientX - rect.left) / rect.width;
            const y = (e.touches[0].clientY - rect.top) / rect.height;
            this.controlBus.recordGesture('pointerDown', { x, y });
        });

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

        this.canvas.addEventListener('touchend', (e) => {
            if (!this.controlBus || !e.changedTouches || !e.changedTouches[0]) {
                return;
            }
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.changedTouches[0].clientX - rect.left) / rect.width;
            const y = (e.changedTouches[0].clientY - rect.top) / rect.height;
            this.controlBus.recordGesture('pointerUp', { x, y });
        });
    }

    updateCameraPresetFromAudio(deltaTime = 16, audioData = {}) {
        if (!this.cameraLighting) {
            return;
        }

        this._cameraPresetCooldownMs = Math.max(0, (this._cameraPresetCooldownMs || 0) - (deltaTime || 0));

        const energy = clamp(audioData.rms, 0, 1);
        const bands = audioData.bands || {};
        const bass = clamp(bands.bass, 0, 1);
        const rhythm = audioData.rhythmPhases || {};
        const accent = clamp(rhythm.accentPulse ?? rhythm.accent, 0, 1);
        const downbeat = clamp(rhythm.downbeatPulse ?? rhythm.downbeat, 0, 1);
        const swing = clamp(Math.abs(rhythm.swingPulse ?? 0), 0, 1);
        const extreme = audioData.extremeDynamics || {};
        const dimension = clamp(extreme.dimensionLift, 0, 1);
        const chaos = clamp(extreme.chaosSurge, 0, 1);
        const motion = clamp(extreme.motionVelocity, 0, 1);

        const currentPreset = this.getActiveCameraPreset() || 'orbitSparkle';
        let targetPreset = currentPreset;

        if (energy > 0.78 || bass > 0.72 || motion > 0.68) {
            targetPreset = 'bassDropZoom';
        } else if (energy < 0.38 && accent < 0.35 && dimension < 0.35) {
            targetPreset = 'heartGlide';
        } else if (chaos > 0.52 || swing > 0.45 || downbeat > 0.55) {
            targetPreset = 'orbitSparkle';
        }

        if (targetPreset !== currentPreset && this._cameraPresetCooldownMs <= 0) {
            const options = {
                duration: targetPreset === 'bassDropZoom' ? 1100 : targetPreset === 'heartGlide' ? 1700 : 1400,
                easing: targetPreset === 'bassDropZoom' ? 'ease-out' : 'smoothstep'
            };

            if (targetPreset === 'bassDropZoom') {
                options.overrides = { dolly: -0.12, exposure: 0.2 };
            } else if (targetPreset === 'heartGlide') {
                options.overrides = { exposure: -0.15, ambientLight: 0.1 };
            }

            this.transitionCameraPreset(targetPreset, options);
            this._cameraPresetCooldownMs = targetPreset === 'bassDropZoom' ? 1800 : 1500;
        }
    }

    /**
     * Update method called every frame
     */
    update(deltaTime, parameters = {}, audioData, cameraStateOverride = null) {
        // Update click intensity decay
        if (this.visualizer.updateClickIntensity) {
            this.visualizer.updateClickIntensity(deltaTime);
        }

        const controlParams = this.prepareControlParameters(
            deltaTime,
            parameters,
            this.audioEnabled ? audioData : null
        );

        if (this.audioEnabled && audioData) {
            this.updateCameraPresetFromAudio(deltaTime, audioData);
        }

        if (this.visualizer.updateParameters) {
            this.visualizer.updateParameters(controlParams);
        } else if (this.visualizer.setParameters) {
            this.visualizer.setParameters(controlParams);
        }

        const cameraChannels = this.controlBus
            ? this.controlBus.getTaggedSnapshot('camera', controlParams)
            : {};
        const lightingChannels = this.controlBus
            ? this.controlBus.getTaggedSnapshot('lighting', controlParams)
            : {};

        const cameraState = cameraStateOverride || this.cameraLighting.update(
            deltaTime,
            this.audioEnabled ? audioData : null,
            {
                pointer: {
                    x: this.visualizer?.mouseX ?? 0.5,
                    y: this.visualizer?.mouseY ?? 0.5
                },
                cameraChannels,
                lightingChannels
            }
        );

        if (cameraState && this.visualizer && this.visualizer.setCameraLighting) {
            this.visualizer.setCameraLighting(cameraState);
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

        if (this.controlBus && color) {
            if (typeof color.orbit === 'number') {
                this.controlBus.modulateChannel('hue', (color.orbit - 0.5) * 200, {
                    decay: 3.8
                });
            }
            if (typeof color.accentLevel === 'number') {
                this.controlBus.modulateChannel('saturation', color.accentLevel * 0.4, {
                    decay: 3.2,
                    polarity: 'positive'
                });
            }
            if (typeof color.energy === 'number') {
                this.controlBus.modulateChannel('chaos', color.energy * 0.35, {
                    decay: 2.9,
                    polarity: 'positive'
                });
            }
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
