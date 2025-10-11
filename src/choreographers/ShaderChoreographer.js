/**
 * ShaderChoreographer - GPU-Level Choreography
 *
 * Directly controls shader uniforms for maximum performance
 * - Rotation speed/phase/momentum
 * - Layer-specific choreography (Quantum)
 * - Particle choreography
 * - Glitch effects
 *
 * A Paul Phillips Manifestation
 */

export class ShaderChoreographer {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.gl = visualizer.gl;
        this.program = visualizer.program;

        // State
        this.rotationMomentum = 0;
        this.glitchIntensity = 0;
        this.particleExplosion = 0;

        console.log(`🎨 ShaderChoreographer initialized for ${visualizer.canvas?.id}`);
    }

    /**
     * Choreograph rotation at shader level
     */
    choreographRotation(audioData, beatPhase, time) {
        if (!this.visualizer.uniforms) return;

        // Rotation speed increases with energy
        const baseSpeed = 1.0;
        const energyBoost = (audioData.rms || 0) * 2.0;
        const rotationSpeed = baseSpeed + energyBoost;

        // Phase locked to beat
        const rotationPhase = beatPhase * Math.PI * 2;

        // Momentum accumulates from bass
        this.rotationMomentum *= 0.98; // Decay
        if (audioData.bands?.bass > 0.6) {
            this.rotationMomentum += audioData.bands.bass * 0.1;
        }

        // Apply to visualizer parameters (will be set as uniforms in render)
        this.visualizer.choreography = this.visualizer.choreography || {};
        this.visualizer.choreography.rotationSpeed = rotationSpeed;
        this.visualizer.choreography.rotationPhase = rotationPhase;
        this.visualizer.choreography.rotationMomentum = this.rotationMomentum;
    }

    /**
     * Choreograph layer colors (Quantum system)
     */
    choreographLayers(audioData, beat, measure) {
        if (!this.visualizer.uniforms) return;

        // Each layer on different phase of color journey
        const layerPhases = [
            0,                          // Background stable
            beat * 0.25,                // Shadow follows beats
            measure * 0.1,              // Content follows measures
            beat * 0.5 + measure * 0.05,// Highlight complex
            Math.random() * 0.1         // Accent chaotic
        ];

        // Beat-synchronized intensity modulation
        const layerIntensities = [
            0.6,                                    // Background constant
            0.7 + (audioData.bands?.bass || 0) * 0.3,      // Shadow bass-reactive
            0.8 + (audioData.rms || 0) * 0.2,             // Content energy-reactive
            (audioData.onset || 0) > 0.5 ? 1.0 : 0.8,     // Highlight onset-triggered
            0.5 + (audioData.bands?.high || 0) * 0.5       // Accent high-reactive
        ];

        // Store for visualizer to apply
        this.visualizer.choreography = this.visualizer.choreography || {};
        this.visualizer.choreography.layerPhases = layerPhases;
        this.visualizer.choreography.layerIntensities = layerIntensities;

        // Glitch amount on percussion
        this.glitchIntensity = (audioData.onset || 0) > 0.5 ? 1.0 : this.glitchIntensity * 0.9;
        this.visualizer.choreography.glitchAmount = this.glitchIntensity;
    }

    /**
     * Choreograph particles
     */
    choreographParticles(audioData, onset) {
        if (!this.visualizer.uniforms) return;

        // Explosion on onsets
        if (onset > 0.5) {
            this.particleExplosion = 1.0;
        } else {
            this.particleExplosion *= 0.95; // Decay
        }

        // Density follows energy
        const density = 0.5 + (audioData.rms || 0) * 1.5;

        // Velocity from bass
        const velocity = (audioData.bands?.bass || 0) * 2.0;

        // Store for visualizer
        this.visualizer.choreography = this.visualizer.choreography || {};
        this.visualizer.choreography.particleExplosion = this.particleExplosion;
        this.visualizer.choreography.particleDensity = density;
        this.visualizer.choreography.particleVelocity = velocity;
    }

    /**
     * Update all shader choreography
     */
    update(audioData, beatPhase, beat, measure, time) {
        this.choreographRotation(audioData, beatPhase, time);
        this.choreographLayers(audioData, beat, measure);
        this.choreographParticles(audioData, audioData.onset || 0);
    }

    /**
     * Get choreographed values for shader
     */
    getChoreography() {
        return this.visualizer.choreography || {};
    }
}
