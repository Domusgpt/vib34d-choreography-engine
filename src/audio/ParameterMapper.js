/**
 * Parameter Mapper - Audio to Visual Parameter Routing
 * Maps audio features to visualization parameters with curves and envelopes
 *
 * A Paul Phillips Manifestation
 * © 2025 Clear Seas Solutions LLC
 */

import { ADSREnvelope, ADSRPresets } from './ADSREnvelope.js';

export class ParameterMapper {
    constructor() {
        // Default mappings for each parameter
        this.mappings = {
            // 4D rotations from frequency bands
            rot4dXW: {
                source: 'bass',           // Which audio feature to use
                curve: 'exponential',     // Response curve
                range: [-2, 2],           // Output range
                baseValue: 0,             // Value when audio is silent
                scale: 1.0,               // Multiplier for sensitivity
                envelope: ADSRPresets.smooth()
            },
            rot4dYW: {
                source: 'mid',
                curve: 'exponential',
                range: [-2, 2],
                baseValue: 0,
                scale: 1.0,
                envelope: ADSRPresets.smooth()
            },
            rot4dZW: {
                source: 'high',
                curve: 'exponential',
                range: [-2, 2],
                baseValue: 0,
                scale: 1.0,
                envelope: ADSRPresets.smooth()
            },

            // Grid density from onsets (kicks/snares)
            gridDensity: {
                source: 'spectralFlux',
                curve: 'threshold',
                range: [10, 100],
                baseValue: 15,
                scale: 1.0,
                threshold: 0.15,         // Only respond to strong onsets
                envelope: ADSRPresets.kick()  // Fast attack, long decay
            },

            // Morph factor from mid frequencies
            morphFactor: {
                source: 'lowMid',
                curve: 's-curve',
                range: [0, 2],
                baseValue: 1.0,
                scale: 1.0,
                envelope: ADSRPresets.smooth()
            },

            // Chaos from high-mid
            chaos: {
                source: 'highMid',
                curve: 'exponential',
                range: [0, 1],
                baseValue: 0.2,
                scale: 0.8,
                envelope: ADSRPresets.smooth()
            },

            // Speed from overall energy (RMS)
            speed: {
                source: 'rms',
                curve: 'logarithmic',
                range: [0.3, 2.5],
                baseValue: 1.0,
                scale: 1.0,
                envelope: ADSRPresets.smooth()
            },

            // Hue from spectral centroid (brightness of sound)
            hue: {
                source: 'spectralCentroid',
                curve: 'linear',
                range: [0, 360],
                baseValue: 200,
                scale: 1.0,
                envelope: null  // Instant color changes (no envelope)
            },

            // Intensity from loudness
            intensity: {
                source: 'rms',
                curve: 'logarithmic',
                range: [0.3, 1.0],
                baseValue: 0.5,
                scale: 1.0,
                envelope: ADSRPresets.hihat()
            },

            // Saturation from spectral rolloff
            saturation: {
                source: 'spectralRolloff',
                curve: 'linear',
                range: [0.5, 1.0],
                baseValue: 0.8,
                scale: 1.0,
                envelope: null
            }
        };

        // Cache for previous values
        this.previousValues = {};
    }

    /**
     * Map audio data to parameter values
     * @param {Object} audioData - Output from AudioAnalyzer
     * @param {Object} userParameters - Current user-controlled values
     * @returns {Object} Mapped parameter values
     */
    map(audioData, userParameters = {}) {
        const mapped = {};

        for (const [paramName, mapping] of Object.entries(this.mappings)) {
            // Get source value from audio data
            let sourceValue = this.getSourceValue(audioData, mapping.source);

            // Apply curve
            sourceValue = this.applyCurve(sourceValue, mapping.curve, mapping.threshold);

            // Scale the value
            sourceValue *= mapping.scale;

            // Map to parameter range
            let mappedValue = this.mapToRange(
                sourceValue,
                mapping.range[0],
                mapping.range[1],
                mapping.baseValue
            );

            // Apply envelope if configured
            if (mapping.envelope) {
                mapping.envelope.trigger(mappedValue);
                mappedValue = mapping.envelope.update();
            }

            // Mix with user parameter if provided
            if (userParameters[paramName] !== undefined) {
                // User value takes precedence, audio adds variation
                mappedValue = userParameters[paramName] + (mappedValue - mapping.baseValue) * 0.3;
            }

            mapped[paramName] = mappedValue;
            this.previousValues[paramName] = mappedValue;
        }

        return mapped;
    }

    /**
     * Get value from audio data based on source name
     */
    getSourceValue(audioData, source) {
        // Check if it's a band
        if (audioData.bands && audioData.bands[source]) {
            return audioData.bands[source].value;
        }

        // Check if it's a spectral feature
        if (audioData[source] !== undefined) {
            return audioData[source];
        }

        return 0;
    }

    /**
     * Apply response curve to value
     */
    applyCurve(value, curve, threshold = 0.5) {
        switch(curve) {
            case 'linear':
                return value;

            case 'exponential':
                // Square for more dramatic response
                return Math.pow(value, 2);

            case 'logarithmic':
                // Logarithmic for less dramatic response
                return Math.log10(1 + value * 9) / Math.log10(10);

            case 's-curve':
                // Sigmoid curve for smooth transitions
                return 1 / (1 + Math.exp(-10 * (value - 0.5)));

            case 'threshold':
                // Binary response above threshold
                return value > threshold ? 1 : 0;

            case 'inverse':
                // Inverse relationship
                return 1 - value;

            case 'squared':
                // More extreme exponential
                return Math.pow(value, 3);

            default:
                return value;
        }
    }

    /**
     * Map value from 0-1 to parameter range
     */
    mapToRange(value, min, max, baseValue) {
        const range = max - min;
        return baseValue + (value - 0.5) * range;
    }

    /**
     * Update a mapping configuration
     */
    setMapping(paramName, config) {
        if (this.mappings[paramName]) {
            this.mappings[paramName] = { ...this.mappings[paramName], ...config };
        }
    }

    /**
     * Get current mapping for a parameter
     */
    getMapping(paramName) {
        return this.mappings[paramName];
    }

    /**
     * Enable/disable a mapping
     */
    setMappingEnabled(paramName, enabled) {
        if (this.mappings[paramName]) {
            this.mappings[paramName].enabled = enabled;
        }
    }

    /**
     * Set global audio reactivity amount (0-1)
     */
    setReactivity(amount) {
        for (const mapping of Object.values(this.mappings)) {
            mapping.scale = amount;
        }
    }

    /**
     * Load preset mapping configuration
     */
    loadPreset(presetName) {
        const preset = MappingPresets[presetName];
        if (preset) {
            this.mappings = preset();
        }
    }

    /**
     * Get debug info
     */
    getDebugInfo() {
        return Object.entries(this.mappings).map(([param, mapping]) => ({
            parameter: param,
            source: mapping.source,
            curve: mapping.curve,
            range: `[${mapping.range[0]}, ${mapping.range[1]}]`,
            envelope: mapping.envelope ? mapping.envelope.getPhase() : 'none',
            currentValue: this.previousValues[param]?.toFixed(3) || '0.000'
        }));
    }
}

/**
 * Preset mapping configurations
 */
export const MappingPresets = {
    /**
     * Subtle - gentle audio reactivity
     */
    subtle: () => ({
        rot4dXW: {
            source: 'bass',
            curve: 'logarithmic',
            range: [-0.5, 0.5],
            baseValue: 0,
            scale: 0.5,
            envelope: ADSRPresets.smooth()
        },
        gridDensity: {
            source: 'mid',
            curve: 'linear',
            range: [12, 25],
            baseValue: 15,
            scale: 0.3,
            envelope: ADSRPresets.smooth()
        },
        hue: {
            source: 'spectralCentroid',
            curve: 'linear',
            range: [180, 280],
            baseValue: 200,
            scale: 0.5,
            envelope: null
        }
    }),

    /**
     * Intense - dramatic audio reactivity
     */
    intense: () => ({
        rot4dXW: {
            source: 'bass',
            curve: 'squared',
            range: [-3, 3],
            baseValue: 0,
            scale: 2.0,
            envelope: ADSRPresets.kick()
        },
        rot4dYW: {
            source: 'mid',
            curve: 'squared',
            range: [-3, 3],
            baseValue: 0,
            scale: 2.0,
            envelope: ADSRPresets.snare()
        },
        gridDensity: {
            source: 'spectralFlux',
            curve: 'exponential',
            range: [10, 100],
            baseValue: 20,
            scale: 2.0,
            threshold: 0.1,
            envelope: ADSRPresets.kick()
        }
    }),

    /**
     * Rhythmic - locked to beat
     */
    rhythmic: () => ({
        gridDensity: {
            source: 'spectralFlux',
            curve: 'threshold',
            range: [15, 90],
            baseValue: 15,
            scale: 1.0,
            threshold: 0.2,
            envelope: ADSRPresets.kick()
        },
        morphFactor: {
            source: 'bass',
            curve: 'threshold',
            range: [0.5, 1.8],
            baseValue: 1.0,
            scale: 1.0,
            threshold: 0.3,
            envelope: ADSRPresets.snare()
        }
    }),

    /**
     * Colorful - color follows sound
     */
    colorful: () => ({
        hue: {
            source: 'spectralCentroid',
            curve: 'linear',
            range: [0, 360],
            baseValue: 180,
            scale: 2.0,
            envelope: null
        },
        intensity: {
            source: 'rms',
            curve: 'exponential',
            range: [0.4, 1.0],
            baseValue: 0.6,
            scale: 1.5,
            envelope: ADSRPresets.hihat()
        },
        saturation: {
            source: 'spectralRolloff',
            curve: 's-curve',
            range: [0.6, 1.0],
            baseValue: 0.8,
            scale: 1.0,
            envelope: null
        }
    })
};
