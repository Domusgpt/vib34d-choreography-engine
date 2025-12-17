/**
 * Faceted System - Simple 2D Patterns
 * Extends BaseSystem with Faceted-specific implementation
 *
 * A Paul Phillips Manifestation
 * © 2025 Clear Seas Solutions LLC
 */

import { BaseSystem } from '../shared/BaseSystem.js';
import { BehaviorSweepEngine } from '../shared/BehaviorSweepEngine.js';
import { IntegratedHolographicVisualizer } from './FacetedVisualizer.js';
import { ParameterManager } from '../../core/Parameters.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

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

        this.behaviorPreset = config.behaviorPreset || 'cinematic';
        this.behaviorEngine = new BehaviorSweepEngine(this.behaviorPreset);
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

        const behavior = this.behaviorEngine.applyBehavioralReactivity({
            audioFrame: audioData,
            beatInfo: audioData?.beat,
            preset: this.behaviorPreset,
            deltaTime
        });

        const tone = behavior.tone || { bass: 0, mid: 0, air: 0 };

        const reactiveParams = { ...parameters };

        reactiveParams.gridDensity = clamp(
            (parameters.gridDensity || 0) + behavior.densityDelta * this.audioReactivity,
            0,
            120
        );

        reactiveParams.morphFactor = clamp(
            (parameters.morphFactor || 0) + behavior.morphDelta * this.audioReactivity,
            0,
            3.5
        );

        reactiveParams.hue = (parameters.hue || 0) + behavior.color.hueShift;
        reactiveParams.saturation = clamp(
            (parameters.saturation || 0)
                + behavior.color.saturationPulse
                + behavior.color.spark * 0.25
                + tone.mid * 0.06,
            0,
            1
        );

        reactiveParams.intensity = clamp(
            (parameters.intensity || 0.9)
                + behavior.color.spark * this.audioReactivity * 0.6
                + behavior.light.glow * 0.25
                + tone.bass * 0.15
                + tone.air * 0.12,
            0.1,
            3
        );

        reactiveParams.parallaxDepth = clamp(
            (parameters.parallaxDepth || 0) + behavior.atmosphere.parallaxDepth * this.audioReactivity,
            -1.25,
            1.25
        );

        reactiveParams.gridDensityShift = clamp(
            (parameters.gridDensityShift || 0) + behavior.atmosphere.gridShift * this.audioReactivity,
            -2,
            2
        );

        reactiveParams.shimmer = clamp(
            (parameters.shimmer || 0) + behavior.atmosphere.shimmer * this.audioReactivity,
            0,
            2
        );

        reactiveParams.warp = clamp(
            (parameters.warp || 0) + behavior.atmosphere.warp * this.audioReactivity,
            -1.25,
            1.25
        );

        reactiveParams.haze = clamp(
            (parameters.haze || 0) + behavior.atmosphere.haze * this.audioReactivity + tone.air * 0.2,
            0,
            2
        );

        reactiveParams.trailPersistence = clamp(
            (parameters.trailPersistence || 0) + behavior.fx.trail * this.audioReactivity,
            0,
            2
        );

        reactiveParams.chromaFringe = clamp(
            (parameters.chromaFringe || 0) + behavior.fx.chroma * this.audioReactivity,
            0,
            2
        );

        reactiveParams.flare = clamp(
            (parameters.flare || 0) + behavior.fx.flare * this.audioReactivity,
            0,
            2.5
        );

        reactiveParams.bloom = clamp(
            (parameters.bloom || 0.2) + behavior.light.bloom * this.audioReactivity * 0.45,
            0,
            2.2
        );

        reactiveParams.glow = clamp(
            (parameters.glow || 0.15) + behavior.light.glow * this.audioReactivity * 0.35,
            0,
            2.2
        );

        reactiveParams.strobe = clamp(
            (parameters.strobe || 0) + behavior.light.strobe * this.audioReactivity,
            0,
            2
        );

        reactiveParams.rot4dXW = (parameters.rot4dXW || 0) + behavior.motionRotation.xw;
        reactiveParams.rot4dYW = (parameters.rot4dYW || 0) + behavior.motionRotation.yw;
        reactiveParams.rot4dZW = (parameters.rot4dZW || 0) + behavior.motionRotation.zw;

        // Update visualizer with parameters
        if (this.visualizer.updateParameters) {
            this.visualizer.updateParameters(reactiveParams);
        } else if (this.visualizer.setParameters) {
            this.visualizer.setParameters(reactiveParams);
        }

        // Get color from color system using reactive hue
        const time = this.visualizer.getTime();
        const color = this.colorSystem.getColor(
            this.visualizer.mouseX,
            this.visualizer.mouseY,
            time,
            reactiveParams.hue || 200,
            audioData
        );

        // Update color in visualizer
        if (this.visualizer.setColor) {
            this.visualizer.setColor(color);
        }

        if (this.visualizer) {
            this.visualizer.parallaxDepth = reactiveParams.parallaxDepth ?? this.visualizer.parallaxDepth;
            this.visualizer.gridDensityShift = reactiveParams.gridDensityShift ?? this.visualizer.gridDensityShift;
            this.visualizer.shimmer = reactiveParams.shimmer ?? this.visualizer.shimmer;
            this.visualizer.haze = reactiveParams.haze ?? this.visualizer.haze;
            this.visualizer.warp = reactiveParams.warp ?? this.visualizer.warp;
            this.visualizer.bloom = reactiveParams.bloom ?? this.visualizer.bloom;
        }

        // Render frame
        this.visualizer.render(reactiveParams);
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
