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
import { BehaviorPreviewDriver } from '../shared/BehaviorPreview.js';

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

        this.previewDriver = new BehaviorPreviewDriver({
            baseHue: config.previewHue || 205,
            paletteStops: 6
        });

        // Holographic-specific state
        this.scrollRotation = 0;
        this.touchRotation = 0;

        this.parameterTuning = {
            baselineOverrides: {},
            reactiveLimits: {}
        };

        this._reactiveProfilesInitialized = false;
    }

    setParameterTuning(tuning = {}) {
        this.parameterTuning = {
            baselineOverrides: {
                ...this.parameterTuning.baselineOverrides,
                ...(tuning.baselineOverrides || {})
            },
            reactiveLimits: {
                ...this.parameterTuning.reactiveLimits,
                ...(tuning.reactiveLimits || {})
            }
        };

        if (this.parameters) {
            this.parameters.setBaselineOverrides(this.parameterTuning.baselineOverrides);
            this.parameters.setReactiveLimits(this.parameterTuning.reactiveLimits);
        }
    }

    /**
     * Create visualizer for Holographic system
     */
    async createVisualizer() {
        console.log('✨ Creating Holographic visualizer...');

        // Initialize parameter manager
        this.parameters = new ParameterManager();

        // Create visualizer
        this.visualizer = new HolographicVisualizer(
            this.canvasId,
            this.role,
            this.reactivity,
            this.variant
        );

        console.log('✅ Holographic visualizer created');
    }

    /**
     * Setup interactions specific to Holographic (full interactivity)
     */
    async setupInteractions() {
        await super.setupInteractions();

        // Scroll rotation
        window.addEventListener('wheel', (e) => {
            this.scrollRotation += e.deltaY * 0.001;

            if (this.visualizer && this.visualizer.setScrollRotation) {
                this.visualizer.setScrollRotation(this.scrollRotation);
            }
        });

        // Touch rotation
        let lastTouchX = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            lastTouchX = e.touches[0].clientX;
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
        });

        // Double tap for extra effects
        let lastTapTime = 0;
        this.canvas.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTapTime < 300) {
                // Double tap detected
                if (this.visualizer && this.visualizer.triggerDoubleTap) {
                    this.visualizer.triggerDoubleTap();
                }
            }
            lastTapTime = now;
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

        const previewBehavior = this.previewDriver.sample(performance.now());
        const behaviorState = parameters?.behaviorState || audioData?.behaviorState || previewBehavior;
        const sweepState = parameters?.sweepState || audioData?.sweepState || {};
        const baseHue = parameters?.hue ?? 200;

        const journeyPhase = behaviorState.journeyPhase || 'orbit';
        const journeyPresets = {
            orbit: {
                camera: { tilt: 0.05, sway: 0.04 },
                volumetric: 0.28,
                hueSpan: [baseHue - 10, baseHue + 30],
                contrast: 0.82,
                rotation: { xw: 0.1, yw: 0.08, zw: 0.04 }
            },
            pendulum: {
                camera: { tilt: 0.02, sway: 0.12 },
                volumetric: 0.24,
                hueSpan: [baseHue - 8, baseHue + 24],
                contrast: 0.88,
                rotation: { xw: 0.08, yw: 0.14, zw: 0.06 }
            },
            spiral: {
                camera: { tilt: 0.12, sway: 0.1 },
                volumetric: 0.32,
                hueSpan: [baseHue - 22, baseHue + 42],
                contrast: 0.94,
                rotation: { xw: 0.14, yw: 0.12, zw: 0.09 }
            }
        };

        const activePreset = journeyPresets[journeyPhase] || journeyPresets.orbit;

        const beatEnvelope = Math.min(1, behaviorState.beatEnvelope ?? (audioData?.beatEnvelope || audioData?.rms || 0));
        const onsetEnvelope = Math.min(1, behaviorState.onsetEnvelope ?? audioData?.onset ?? 0);

        const paletteBands = behaviorState.paletteBands || sweepState.paletteBands || [
            { position: 0.0, color: [0.06, 0.12, 0.24] },
            { position: 0.38, color: [0.22, 0.3, 0.48] },
            { position: 0.7, color: [0.56, 0.32, 0.24] },
            { position: 1.0, color: [0.94, 0.68, 0.36] }
        ];

        const rotationTargets = sweepState.rotations || behaviorState.rotationTargets || behaviorState.rotations || activePreset.rotation;

        if (!this._reactiveProfilesInitialized) {
            this.parameters.setProfiles({
                volumetricDensity: { range: 0.3, min: 0, max: 1 },
                contrastCurve: { range: 0.22, min: 0.35, max: 1.3 },
                hueStart: { range: -16 },
                hueEnd: { range: 38 },
                cameraTilt: { range: 0.05, min: -1, max: 1 },
                cameraSway: { range: 0.05, min: -1, max: 1 }
            });
            this._reactiveProfilesInitialized = true;
        }

        this.parameters.setBaselineOverrides(this.parameterTuning.baselineOverrides);
        this.parameters.setReactiveLimits(this.parameterTuning.reactiveLimits);

        this.parameters.setBaseline({
            volumetricDensity: activePreset.volumetric,
            contrastCurve: activePreset.contrast,
            hueStart: activePreset.hueSpan[0],
            hueEnd: activePreset.hueSpan[1],
            cameraTilt: activePreset.camera.tilt,
            cameraSway: activePreset.camera.sway
        });

        const resolved = this.parameters.resolve({
            beatEnvelope,
            onsetEnvelope,
            audioLevel: audioData?.rms || 0
        });
        const parameterDiagnostics = this.parameters.getDiagnostics();

        if (this.visualizer.applyBehaviorState) {
            this.visualizer.applyBehaviorState({
                journeyPhase,
                beatEnvelope,
                onsetEnvelope,
                volumetricDensity: resolved.volumetricDensity,
                hueSpan: [resolved.hueStart, resolved.hueEnd],
                contrastCurve: resolved.contrastCurve,
                paletteBands,
                rotationTargets,
                cameraPreset: {
                    tilt: resolved.cameraTilt,
                    sway: resolved.cameraSway
                },
                parameterDiagnostics
            });
        }

        this.visualizer.parameterDiagnostics = parameterDiagnostics;

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

        // Holographic system has MAXIMUM audio reactivity
        if (audioData && this.audioEnabled) {
            // Bass drives layer intensity
            const bassIntensity = (audioData.bands.bass?.value || 0) * this.audioReactivity;

            // Mid frequencies drive layer speed
            const midIntensity = (audioData.bands.mid?.value || 0) * this.audioReactivity;

            // High frequencies drive shimmer
            const highIntensity = (audioData.bands.high?.value || 0) * this.audioReactivity;

            // Onsets trigger layer bursts
            if (audioData.onset.detected && this.visualizer.triggerOnset) {
                this.visualizer.triggerOnset(audioData.onset.strength);
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
        }

        // Render frame
        this.visualizer.render(parameters);
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
