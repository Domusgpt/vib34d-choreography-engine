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
import { BehaviorPreviewDriver } from '../shared/BehaviorPreview.js';

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

        this.previewDriver = new BehaviorPreviewDriver({
            baseHue: config.previewHue || 210,
            paletteStops: 6
        });
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

        // New behavior/sweep engine integration - journey-aware control
        const previewBehavior = this.previewDriver.sample(performance.now());
        const behaviorState = parameters?.behaviorState || audioData?.behaviorState || previewBehavior;
        const sweepState = parameters?.sweepState || audioData?.sweepState || {};
        const baseHue = parameters?.hue ?? 200;

        // Per-journey phase presets (favor low baseline motion with audio-driven surges)
        const journeyPhase = behaviorState.journeyPhase || 'orbit';
        const journeyPresets = {
            orbit: {
                camera: { tilt: 0.08, sway: 0.04 },
                volumetric: 0.35,
                hueSpan: [baseHue - 20, baseHue + 40],
                contrast: 0.85,
                rotation: { xw: 0.12, yw: 0.08, zw: 0.04 }
            },
            pendulum: {
                camera: { tilt: 0.03, sway: 0.12 },
                volumetric: 0.28,
                hueSpan: [baseHue - 10, baseHue + 25],
                contrast: 0.9,
                rotation: { xw: 0.08, yw: 0.18, zw: 0.06 }
            },
            spiral: {
                camera: { tilt: 0.12, sway: 0.1 },
                volumetric: 0.42,
                hueSpan: [baseHue - 30, baseHue + 55],
                contrast: 0.95,
                rotation: { xw: 0.16, yw: 0.14, zw: 0.1 }
            }
        };

        const activePreset = journeyPresets[journeyPhase] || journeyPresets.orbit;

        // Beat/onset envelopes provide cinematic surges without high baseline motion
        const beatEnvelope = Math.min(1, behaviorState.beatEnvelope ?? (audioData?.beatEnvelope || audioData?.rms || 0));
        const onsetEnvelope = Math.min(1, behaviorState.onsetEnvelope ?? audioData?.onset ?? 0);

        // Palette bands allow multi-stop gradients driven by journey hue span
        const paletteBands = behaviorState.paletteBands || sweepState.paletteBands || [
            { position: 0.0, color: [0.05, 0.02, 0.12] },
            { position: 0.32, color: [0.25, 0.15, 0.35] },
            { position: 0.68, color: [0.68, 0.35, 0.15] },
            { position: 1.0, color: [1.0, 0.65, 0.28] }
        ];

        // Rotation targets from sweep engine layered on top of preset journey rotations
        const rotationTargets = sweepState.rotations || behaviorState.rotationTargets || behaviorState.rotations || activePreset.rotation;

        if (this.visualizer.applyBehaviorState) {
            this.visualizer.applyBehaviorState({
                journeyPhase,
                beatEnvelope,
                onsetEnvelope,
                volumetricDensity: activePreset.volumetric + beatEnvelope * 0.35 + onsetEnvelope * 0.35,
                hueSpan: activePreset.hueSpan,
                contrastCurve: activePreset.contrast + onsetEnvelope * 0.25,
                paletteBands,
                rotationTargets,
                cameraPreset: activePreset.camera
            });
        }

        // Get color from color system
        const time = this.visualizer.getTime();
        const color = this.colorSystem.getColor(
            this.visualizer.mouseX,
            this.visualizer.mouseY,
            time,
            baseHue,
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
