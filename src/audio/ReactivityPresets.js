/**
 * ReactivityPresets - Predefined audio reactivity configurations
 *
 * Collection of tuned reactivity presets for different musical styles and effects
 *
 * A Paul Phillips Manifestation
 */

export const ReactivityPresets = {
    /**
     * Balanced - Works well for most music
     */
    balanced: {
        name: 'Balanced',
        description: 'Well-balanced reactivity for most music genres',
        mappings: {
            density: {
                bassBass: { multiplier: 40 },
                lowMidPulse: { multiplier: 15 },
                onsetSpike: { multiplier: 25 }
            },
            morph: {
                mid: { multiplier: 1.5 },
                spectralCentroid: { multiplier: 0.0002 }
            },
            chaos: {
                energy: { multiplier: 0.6 },
                highFreq: { multiplier: 0.4 },
                spectralSpread: { multiplier: 0.0001 }
            },
            speed: {
                bassBoost: { multiplier: 1.2 },
                energyDrive: { multiplier: 0.8 }
            },
            hue: {
                high: { multiplier: 200 },
                spectralCentroid: { multiplier: 0.01 },
                onsetJump: { multiplier: 100 }
            },
            rotation4D: {
                xw: {
                    lowMid: { multiplier: 0.3 },
                    bassSwing: { multiplier: 0.8 }
                },
                yw: {
                    mid: { multiplier: 0.4 },
                    spectral: { multiplier: 0.0001 }
                },
                zw: {
                    high: { multiplier: 0.6 },
                    energySpin: { multiplier: 0.5 }
                }
            }
        }
    },

    /**
     * Heavy - For bass-heavy EDM, dubstep, metal
     */
    heavy: {
        name: 'Heavy',
        description: 'Intense bass and sub-bass reactivity for heavy music',
        mappings: {
            density: {
                bassBass: { multiplier: 80 },
                lowMidPulse: { multiplier: 30 },
                onsetSpike: { multiplier: 50 }
            },
            morph: {
                mid: { multiplier: 2.5 },
                spectralCentroid: { multiplier: 0.0003 }
            },
            chaos: {
                energy: { multiplier: 1.2 },
                highFreq: { multiplier: 0.8 },
                spectralSpread: { multiplier: 0.0002 }
            },
            speed: {
                bassBoost: { multiplier: 2.0 },
                energyDrive: { multiplier: 1.5 }
            },
            hue: {
                high: { multiplier: 300 },
                spectralCentroid: { multiplier: 0.015 },
                onsetJump: { multiplier: 180 }
            },
            rotation4D: {
                xw: {
                    lowMid: { multiplier: 0.6 },
                    bassSwing: { multiplier: 1.5 }
                },
                yw: {
                    mid: { multiplier: 0.8 },
                    spectral: { multiplier: 0.0002 }
                },
                zw: {
                    high: { multiplier: 1.2 },
                    energySpin: { multiplier: 1.0 }
                }
            }
        }
    },

    /**
     * Subtle - For ambient, classical, jazz
     */
    subtle: {
        name: 'Subtle',
        description: 'Gentle, smooth reactivity for ambient and calm music',
        mappings: {
            density: {
                bassBass: { multiplier: 20 },
                lowMidPulse: { multiplier: 8 },
                onsetSpike: { multiplier: 12 }
            },
            morph: {
                mid: { multiplier: 0.8 },
                spectralCentroid: { multiplier: 0.0001 }
            },
            chaos: {
                energy: { multiplier: 0.3 },
                highFreq: { multiplier: 0.2 },
                spectralSpread: { multiplier: 0.00005 }
            },
            speed: {
                bassBoost: { multiplier: 0.6 },
                energyDrive: { multiplier: 0.4 }
            },
            hue: {
                high: { multiplier: 100 },
                spectralCentroid: { multiplier: 0.005 },
                onsetJump: { multiplier: 50 }
            },
            rotation4D: {
                xw: {
                    lowMid: { multiplier: 0.15 },
                    bassSwing: { multiplier: 0.4 }
                },
                yw: {
                    mid: { multiplier: 0.2 },
                    spectral: { multiplier: 0.00005 }
                },
                zw: {
                    high: { multiplier: 0.3 },
                    energySpin: { multiplier: 0.25 }
                }
            }
        }
    },

    /**
     * Chaotic - Maximum unpredictability and chaos
     */
    chaotic: {
        name: 'Chaotic',
        description: 'Wild, unpredictable reactivity for experimental visuals',
        mappings: {
            density: {
                bassBass: { multiplier: 60 },
                lowMidPulse: { multiplier: 40 },
                onsetSpike: { multiplier: 80 }
            },
            morph: {
                mid: { multiplier: 3.0 },
                spectralCentroid: { multiplier: 0.0005 }
            },
            chaos: {
                energy: { multiplier: 1.5 },
                highFreq: { multiplier: 1.2 },
                spectralSpread: { multiplier: 0.0003 }
            },
            speed: {
                bassBoost: { multiplier: 1.8 },
                energyDrive: { multiplier: 1.4 }
            },
            hue: {
                high: { multiplier: 400 },
                spectralCentroid: { multiplier: 0.02 },
                onsetJump: { multiplier: 240 }
            },
            rotation4D: {
                xw: {
                    lowMid: { multiplier: 0.8 },
                    bassSwing: { multiplier: 2.0 }
                },
                yw: {
                    mid: { multiplier: 1.0 },
                    spectral: { multiplier: 0.0003 }
                },
                zw: {
                    high: { multiplier: 1.5 },
                    energySpin: { multiplier: 1.2 }
                }
            }
        }
    },

    /**
     * Smooth - Minimal sudden changes, flowing motion
     */
    smooth: {
        name: 'Smooth',
        description: 'Slow, flowing reactivity with minimal abrupt changes',
        mappings: {
            density: {
                bassBass: { multiplier: 25 },
                lowMidPulse: { multiplier: 10 },
                onsetSpike: { multiplier: 15 }
            },
            morph: {
                mid: { multiplier: 1.0 },
                spectralCentroid: { multiplier: 0.00015 }
            },
            chaos: {
                energy: { multiplier: 0.4 },
                highFreq: { multiplier: 0.25 },
                spectralSpread: { multiplier: 0.00008 }
            },
            speed: {
                bassBoost: { multiplier: 0.8 },
                energyDrive: { multiplier: 0.6 }
            },
            hue: {
                high: { multiplier: 80 },
                spectralCentroid: { multiplier: 0.008 },
                onsetJump: { multiplier: 40 }
            },
            rotation4D: {
                xw: {
                    lowMid: { multiplier: 0.2 },
                    bassSwing: { multiplier: 0.5 }
                },
                yw: {
                    mid: { multiplier: 0.25 },
                    spectral: { multiplier: 0.00008 }
                },
                zw: {
                    high: { multiplier: 0.35 },
                    energySpin: { multiplier: 0.3 }
                }
            }
        }
    },

    /**
     * Explosive - Maximum impact on peaks and drops
     */
    explosive: {
        name: 'Explosive',
        description: 'Extreme reactivity on bass drops and peaks',
        mappings: {
            density: {
                bassBass: { multiplier: 100 },
                lowMidPulse: { multiplier: 50 },
                onsetSpike: { multiplier: 100 }
            },
            morph: {
                mid: { multiplier: 3.5 },
                spectralCentroid: { multiplier: 0.0004 }
            },
            chaos: {
                energy: { multiplier: 1.8 },
                highFreq: { multiplier: 1.5 },
                spectralSpread: { multiplier: 0.0004 }
            },
            speed: {
                bassBoost: { multiplier: 2.5 },
                energyDrive: { multiplier: 2.0 }
            },
            hue: {
                high: { multiplier: 500 },
                spectralCentroid: { multiplier: 0.025 },
                onsetJump: { multiplier: 300 }
            },
            rotation4D: {
                xw: {
                    lowMid: { multiplier: 1.0 },
                    bassSwing: { multiplier: 2.5 }
                },
                yw: {
                    mid: { multiplier: 1.2 },
                    spectral: { multiplier: 0.0004 }
                },
                zw: {
                    high: { multiplier: 2.0 },
                    energySpin: { multiplier: 1.5 }
                }
            }
        }
    }
};

/**
 * Apply preset to AudioReactivityEngine
 */
export function applyPreset(reactivityEngine, presetName) {
    const preset = ReactivityPresets[presetName];
    if (!preset) {
        console.warn(`⚠️ Unknown preset: ${presetName}`);
        return false;
    }

    console.log(`🎨 Applying preset: ${preset.name}`);

    // Deep merge preset mappings into engine
    Object.keys(preset.mappings).forEach(category => {
        Object.keys(preset.mappings[category]).forEach(param => {
            Object.keys(preset.mappings[category][param]).forEach(key => {
                const value = preset.mappings[category][param][key];
                Object.keys(value).forEach(prop => {
                    if (reactivityEngine.mappings[category] &&
                        reactivityEngine.mappings[category][param] &&
                        reactivityEngine.mappings[category][param][key]) {
                        reactivityEngine.mappings[category][param][key][prop] = value[prop];
                    }
                });
            });
        });
    });

    return true;
}

/**
 * Get list of available preset names
 */
export function getPresetNames() {
    return Object.keys(ReactivityPresets);
}
