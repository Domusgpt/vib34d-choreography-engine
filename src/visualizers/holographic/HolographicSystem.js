/**
 * Holographic System - Audio-Reactive Multi-Layer Rendering
 * Extends BaseSystem with Holographic-specific implementation
 *
 * Consolidates 3 holographic variants from original repo into 1 unified system
 *
 * A Paul Phillips Manifestation
 * © 2025 Clear Seas Solutions LLC
 */

import { BaseSystem } from '../shared/BaseSystem.js';
import { HolographicVisualizer } from './HolographicVisualizer.js';
import { ParameterManager } from '../../core/Parameters.js';

const clamp = (value, min, max) => {
    const numeric = typeof value === 'number' && Number.isFinite(value) ? value : min;
    return Math.min(Math.max(numeric, min), max);
};

export class HolographicSystem extends BaseSystem {
    constructor(config) {
        super({
            ...config,
            name: config.name || 'Holographic',
            type: 'holographic'
        });

        this.role = config.role || 'content';
        this.reactivity = config.reactivity || 1.0;
        this.variant = config.variant || 0;

        // Holographic-specific state
        this.scrollRotation = 0;
        this.touchRotation = 0;
        this._cameraPresetCooldownMs = 0;
    }

    /**
     * Create visualizer for Holographic system
     */
    async createVisualizer() {
        console.log('✨ Creating Holographic visualizer...');

        // Initialize parameter manager
        this.parameters = new ParameterManager({
            gridDensity: 22,
            morphFactor: 0.65,
            chaos: 0.28,
            speed: 1.0,
            hue: 210,
            intensity: 0.55,
            saturation: 0.78,
            geometry: 0,
            rot4dXW: 0,
            rot4dYW: 0,
            rot4dZW: 0,
            colorStyle: 0,
            colorProfile: 0,
            colorVibrance: 1.0
        });

        this.controlBus.attachParameterManager(this.parameters);
        this.controlBus.defineChannels({
            gridDensity: {
                value: 22,
                range: [8, 52],
                smoothing: 0.85,
                audioMap: [
                    { path: 'bands.mid', scale: 7.0 },
                    { path: 'extremeDynamics.motionVelocity', scale: 5.0, clamp: [-3, 6] },
                    { path: 'colorChoreography.ribbon', scale: 4.0 }
                ],
                tags: ['geometry']
            },
            morphFactor: {
                value: 0.65,
                range: [0, 1.8],
                smoothing: 0.82,
                audioMap: [
                    { path: 'extremeDynamics.dimensionLift', scale: 1.3 },
                    { path: 'colorChoreography.ribbon', scale: 0.4 }
                ],
                tags: ['geometry']
            },
            chaos: {
                value: 0.28,
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
                range: [0.3, 2.6],
                smoothing: 0.8,
                audioMap: [
                    { path: 'extremeDynamics.motionVelocity', scale: 1.1 },
                    (audio) => Math.sin((audio?.rhythmPhases?.beatPhase || 0) * 6.28318) * 0.35
                ],
                tags: ['motion']
            },
            hue: {
                value: 210,
                range: [0, 360],
                smoothing: 0.9,
                audioMap: [
                    { path: 'colorChoreography.orbit', scale: 105 },
                    { path: 'colorChoreography.accentLuma', scale: 50 }
                ],
                tags: ['color']
            },
            intensity: {
                value: 0.55,
                range: [0, 1.8],
                smoothing: 0.76,
                audioMap: [
                    { path: 'rms', scale: 1.0 },
                    { path: 'extremeDynamics.motionVelocity', scale: 0.4 }
                ],
                tags: ['lighting']
            },
            saturation: {
                value: 0.78,
                range: [0.3, 1],
                smoothing: 0.84,
                audioMap: [
                    { path: 'colorChoreography.saturationPulse', scale: 0.25 },
                    { path: 'extremeDynamics.dimensionLift', scale: 0.1 }
                ],
                tags: ['color']
            },
            geometry: {
                value: 0,
                range: [0, 5],
                smoothing: 0.95,
                audioMap: (audio) => Math.sin((audio?.rhythmPhases?.measurePhase || 0) * 6.28318) * 1.4,
                tags: ['geometry']
            },
            rot4dXW: {
                value: 0,
                range: [-6.28318, 6.28318],
                smoothing: 0.94,
                audioMap: [
                    { path: 'bands.bass', scale: 0.55 },
                    { path: 'extremeDynamics.motionVelocity', scale: 0.4 }
                ]
            },
            rot4dYW: {
                value: 0,
                range: [-6.28318, 6.28318],
                smoothing: 0.93,
                audioMap: [
                    { path: 'bands.mid', scale: 0.48 },
                    { path: 'extremeDynamics.swingEnergy', scale: 0.38 }
                ]
            },
            rot4dZW: {
                value: 0,
                range: [-6.28318, 6.28318],
                smoothing: 0.93,
                audioMap: [
                    { path: 'bands.high', scale: 0.5 },
                    { path: 'extremeDynamics.chaosSurge', scale: 0.32 }
                ]
            },
            colorVibrance: {
                value: 1.0,
                range: [0.3, 2.5],
                smoothing: 0.82,
                audioMap: [
                    { path: 'colorChoreography.saturationPulse', scale: 0.45 },
                    { path: 'extremeDynamics.dimensionLift', scale: 0.3 }
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

        this.controlBus.defineChannels({
            cameraOrbit: {
                value: 0,
                range: [-Math.PI, Math.PI],
                smoothing: 0.94,
                tags: ['camera']
            },
            cameraElevation: {
                value: 0,
                range: [-0.8, 1.2],
                smoothing: 0.88,
                tags: ['camera']
            },
            cameraDolly: {
                value: 0,
                range: [-1.0, 0.7],
                smoothing: 0.86,
                tags: ['camera']
            },
            cameraRoll: {
                value: 0,
                range: [-Math.PI, Math.PI],
                smoothing: 0.92,
                tags: ['camera']
            },
            exposure: {
                value: 0,
                range: [-1.2, 1.2],
                smoothing: 0.8,
                tags: ['lighting']
            },
            shutter: {
                value: 0,
                range: [-1, 1],
                smoothing: 0.8,
                tags: ['lighting']
            },
            bloom: {
                value: 0,
                range: [0, 1.5],
                smoothing: 0.78,
                tags: ['lighting']
            },
            keyLight: {
                value: 0,
                range: [-0.6, 1.2],
                smoothing: 0.82,
                tags: ['lighting']
            },
            rimLight: {
                value: 0,
                range: [-0.6, 1.2],
                smoothing: 0.82,
                tags: ['lighting']
            },
            ambientLight: {
                value: 0,
                range: [-0.4, 0.6],
                smoothing: 0.8,
                tags: ['lighting']
            },
            vignette: {
                value: 0,
                range: [0, 0.9],
                smoothing: 0.78,
                tags: ['lighting']
            },
            filmGrain: {
                value: 0,
                range: [0, 1.4],
                smoothing: 0.8,
                audioMap: [
                    { path: 'extremeDynamics.chaosSurge', scale: 0.32 },
                    { path: 'bands.high', scale: 0.2 }
                ],
                tags: ['lighting']
            },
            lensDistortion: {
                value: 0,
                range: [-0.5, 0.8],
                smoothing: 0.84,
                audioMap: [
                    { path: 'extremeDynamics.dimensionLift', scale: 0.22 },
                    { path: 'bands.mid', scale: 0.16 }
                ],
                tags: ['camera']
            },
            frameBlend: {
                value: 0,
                range: [0, 1.1],
                smoothing: 0.78,
                audioMap: [
                    { path: 'rhythmPhases.accentPulse', scale: 0.26 },
                    { path: 'extremeDynamics.motionVelocity', scale: 0.24 }
                ],
                tags: ['lighting']
            },
            lightWrap: {
                value: 0,
                range: [0, 1.3],
                smoothing: 0.82,
                audioMap: [
                    { path: 'bands.mid', scale: 0.22 },
                    { path: 'colorChoreography.accentLuma', scale: 0.24 }
                ],
                tags: ['lighting']
            },
            colorBleed: {
                value: 0,
                range: [0, 1.5],
                smoothing: 0.82,
                audioMap: [
                    { path: 'colorChoreography.orbit', scale: 0.2 },
                    { path: 'extremeDynamics.chaosSurge', scale: 0.24 }
                ],
                tags: ['lighting', 'color']
            }
        });

        // Create visualizer
        this.visualizer = new HolographicVisualizer(
            this.canvasId,
            this.role,
            this.reactivity,
            this.variant
        );

        this.setCameraPreset('heartGlide');

        const initialParams = this.controlBus.getSnapshot(this.parameters.getAllParameters());
        if (this.visualizer.updateParameters) {
            this.visualizer.updateParameters(initialParams);
        } else if (this.visualizer.setParameters) {
            this.visualizer.setParameters(initialParams);
        }

        console.log('✅ Holographic visualizer created');
    }

    /**
     * Setup interactions specific to Holographic (full interactivity)
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

            this.controlBus.modulateChannel('hue', centeredX * 75, { decay: 2.6 });
            this.controlBus.modulateChannel('saturation', pointerRadius * 0.22, {
                decay: 3.0,
                polarity: 'positive'
            });
            this.controlBus.modulateChannel('morphFactor', pointerRadius * 0.4, {
                decay: 2.8,
                polarity: 'positive'
            });
        };

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            modulatePointer(x, y);
        });

        // Scroll rotation
        window.addEventListener('wheel', (e) => {
            this.scrollRotation += e.deltaY * 0.001;

            if (this.visualizer && this.visualizer.setScrollRotation) {
                this.visualizer.setScrollRotation(this.scrollRotation);
            }

            if (this.controlBus) {
                const direction = Math.sign(e.deltaY) || 1;
                this.controlBus.modulateChannel('gridDensity', direction * -1.2, { decay: 3.2 });
                this.controlBus.modulateChannel('chaos', direction * 0.14, { decay: 2.5 });
            }
        });

        // Touch rotation
        let lastTouchX = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            lastTouchX = e.touches[0].clientX;
            if (this.controlBus) {
                const rect = this.canvas.getBoundingClientRect();
                const x = (lastTouchX - rect.left) / rect.width;
                const y = (e.touches[0].clientY - rect.top) / rect.height;
                this.controlBus.recordGesture('pointerDown', { x, y });
            }
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();

            // Update mouse position
            const x = (touch.clientX - rect.left) / rect.width;
            const y = (touch.clientY - rect.top) / rect.height;

            if (this.visualizer && this.visualizer.setMousePosition) {
                this.visualizer.setMousePosition(x, y);
            }

            // Calculate rotation from touch movement
            const deltaX = touch.clientX - lastTouchX;
            this.touchRotation += deltaX * 0.01;
            lastTouchX = touch.clientX;

            if (this.visualizer && this.visualizer.setTouchRotation) {
                this.visualizer.setTouchRotation(this.touchRotation);
            }

            modulatePointer(x, y);
        });

        // Double tap for extra effects
        let lastTapTime = 0;
        this.canvas.addEventListener('touchend', (e) => {
            if (this.controlBus && e.changedTouches && e.changedTouches[0]) {
                const rect = this.canvas.getBoundingClientRect();
                const x = (e.changedTouches[0].clientX - rect.left) / rect.width;
                const y = (e.changedTouches[0].clientY - rect.top) / rect.height;
                this.controlBus.recordGesture('pointerUp', { x, y });
            }
            const now = Date.now();
            if (now - lastTapTime < 300) {
                // Double tap detected
                if (this.visualizer && this.visualizer.triggerDoubleTap) {
                    this.visualizer.triggerDoubleTap();
                }
                if (this.controlBus) {
                    this.controlBus.modulateChannel('intensity', 1.2, {
                        decay: 5.8,
                        polarity: 'positive'
                    });
                    this.controlBus.modulateChannel('chaos', 0.6, {
                        decay: 4.2,
                        polarity: 'positive'
                    });
                }
            }
            lastTapTime = now;
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
        const swing = clamp(Math.abs(rhythm.swingPulse ?? 0), 0, 1);
        const accent = clamp(rhythm.accentPulse ?? rhythm.accent, 0, 1);
        const color = audioData.colorChoreography || {};
        const ribbon = clamp(Math.abs(color.ribbon ?? 0), 0, 1);
        const glint = clamp(color.accentLuma, 0, 1);
        const extreme = audioData.extremeDynamics || {};
        const chaos = clamp(extreme.chaosSurge, 0, 1);

        const currentPreset = this.getActiveCameraPreset() || 'heartGlide';
        let targetPreset = currentPreset;

        if (energy > 0.74 || bass > 0.7 || chaos > 0.6) {
            targetPreset = 'bassDropZoom';
        } else if (ribbon > 0.45 || swing > 0.55 || glint > 0.65) {
            targetPreset = 'orbitSparkle';
        } else if (energy < 0.4 && accent < 0.35 && ribbon < 0.3) {
            targetPreset = 'heartGlide';
        }

        if (targetPreset !== currentPreset && this._cameraPresetCooldownMs <= 0) {
            const options = {
                duration: targetPreset === 'bassDropZoom' ? 1200 : targetPreset === 'orbitSparkle' ? 1350 : 1650,
                easing: targetPreset === 'bassDropZoom' ? 'ease-out' : 'ease-in-out'
            };

            if (targetPreset === 'bassDropZoom') {
                options.overrides = { exposure: 0.22, dolly: -0.15 };
            } else if (targetPreset === 'heartGlide') {
                options.overrides = { exposure: -0.12, ambientLight: 0.14 };
            } else if (targetPreset === 'orbitSparkle') {
                options.overrides = { roll: 0.08 };
            }

            this.transitionCameraPreset(targetPreset, options);
            this._cameraPresetCooldownMs = targetPreset === 'bassDropZoom' ? 1900 : 1500;
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
            if (typeof color.pointerRadius === 'number') {
                this.controlBus.modulateChannel('morphFactor', color.pointerRadius * 0.45, {
                    decay: 2.8,
                    polarity: 'positive'
                });
            }

            if (typeof color.accentLevel === 'number') {
                this.controlBus.modulateChannel('intensity', color.accentLevel * 0.4, {
                    decay: 3.0,
                    polarity: 'positive'
                });
            }

            if (typeof color.energy === 'number') {
                this.controlBus.modulateChannel('chaos', color.energy * 0.28, {
                    decay: 2.6,
                    polarity: 'positive'
                });
            }
        }

        // Holographic system has MAXIMUM audio reactivity
        if (audioData && this.visualizer && this.visualizer.setAudioChoreography) {
            this.visualizer.setAudioChoreography(audioData);
        }

        if (audioData && this.audioEnabled) {
            const getBandLevel = (name) => {
                if (!audioData) return 0;
                const bands = audioData.bands || {};
                const bandDetails = audioData.bandDetails || {};
                if (typeof bands[name] === 'number') {
                    return bands[name];
                }
                if (typeof bandDetails[name]?.value === 'number') {
                    return bandDetails[name].value;
                }
                const legacyBand = bands[name];
                return typeof legacyBand?.value === 'number' ? legacyBand.value : 0;
            };

            // Bass drives layer intensity with transient bursts boosting the lift
            const extremeDynamics = audioData.extremeDynamics || {};
            const bassIntensity = (
                getBandLevel('bass') + (extremeDynamics.transientBurst || 0) * 0.6
            ) * this.audioReactivity;

            // Mid frequencies and motion velocity push the layer speed
            const midIntensity = (
                getBandLevel('mid') + (extremeDynamics.motionVelocity || 0) * 0.8
            ) * this.audioReactivity;

            // High frequencies and accent light drive shimmer colour pops
            const colorMeta = audioData.colorChoreography || {};
            const highIntensity = (
                getBandLevel('high') + (colorMeta.accentLuma || 0) * 0.7
            ) * this.audioReactivity;

            // Onsets trigger layer bursts
            const onsetEvent = audioData.onsetEvent || (typeof audioData.onset === 'object' ? audioData.onset : null);
            if (onsetEvent?.detected && this.visualizer.triggerOnset) {
                this.visualizer.triggerOnset(onsetEvent.strength);
            }

            // Apply audio-specific effects
            if (this.visualizer.setLayerIntensity) {
                this.visualizer.setLayerIntensity(bassIntensity);
            }

            if (this.visualizer.setLayerSpeed) {
                this.visualizer.setLayerSpeed(0.5 + midIntensity);
            }

            if (this.visualizer.setShimmerIntensity) {
                this.visualizer.setShimmerIntensity(highIntensity);
            }

            // BPM-locked effects
            if (audioData.bpm && this.visualizer.setBPM) {
                this.visualizer.setBPM(audioData.bpm);
            }

            if (this.controlBus) {
                this.controlBus.modulateChannel('intensity', bassIntensity * 0.5, {
                    decay: 3.6,
                    polarity: 'positive'
                });
                this.controlBus.modulateChannel('morphFactor', midIntensity * 0.45, {
                    decay: 2.8,
                    polarity: 'positive'
                });
                this.controlBus.modulateChannel('hue', highIntensity * 40, { decay: 3.1 });
            }
        }

        // Render frame
        this.visualizer.render(controlParams);
    }

    /**
     * Override parameter update for Holographic-specific behavior
     */
    updateParameter(name, value) {
        super.updateParameter(name, value);

        // Holographic visualizer has enhanced parameter handling
        if (this.visualizer && this.visualizer.updateParameter) {
            this.visualizer.updateParameter(name, value);
        }
    }

    /**
     * Holographic-specific: Set audio override mode
     * When true, audio completely controls certain parameters
     */
    setAudioOverrideMode(enabled) {
        this.audioOverrideMode = enabled;
    }
}
