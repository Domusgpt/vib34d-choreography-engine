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
import { BehaviorPreviewDriver } from '../shared/BehaviorPreview.js';

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

        this.previewDriver = new BehaviorPreviewDriver({
            baseHue: config.previewHue || 200,
            paletteStops: 6
        });

        this._reactiveProfilesInitialized = false;
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

        const previewBehavior = this.previewDriver.sample(performance.now());
        const behaviorState = parameters?.behaviorState || audioData?.behaviorState || previewBehavior;
        const sweepState = parameters?.sweepState || audioData?.sweepState || {};
        const baseHue = parameters?.hue ?? 200;

        const journeyPhase = behaviorState.journeyPhase || 'orbit';
        const journeyPresets = {
            orbit: {
                camera: { tilt: 0.05, sway: 0.03 },
                volumetric: 0.22,
                hueSpan: [baseHue - 15, baseHue + 25],
                contrast: 0.8,
                rotation: { xw: 0.08, yw: 0.06, zw: 0.03 }
            },
            pendulum: {
                camera: { tilt: 0.02, sway: 0.1 },
                volumetric: 0.18,
                hueSpan: [baseHue - 5, baseHue + 20],
                contrast: 0.85,
                rotation: { xw: 0.06, yw: 0.12, zw: 0.05 }
            },
            spiral: {
                camera: { tilt: 0.1, sway: 0.08 },
                volumetric: 0.26,
                hueSpan: [baseHue - 25, baseHue + 35],
                contrast: 0.9,
                rotation: { xw: 0.12, yw: 0.1, zw: 0.08 }
            }
        };

        const activePreset = journeyPresets[journeyPhase] || journeyPresets.orbit;

        const beatEnvelope = Math.min(1, behaviorState.beatEnvelope ?? (audioData?.beatEnvelope || audioData?.rms || 0));
        const onsetEnvelope = Math.min(1, behaviorState.onsetEnvelope ?? audioData?.onset ?? 0);

        const paletteBands = behaviorState.paletteBands || sweepState.paletteBands || [
            { position: 0.0, color: [0.08, 0.03, 0.12] },
            { position: 0.36, color: [0.25, 0.18, 0.32] },
            { position: 0.72, color: [0.62, 0.38, 0.2] },
            { position: 1.0, color: [0.95, 0.68, 0.32] }
        ];

        const rotationTargets = sweepState.rotations || behaviorState.rotationTargets || behaviorState.rotations || activePreset.rotation;

        if (!this._reactiveProfilesInitialized) {
            this.parameters.setProfiles({
                volumetricDensity: { range: 0.22, min: 0, max: 1 },
                contrastCurve: { range: 0.18, min: 0.35, max: 1.2 },
                hueStart: { range: -12 },
                hueEnd: { range: 30 },
                cameraTilt: { range: 0.04, min: -1, max: 1 },
                cameraSway: { range: 0.04, min: -1, max: 1 }
            });
            this._reactiveProfilesInitialized = true;
        }

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
