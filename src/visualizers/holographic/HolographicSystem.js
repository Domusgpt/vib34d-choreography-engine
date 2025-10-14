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

            // Bass drives layer intensity
            const bassIntensity = getBandLevel('bass') * this.audioReactivity;

            // Mid frequencies drive layer speed
            const midIntensity = getBandLevel('mid') * this.audioReactivity;

            // High frequencies drive shimmer
            const highIntensity = getBandLevel('high') * this.audioReactivity;

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
