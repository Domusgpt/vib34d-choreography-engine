/**
 * VIB34D Quantum Holographic Visualizer
 * Enhanced WebGL renderer with complex 3D lattice functions and holographic effects
 * This is the superior system with volumetric lighting, particles, and RGB glitch effects
 */

import { GeometryLibrary } from '../../geometry/GeometryLibrary.js';

export class QuantumHolographicVisualizer {
    constructor(canvasId, role, reactivity, variant) {
        this.canvas = document.getElementById(canvasId);
        this.role = role;
        this.reactivity = reactivity;
        this.variant = variant;
        
        // CRITICAL FIX: Define contextOptions as instance property to match SmartCanvasPool
        this.contextOptions = {
            alpha: true,
            depth: true,
            stencil: false,
            antialias: false,  // Disable antialiasing on mobile for performance
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance',
            failIfMajorPerformanceCaveat: false  // Don't fail on mobile
        };
        
        // CRITICAL FIX: Don't create context here - let SmartCanvasPool handle it
        // Try WebGL2 first (better mobile support), then WebGL1
        this.gl = this.canvas.getContext('webgl2', this.contextOptions) || 
                  this.canvas.getContext('webgl', this.contextOptions) ||
                  this.canvas.getContext('experimental-webgl', this.contextOptions);
        
        if (!this.gl) {
            console.error(`WebGL not supported for ${canvasId}`);
            if (window.mobileDebug) {
                window.mobileDebug.log(`❌ ${canvasId}: WebGL context creation failed`);
            }
            // Show user-friendly error instead of white screen
            this.showWebGLError();
            return;
        } else {
            if (window.mobileDebug) {
                const version = this.gl.getParameter(this.gl.VERSION);
                window.mobileDebug.log(`✅ ${canvasId}: WebGL context created - ${version}`);
            }
        }
        
        this.mouseX = 0.5;
        this.mouseY = 0.5;
        this.mouseIntensity = 0.0;
        this.clickIntensity = 0.0;
        this.startTime = Date.now();
        
        // Default parameters
        this.params = {
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
            rot4dZW: 0.0,
            colorStyle: 0,
            colorProfile: 0,
            colorVibrance: 1.0,
            glitchMoire: 0.0
        };

        this.audioChoreo = {
            bass: 0,
            mid: 0,
            high: 0,
            energy: 0,
            onset: 0,
            swing: 0,
            triplet: 0,
            beatPhase: 0,
            measurePhase: 0,
            colorOrbit: 0,
            colorBeat: 0,
            saturationPulse: 0,
            dimensionShift: 0,
            intensityExponent: 1,
            chaos: 0,
            velocity: 0
        };

        this.cameraLighting = {
            orbit: 0,
            elevation: 0.32,
            dolly: -0.2,
            roll: 0,
            exposure: 1.2,
            shutter: 0.6,
            bloom: 0.35,
            keyLight: 0.6,
            rimLight: 0.4,
            ambientLight: 0.25,
            vignette: 0.25,
            parallax: 0.0,
            focus: 0.8,
            focusSpread: 0.65,
            chromaticAberration: 0.12,
            lightTemperature: 0.5,
            shadowContrast: 0.45,
            fogDensity: 0.1,
            godrayIntensity: 0.2,
            filmGrain: 0.18,
            lensDistortion: 0.06,
            frameBlend: 0.28,
            lightWrap: 0.32,
            colorBleed: 0.26
        };
        
        this.init();
    }

    setCameraLighting(state = {}) {
        if (!state || typeof state !== 'object') {
            return;
        }

        this.cameraLighting = {
            ...this.cameraLighting,
            ...state
        };
    }
    
    /**
     * CRITICAL FIX: Ensure canvas is properly sized before creating WebGL context
     */
    async ensureCanvasSizedThenInitWebGL() {
        // Set proper canvas dimensions for mobile - with fallbacks
        let rect = this.canvas.getBoundingClientRect();
        const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
        
        // If canvas has no dimensions, wait for layout or use viewport
        if (rect.width === 0 || rect.height === 0) {
            // Wait for layout with promise
            await new Promise(resolve => {
                setTimeout(() => {
                    rect = this.canvas.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) {
                        // Use viewport dimensions as fallback
                        const viewWidth = window.innerWidth;
                        const viewHeight = window.innerHeight;
                        this.canvas.width = viewWidth * devicePixelRatio;
                        this.canvas.height = viewHeight * devicePixelRatio;
                        
                        if (window.mobileDebug) {
                            window.mobileDebug.log(`📐 Quantum Canvas ${this.canvas.id}: Using viewport fallback ${this.canvas.width}x${this.canvas.height}`);
                        }
                    } else {
                        this.canvas.width = rect.width * devicePixelRatio;
                        this.canvas.height = rect.height * devicePixelRatio;
                        
                        if (window.mobileDebug) {
                            window.mobileDebug.log(`📐 Quantum Canvas ${this.canvas.id}: Layout ready ${this.canvas.width}x${this.canvas.height}`);
                        }
                    }
                    resolve();
                }, 100);
            });
        } else {
            this.canvas.width = rect.width * devicePixelRatio;
            this.canvas.height = rect.height * devicePixelRatio;
            
            if (window.mobileDebug) {
                window.mobileDebug.log(`📐 Quantum Canvas ${this.canvas.id}: ${this.canvas.width}x${this.canvas.height} (DPR: ${devicePixelRatio})`);
            }
        }
        
        // NOW create WebGL context with properly sized canvas
        this.createWebGLContext();
        
        // Initialize rendering pipeline
        if (this.gl) {
            this.init();
        }
    }
    
    /**
     * Create WebGL context after canvas is properly sized
     */
    createWebGLContext() {
        // CRITICAL FIX: Check if context already exists from SmartCanvasPool
        let existingContext = this.canvas.getContext('webgl2') || 
                             this.canvas.getContext('webgl') || 
                             this.canvas.getContext('experimental-webgl');
        
        if (existingContext && !existingContext.isContextLost()) {
            console.log(`🔄 Reusing existing WebGL context for ${this.canvas.id}`);
            this.gl = existingContext;
            return;
        }
        
        // Try WebGL2 first (better mobile support), then WebGL1
        this.gl = this.canvas.getContext('webgl2', this.contextOptions) || 
                  this.canvas.getContext('webgl', this.contextOptions) ||
                  this.canvas.getContext('experimental-webgl', this.contextOptions);
        
        if (!this.gl) {
            console.error(`WebGL not supported for ${this.canvas.id}`);
            if (window.mobileDebug) {
                window.mobileDebug.log(`❌ Quantum ${this.canvas.id}: WebGL context creation failed (size: ${this.canvas.width}x${this.canvas.height})`);
            }
            // Show user-friendly error instead of white screen
            this.showWebGLError();
            return;
        } else {
            if (window.mobileDebug) {
                const version = this.gl.getParameter(this.gl.VERSION);
                window.mobileDebug.log(`✅ Quantum ${this.canvas.id}: WebGL context created - ${version} (size: ${this.canvas.width}x${this.canvas.height})`);
            }
        }
    }

    /**
     * Initialize WebGL rendering pipeline
     */
    init() {
        this.initShaders();
        this.initBuffers();

        // CRITICAL FIX: Enable alpha blending for transparency
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.resize();
    }
    
    /**
     * Reinitialize WebGL context and resources after SmartCanvasPool context recreation
     */
    reinitializeContext() {
        console.log(`🔄 Reinitializing WebGL context for ${this.canvas.id}`);
        
        // CRITICAL FIX: Clear old WebGL references first
        this.program = null;
        this.buffer = null;
        this.uniforms = null;
        this.gl = null;
        
        // CRITICAL FIX: Don't create new context - SmartCanvasPool already did this
        // Just get the existing context that SmartCanvasPool created
        this.gl = this.canvas.getContext('webgl2') || 
                  this.canvas.getContext('webgl') ||
                  this.canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            console.error(`❌ No WebGL context available for ${this.canvas.id} - SmartCanvasPool should have created one`);
            return false;
        }
        
        if (this.gl.isContextLost()) {
            console.error(`❌ WebGL context is lost for ${this.canvas.id}`);
            return false;
        }
        
        // Reinitialize all WebGL resources with the existing context
        try {
            this.initShaders();
            this.initBuffers();
            this.resize();
            
            console.log(`✅ WebGL context reinitialized for ${this.canvas.id}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to reinitialize WebGL resources for ${this.canvas.id}:`, error);
            return false;
        }
    }
    
    /**
     * Initialize shaders with complex 3D lattice functions and holographic effects
     */
    initShaders() {
        const vertexShaderSource = `attribute vec2 a_position;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;
        
        // Mobile-friendly precision - try highp, fallback to mediump
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const precision = isMobile ? 'mediump' : 'highp';
        
        const fragmentShaderSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_geometry;
uniform float u_gridDensity;
uniform float u_morphFactor;
uniform float u_chaos;
uniform float u_speed;
uniform float u_hue;
uniform float u_intensity;
uniform float u_saturation;
uniform float u_dimension;
uniform float u_rot4dXW;
uniform float u_rot4dYW;
uniform float u_rot4dZW;
uniform float u_colorProfile;
uniform float u_colorStyle;
uniform float u_colorVibrance;
uniform float u_glitchMoire;
uniform float u_mouseIntensity;
uniform float u_clickIntensity;
uniform float u_roleIntensity;
uniform float u_audioBass;
uniform float u_audioMid;
uniform float u_audioHigh;
uniform float u_audioEnergy;
uniform float u_audioOnset;
uniform float u_audioSwing;
uniform float u_audioTriplet;
uniform float u_audioBeatPhase;
uniform float u_audioMeasurePhase;
uniform float u_audioColorOrbit;
uniform float u_audioColorBeat;
uniform float u_audioSaturationPulse;
uniform float u_audioDimensionShift;
uniform float u_universeModifier;
uniform float u_audioChaos;
uniform float u_audioVelocity;
uniform float u_cameraOrbit;
uniform float u_cameraElevation;
uniform float u_cameraDolly;
uniform float u_cameraRoll;
uniform float u_exposure;
uniform float u_shutter;
uniform float u_bloom;
uniform float u_keyLight;
uniform float u_rimLight;
uniform float u_ambientLight;
uniform float u_vignette;
uniform float u_cameraParallax;
uniform float u_focusDistance;
uniform float u_focusSpread;
uniform float u_chromaticAberration;
uniform float u_lightTemperature;
uniform float u_shadowContrast;
uniform float u_fogDensity;
uniform float u_godrayIntensity;
uniform float u_filmGrain;
uniform float u_lensDistortion;
uniform float u_frameBlend;
uniform float u_lightWrap;
uniform float u_colorBleed;

// 4D rotation matrices
mat4 rotateXW(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat4(c, 0.0, 0.0, -s, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, s, 0.0, 0.0, c);
}

mat4 rotateYW(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat4(1.0, 0.0, 0.0, 0.0, 0.0, c, 0.0, -s, 0.0, 0.0, 1.0, 0.0, 0.0, s, 0.0, c);
}

mat4 rotateZW(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat4(1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, c, -s, 0.0, 0.0, s, c);
}

float fastTanh(float x) {
    float clamped = clamp(x, -10.0, 10.0);
    float e2x = exp(2.0 * clamped);
    return (e2x - 1.0) / (e2x + 1.0);
}

vec3 project4Dto3D(vec4 p) {
    float w = 2.5 / (2.5 + p.w);
    return vec3(p.x * w, p.y * w, p.z * w);
}

// Complex 3D Lattice Functions - Superior Quantum Shaders
float tetrahedronLattice(vec3 p, float gridSize) {
    float swing = 0.5 + 0.5 * fastTanh(u_audioSwing);
    float dynamicGrid = gridSize * (0.9 + u_audioBass * 0.7 + swing * 0.4);
    vec3 q = fract(p * dynamicGrid) - 0.5;

    vec3 harmonicShift = vec3(
        sin(q.y * 6.0 + u_time * 0.001 + u_audioColorOrbit * 6.28318),
        sin(q.z * 6.0 + u_time * 0.0012 + u_audioBeatPhase * 6.28318),
        sin(q.x * 6.0 + u_time * 0.0008 + u_audioTriplet * 3.14159)
    ) * (0.05 + u_audioChaos * 0.08);

    q += harmonicShift;

    float d1 = length(q);
    float d2 = length(q - vec3(0.4, 0.0, 0.0));
    float d3 = length(q - vec3(0.0, 0.4, 0.0));
    float d4 = length(q - vec3(0.0, 0.0, 0.4));
    float vertices = 1.0 - smoothstep(0.0, 0.04 + u_audioMid * 0.02, min(min(d1, d2), min(d3, d4)));

    float edgeWidth = 0.02 + u_audioEnergy * 0.02;
    float edges = 0.0;
    edges = max(edges, 1.0 - smoothstep(0.0, edgeWidth, abs(length(q.xy) - (0.2 + u_audioBass * 0.1))));
    edges = max(edges, 1.0 - smoothstep(0.0, edgeWidth, abs(length(q.yz) - (0.2 + u_audioMid * 0.08))));
    edges = max(edges, 1.0 - smoothstep(0.0, edgeWidth, abs(length(q.xz) - (0.2 + u_audioHigh * 0.06))));

    float interference = sin(d1 * 25.0 + u_time * 0.003 + u_audioColorOrbit * 6.28318) *
                         sin(d2 * 22.0 + u_time * 0.0025 + u_audioTriplet * 6.28318) *
                         (0.05 + u_audioChaos * 0.3);

    float volume = exp(-length(q) * (3.0 + u_audioEnergy * 2.0)) * (0.15 + u_audioOnset * 0.25);

    float base = max(vertices, edges * (0.5 + u_audioEnergy * 0.4));
    return max(0.0, base + interference + volume);
}

float hypercubeLattice(vec3 p, float gridSize) {
    float chaosPulse = 0.5 + 0.5 * sin(u_audioBeatPhase * 6.28318 + u_audioTriplet * 3.14159);
    float dynamicGrid = gridSize * (1.0 + u_audioBass * 0.5 + u_audioEnergy * 0.3 + chaosPulse * 0.2);
    vec3 grid = fract(p * dynamicGrid);
    vec3 edges = min(grid, 1.0 - grid);
    float minEdge = min(min(edges.x, edges.y), edges.z);
    float lattice = 1.0 - smoothstep(0.0, 0.03 + u_audioChaos * 0.015, minEdge);

    vec3 centers = abs(grid - 0.5);
    float maxCenter = max(max(centers.x, centers.y), centers.z);
    float vertices = 1.0 - smoothstep(0.45 - u_audioMid * 0.05, 0.5 + u_audioHigh * 0.05, maxCenter);

    float crossPulse = sin((grid.x + grid.y + grid.z) * 18.0 + u_time * 0.002 + u_audioColorOrbit * 6.28318) * (0.05 + u_audioChaos * 0.2);

    return max(lattice * (0.7 + u_audioEnergy * 0.3), vertices + crossPulse);
}

float sphereLattice(vec3 p, float gridSize) {
    vec3 cell = fract(p * gridSize) - 0.5;
    float radius3D = length(cell);
    float densityFactor = max(0.1, gridSize * (0.7 + u_audioBass * 0.6));
    float dynamicShellWidth = max(0.01, 0.08 * (1.0 + u_audioMid * 1.5));
    float phase = radius3D * densityFactor * 6.28318 - u_time * u_speed * 0.8 + u_audioHigh * 3.0 + u_audioColorOrbit * 4.0;
    float shells3D = 0.5 + 0.5 * sin(phase + u_audioTriplet * 1.5);
    shells3D = smoothstep(1.0 - dynamicShellWidth, 1.0, shells3D);

    float dim_factor = smoothstep(3.0, 4.5, u_dimension + u_audioDimensionShift);
    float finalLattice = shells3D;

    if (dim_factor > 0.01) {
        float swingInfluence = 0.5 + 0.5 * sin(u_audioBeatPhase * 6.28318);
        float w_coord = cos(radius3D * 2.5 - u_time * 0.55 + u_audioOnset * 3.5) *
                        sin(cell.x * 1.0 + cell.y * 1.3 - cell.z * 0.7 + u_time * 0.2 + u_audioSwing * 1.5) *
                        dim_factor * (0.45 + u_morphFactor * 0.5 + u_audioMid * 0.5 * swingInfluence);

        vec4 p4d = vec4(cell, w_coord);
        float baseSpeed = u_speed * 0.85 + u_audioVelocity * 0.4;
        float time_rot1 = u_time * 0.38 * baseSpeed + u_audioHigh * 0.2 + u_audioColorBeat * 2.0;
        float time_rot2 = u_time * 0.31 * baseSpeed + u_morphFactor * 0.6 + u_audioSwing * 0.5;
        float time_rot3 = u_time * -0.24 * baseSpeed + u_audioBass * 0.25 + u_audioTriplet * 0.3;
        p4d = rotateXW(u_rot4dXW + time_rot1 * 1.05) * rotateYW(u_rot4dYW + time_rot2) * rotateZW(u_rot4dZW + time_rot3 * 0.95) * p4d;

        vec3 projectedP = project4Dto3D(p4d);
        float radius4D_proj = length(projectedP);
        float phase4D = radius4D_proj * densityFactor * 6.28318 - u_time * u_speed * 0.8 + u_audioHigh * 3.0 + u_audioColorOrbit * 6.0;
        float shells4D_proj = 0.5 + 0.5 * sin(phase4D);
        shells4D_proj = smoothstep(1.0 - dynamicShellWidth, 1.0, shells4D_proj);
        float morphBlend = smoothstep(0.0, 1.0, u_morphFactor + u_audioDimensionShift * 0.5);
        finalLattice = mix(shells3D, shells4D_proj, morphBlend);
    }

    return max(0.0, finalLattice);
}

float torusLattice(vec3 p, float gridSize) {
    vec3 cell = fract(p * gridSize) - 0.5;
    float majorRadius = 0.3;
    float minorRadius = 0.1;
    
    float toroidalDist = length(vec2(length(cell.xy) - majorRadius, cell.z));
    float torus = 1.0 - smoothstep(minorRadius - 0.02, minorRadius + 0.02, toroidalDist);
    
    float rings = 0.0;
    float angle = atan(cell.y, cell.x);
    rings = sin(angle * 8.0) * 0.02;
    
    return max(torus, 0.0) + rings;
}

float kleinLattice(vec3 p, float gridSize) {
    vec3 cell = fract(p * gridSize) - 0.5;
    float u = atan(cell.y, cell.x) / 3.14159 + 1.0;
    float v = cell.z + 0.5;
    
    float x = (2.0 + cos(u * 0.5)) * cos(u);
    float y = (2.0 + cos(u * 0.5)) * sin(u);
    float z = sin(u * 0.5) + v;
    
    vec3 kleinPoint = vec3(x, y, z) * 0.1;
    float dist = length(cell - kleinPoint);
    
    return 1.0 - smoothstep(0.1, 0.15, dist);
}

float fractalLattice(vec3 p, float gridSize) {
    vec3 cell = fract(p * gridSize);
    cell = abs(cell * 2.0 - 1.0);
    
    float dist = length(max(abs(cell) - 0.3, 0.0));
    
    // Recursive subdivision
    for(int i = 0; i < 3; i++) {
        cell = abs(cell * 2.0 - 1.0);
        float subdist = length(max(abs(cell) - 0.3, 0.0)) / pow(2.0, float(i + 1));
        dist = min(dist, subdist);
    }
    
    return 1.0 - smoothstep(0.0, 0.05, dist);
}

float waveLattice(vec3 p, float gridSize) {
    float time = u_time * 0.001 * u_speed;
    vec3 cell = fract(p * gridSize) - 0.5;
    
    float wave1 = sin(p.x * gridSize * 2.0 + time * 2.0);
    float wave2 = sin(p.y * gridSize * 1.8 + time * 1.5);
    float wave3 = sin(p.z * gridSize * 2.2 + time * 1.8);
    
    float interference = (wave1 + wave2 + wave3) / 3.0;
    float amplitude = 1.0 - length(cell) * 2.0;
    
    return max(0.0, interference * amplitude);
}

float crystalLattice(vec3 p, float gridSize) {
    vec3 cell = fract(p * gridSize) - 0.5;

    // Octahedral crystal structure
    float crystal = max(max(abs(cell.x) + abs(cell.y), abs(cell.y) + abs(cell.z)), abs(cell.x) + abs(cell.z));
    crystal = 1.0 - smoothstep(0.3, 0.4, crystal);

    // Add crystalline faces
    float faces = 0.0;
    faces = max(faces, 1.0 - smoothstep(0.0, 0.02, abs(abs(cell.x) - 0.35)));
    faces = max(faces, 1.0 - smoothstep(0.0, 0.02, abs(abs(cell.y) - 0.35)));
    faces = max(faces, 1.0 - smoothstep(0.0, 0.02, abs(abs(cell.z) - 0.35)));

    return max(crystal, faces * 0.5);
}

float applyUniverseDynamics(float lattice) {
    return pow(max(0.0, lattice), max(0.1, u_universeModifier));
}

// Enhanced geometry function with holographic effects
float geometryFunction(vec4 p) {
    int geomType = int(u_geometry);
    vec3 p3d = project4Dto3D(p);
    float gridSize = u_gridDensity * 0.08;

    if (geomType == 0) {
        return applyUniverseDynamics(tetrahedronLattice(p3d, gridSize)) * u_morphFactor;
    }
    else if (geomType == 1) {
        return applyUniverseDynamics(hypercubeLattice(p3d, gridSize)) * u_morphFactor;
    }
    else if (geomType == 2) {
        return applyUniverseDynamics(sphereLattice(p3d, gridSize)) * u_morphFactor;
    }
    else if (geomType == 3) {
        return applyUniverseDynamics(torusLattice(p3d, gridSize)) * u_morphFactor;
    }
    else if (geomType == 4) {
        return applyUniverseDynamics(kleinLattice(p3d, gridSize)) * u_morphFactor;
    }
    else if (geomType == 5) {
        return applyUniverseDynamics(fractalLattice(p3d, gridSize)) * u_morphFactor;
    }
    else if (geomType == 6) {
        return applyUniverseDynamics(waveLattice(p3d, gridSize)) * u_morphFactor;
    }
    else if (geomType == 7) {
        return applyUniverseDynamics(crystalLattice(p3d, gridSize)) * u_morphFactor;
    }
    else {
        return applyUniverseDynamics(hypercubeLattice(p3d, gridSize)) * u_morphFactor;
    }
}

// EXTREME LAYER-BY-LAYER COLOR SYSTEM
// Each canvas layer gets completely different color behavior

vec3 getUniformBaseColor(int profile) {
    if (profile == 1) {
        return vec3(0.08, 0.26, 0.35);
    } else if (profile == 2) {
        return vec3(0.42, 0.18, 0.06);
    } else if (profile == 3) {
        return vec3(0.14, 0.10, 0.26);
    } else if (profile == 4) {
        return vec3(0.32, 0.09, 0.28);
    } else if (profile == 5) {
        return vec3(0.20, 0.20, 0.22);
    } else if (profile == 6) {
        return vec3(0.34, 0.20, 0.10);
    } else if (profile == 7) {
        return vec3(0.05, 0.30, 0.24);
    } else if (profile == 8) {
        return vec3(0.20, 0.10, 0.28);
    } else if (profile == 9) {
        return vec3(0.12, 0.22, 0.32);
    }
    // Legacy hypercolor base
    return vec3(0.22, 0.12, 0.34);
}

vec3 getUniformPalette(int layerIndex, float t, int profile, float vib, float saturationPulse, float energyFlash) {
    vec3 base = clamp(getUniformBaseColor(profile), 0.02, 0.9);
    float beatPulse = sin(u_audioBeatPhase * 6.28318 + float(layerIndex) * 0.9) * 0.5 + 0.5;
    float timePulse = sin(t * (1.35 + float(layerIndex) * 0.32)) * 0.5 + 0.5;
    float combined = clamp((timePulse * 0.6 + beatPulse * 0.4) + energyFlash * 0.35, 0.0, 1.0);

    float layerTone = clamp(0.35 + float(layerIndex) * 0.08, 0.2, 0.8);
    vec3 shadow = clamp(base * (0.38 + layerTone), 0.0, 1.0);
    vec3 highlight = clamp(base + vec3(0.24 + vib * 0.12) + base * (0.55 + vib * 0.28), 0.0, 1.0);
    vec3 mid = mix(shadow, highlight, combined);

    float orbitBlend = clamp(u_audioColorOrbit * 0.45 + saturationPulse * 0.2, 0.0, 1.0);
    vec3 orbitTint = clamp(vec3(base.z, base.x, base.y) * (0.45 + float(layerIndex) * 0.12), 0.0, 1.0);
    vec3 tinted = mix(mid, orbitTint, orbitBlend * 0.35);

    float saturationControl = clamp(0.55 + saturationPulse * 0.35 + (vib - 1.0) * 0.22, 0.35, 1.0);
    vec3 neutral = vec3(dot(tinted, vec3(0.299, 0.587, 0.114)));
    vec3 saturated = mix(neutral, tinted, saturationControl);

    float energyBoost = clamp(energyFlash * 0.25 + u_audioColorBeat * 0.3, 0.0, 0.55);
    vec3 boosted = clamp(saturated + energyBoost, 0.0, 1.0);
    float brightnessLift = clamp(0.68 + vib * 0.22 + energyFlash * 0.18, 0.45, 1.35);
    return clamp(boosted * brightnessLift, 0.0, 1.0);
}

// Layer-specific color palettes with extreme juxtapositions
vec3 getLayerColorPalette(int layerIndex, float t) {
    float orbitShift = u_audioColorOrbit * 6.28318;
    float rhythmDrift = sin(u_audioBeatPhase * 6.28318 + float(layerIndex) * 1.3) * 0.2;
    float measureDrift = sin(u_audioMeasurePhase * 6.28318 + float(layerIndex) * 0.7) * 0.15;
    float saturationPulse = clamp(u_audioSaturationPulse, 0.0, 1.0);
    float energyFlash = clamp(u_audioEnergy + u_audioOnset * 0.6, 0.0, 1.5);
    t += orbitShift + rhythmDrift + measureDrift;

    int profile = int(floor(u_colorProfile + 0.5));
    float vib = clamp(u_colorVibrance, 0.2, 2.5);
    int style = int(floor(u_colorStyle + 0.5));

    if (style == 1) {
        return getUniformPalette(layerIndex, t, profile, vib, saturationPulse, energyFlash);
    }

    vec3 palette;
    vec3 color1;
    vec3 color2;
    vec3 color3;
    if (layerIndex == 0) {
        if (profile == 1) {
            color1 = vec3(0.0, 0.08, 0.1);
            color2 = vec3(0.0, 0.2, 0.25);
            color3 = vec3(0.05, 0.4, 0.45);
        } else if (profile == 2) {
            color1 = vec3(0.2, 0.03, 0.0);
            color2 = vec3(0.4, 0.08, 0.0);
            color3 = vec3(0.1, 0.0, 0.0);
        } else if (profile == 3) {
            color1 = vec3(0.0, 0.0, 0.12);
            color2 = vec3(0.02, 0.0, 0.2);
            color3 = vec3(0.0, 0.1, 0.25);
        } else if (profile == 4) {
            color1 = vec3(0.06, 0.0, 0.12);
            color2 = vec3(0.0, 0.05, 0.18);
            color3 = vec3(0.08, 0.02, 0.22);
        } else if (profile == 5) {
            color1 = vec3(0.1, 0.1, 0.1);
            color2 = vec3(0.05, 0.05, 0.05);
            color3 = vec3(0.18, 0.18, 0.18);
        } else if (profile == 6) {
            color1 = vec3(0.08, 0.02, 0.01);
            color2 = vec3(0.18, 0.08, 0.03);
            color3 = vec3(0.02, 0.16, 0.18);
        } else if (profile == 7) {
            color1 = vec3(0.0, 0.04, 0.12);
            color2 = vec3(0.0, 0.12, 0.2);
            color3 = vec3(0.0, 0.24, 0.2);
        } else if (profile == 8) {
            color1 = vec3(0.05, 0.0, 0.1);
            color2 = vec3(0.1, 0.0, 0.2);
            color3 = vec3(0.02, 0.08, 0.25);
        } else if (profile == 9) {
            color1 = vec3(0.02, 0.08, 0.12);
            color2 = vec3(0.05, 0.12, 0.28);
            color3 = vec3(0.12, 0.2, 0.35);
        } else {
            color1 = vec3(0.05, 0.0, 0.2);
            color2 = vec3(0.0, 0.0, 0.1);
            color3 = vec3(0.0, 0.05, 0.3);
        }
        palette = mix(mix(color1, color2, sin(t * 3.0) * 0.5 + 0.5), color3, cos(t * 2.0) * 0.5 + 0.5);
    }
    else if (layerIndex == 1) {
        if (profile == 1) {
            color1 = vec3(0.0, 0.6, 0.2);
            color2 = vec3(0.2, 0.8, 0.4);
            color3 = vec3(0.0, 0.4, 0.5);
        } else if (profile == 2) {
            color1 = vec3(0.6, 0.2, 0.0);
            color2 = vec3(0.8, 0.4, 0.0);
            color3 = vec3(0.5, 0.1, 0.0);
        } else if (profile == 3) {
            color1 = vec3(0.0, 0.2, 0.4);
            color2 = vec3(0.1, 0.3, 0.6);
            color3 = vec3(0.0, 0.25, 0.7);
        } else if (profile == 4) {
            color1 = vec3(0.8, 0.0, 0.6);
            color2 = vec3(0.0, 0.8, 0.6);
            color3 = vec3(0.0, 0.4, 0.9);
        } else if (profile == 5) {
            color1 = vec3(0.2, 0.2, 0.2);
            color2 = vec3(0.35, 0.35, 0.35);
            color3 = vec3(0.15, 0.15, 0.15);
        } else if (profile == 6) {
            color1 = vec3(0.45, 0.20, 0.02);
            color2 = vec3(0.72, 0.38, 0.08);
            color3 = vec3(0.20, 0.45, 0.35);
        } else if (profile == 7) {
            color1 = vec3(0.0, 0.4, 0.24);
            color2 = vec3(0.0, 0.65, 0.5);
            color3 = vec3(0.2, 0.9, 0.7);
        } else if (profile == 8) {
            color1 = vec3(0.0, 0.3, 0.6);
            color2 = vec3(0.0, 0.6, 0.9);
            color3 = vec3(0.2, 0.9, 1.0);
        } else if (profile == 9) {
            color1 = vec3(0.0, 0.5, 0.6);
            color2 = vec3(0.3, 0.7, 0.9);
            color3 = vec3(0.6, 0.4, 0.9);
        } else {
            color1 = vec3(0.0, 1.0, 0.0);
            color2 = vec3(0.8, 1.0, 0.0);
            color3 = vec3(0.0, 0.8, 0.3);
        }
        palette = mix(mix(color1, color2, sin(t * 7.0) * 0.5 + 0.5), color3, cos(t * 5.0) * 0.5 + 0.5);
    }
    else if (layerIndex == 2) {
        if (profile == 1) {
            color1 = vec3(0.0, 0.7, 0.8);
            color2 = vec3(0.0, 0.9, 0.6);
            color3 = vec3(0.8, 1.0, 0.9);
        } else if (profile == 2) {
            color1 = vec3(1.0, 0.2, 0.0);
            color2 = vec3(1.0, 0.5, 0.0);
            color3 = vec3(1.0, 0.8, 0.5);
        } else if (profile == 3) {
            color1 = vec3(0.2, 0.3, 1.0);
            color2 = vec3(0.4, 0.6, 1.0);
            color3 = vec3(0.8, 0.9, 1.0);
        } else if (profile == 4) {
            color1 = vec3(1.0, 0.0, 0.6);
            color2 = vec3(0.0, 1.0, 0.7);
            color3 = vec3(0.4, 0.6, 1.0);
        } else if (profile == 5) {
            color1 = vec3(0.4, 0.4, 0.4);
            color2 = vec3(0.7, 0.7, 0.7);
            color3 = vec3(1.0, 1.0, 1.0);
        } else if (profile == 6) {
            color1 = vec3(0.85, 0.45, 0.08);
            color2 = vec3(1.0, 0.7, 0.2);
            color3 = vec3(0.3, 0.7, 0.6);
        } else if (profile == 7) {
            color1 = vec3(0.0, 0.45, 0.6);
            color2 = vec3(0.0, 0.7, 0.9);
            color3 = vec3(0.3, 0.9, 1.0);
        } else if (profile == 8) {
            color1 = vec3(0.8, 0.1, 0.5);
            color2 = vec3(0.9, 0.2, 0.7);
            color3 = vec3(1.0, 0.4, 0.9);
        } else if (profile == 9) {
            color1 = vec3(0.2, 0.7, 0.8);
            color2 = vec3(0.5, 0.9, 1.0);
            color3 = vec3(0.8, 0.7, 1.0);
        } else {
            color1 = vec3(1.0, 0.0, 0.0);
            color2 = vec3(1.0, 0.5, 0.0);
            color3 = vec3(1.0, 1.0, 1.0);
        }
        palette = mix(mix(color1, color2, sin(t * 11.0) * 0.5 + 0.5), color3, cos(t * 8.0) * 0.5 + 0.5);
    }
    else if (layerIndex == 3) {
        if (profile == 1) {
            color1 = vec3(0.0, 0.9, 0.9);
            color2 = vec3(0.2, 0.6, 1.0);
            color3 = vec3(0.4, 1.0, 0.8);
        } else if (profile == 2) {
            color1 = vec3(1.0, 0.4, 0.0);
            color2 = vec3(1.0, 0.7, 0.2);
            color3 = vec3(1.0, 0.9, 0.5);
        } else if (profile == 3) {
            color1 = vec3(0.3, 0.5, 1.0);
            color2 = vec3(0.5, 0.3, 1.0);
            color3 = vec3(0.6, 0.8, 1.0);
        } else if (profile == 4) {
            color1 = vec3(1.0, 0.0, 0.9);
            color2 = vec3(0.0, 0.9, 1.0);
            color3 = vec3(0.9, 1.0, 0.0);
        } else if (profile == 5) {
            color1 = vec3(0.65, 0.65, 0.65);
            color2 = vec3(0.85, 0.85, 0.85);
            color3 = vec3(0.95, 0.95, 0.95);
        } else if (profile == 6) {
            color1 = vec3(1.0, 0.6, 0.2);
            color2 = vec3(0.1, 0.7, 0.6);
            color3 = vec3(0.35, 0.45, 0.8);
        } else if (profile == 7) {
            color1 = vec3(0.1, 0.5, 0.8);
            color2 = vec3(0.3, 0.8, 0.9);
            color3 = vec3(0.6, 1.0, 0.9);
        } else if (profile == 8) {
            color1 = vec3(0.4, 0.0, 0.6);
            color2 = vec3(0.0, 0.8, 0.9);
            color3 = vec3(0.9, 0.1, 0.6);
        } else if (profile == 9) {
            color1 = vec3(0.3, 0.6, 1.0);
            color2 = vec3(0.7, 0.5, 1.0);
            color3 = vec3(0.9, 0.8, 1.0);
        } else {
            color1 = vec3(0.0, 1.0, 1.0);
            color2 = vec3(0.0, 0.5, 1.0);
            color3 = vec3(0.5, 1.0, 1.0);
        }
        palette = mix(mix(color1, color2, sin(t * 13.0) * 0.5 + 0.5), color3, cos(t * 9.0) * 0.5 + 0.5);
    }
    else {
        if (profile == 1) {
            color1 = vec3(0.2, 1.0, 0.8);
            color2 = vec3(0.4, 0.8, 1.0);
            color3 = vec3(0.8, 0.6, 1.0);
        } else if (profile == 2) {
            color1 = vec3(1.0, 0.3, 0.1);
            color2 = vec3(1.0, 0.6, 0.0);
            color3 = vec3(1.0, 0.9, 0.3);
        } else if (profile == 3) {
            color1 = vec3(0.4, 0.4, 1.0);
            color2 = vec3(0.7, 0.3, 1.0);
            color3 = vec3(0.6, 0.6, 1.0);
        } else if (profile == 4) {
            color1 = vec3(1.0, 0.0, 0.4);
            color2 = vec3(0.0, 0.8, 1.0);
            color3 = vec3(0.6, 0.0, 1.0);
        } else if (profile == 5) {
            color1 = vec3(0.5, 0.5, 0.5);
            color2 = vec3(0.75, 0.75, 0.75);
            color3 = vec3(0.35, 0.35, 0.35);
        } else if (profile == 6) {
            color1 = vec3(0.9, 0.5, 0.15);
            color2 = vec3(0.3, 0.75, 0.65);
            color3 = vec3(0.12, 0.2, 0.45);
        } else if (profile == 7) {
            color1 = vec3(0.0, 0.6, 0.8);
            color2 = vec3(0.2, 0.9, 0.8);
            color3 = vec3(0.5, 1.0, 0.8);
        } else if (profile == 8) {
            color1 = vec3(0.1, 0.0, 0.25);
            color2 = vec3(0.0, 0.7, 0.8);
            color3 = vec3(0.9, 0.2, 0.7);
        } else if (profile == 9) {
            color1 = vec3(0.1, 0.5, 0.8);
            color2 = vec3(0.5, 0.8, 1.0);
            color3 = vec3(0.9, 0.9, 1.0);
        } else {
            color1 = vec3(1.0, 0.0, 1.0);
            color2 = vec3(0.8, 0.0, 1.0);
            color3 = vec3(1.0, 0.3, 1.0);
        }
        palette = mix(mix(color1, color2, sin(t * 17.0) * 0.5 + 0.5), color3, cos(t * 12.0) * 0.5 + 0.5);
    }

    palette = clamp(palette * (0.8 + vib * 0.6), 0.0, 2.5);
    palette = mix(palette, vec3(1.0), u_audioColorBeat * 0.25);
    palette *= 0.7 + energyFlash * 0.3;
    palette = mix(vec3(0.0), palette, 0.4 + saturationPulse * 0.6);
    return palette;
}

// Extreme RGB separation and distortion for each layer
vec3 extremeRGBSeparation(vec3 baseColor, vec2 uv, float intensity, int layerIndex) {
    vec2 offset = vec2(0.01, 0.005) * intensity;
    
    // Different separation patterns per layer
    if (layerIndex == 0) {
        // Background: Minimal separation, smooth
        return baseColor + vec3(
            sin(uv.x * 10.0 + u_time * 0.001) * 0.02,
            cos(uv.y * 8.0 + u_time * 0.0015) * 0.02,
            sin(uv.x * uv.y * 6.0 + u_time * 0.0008) * 0.02
        ) * intensity;
    }
    else if (layerIndex == 1) {
        // Shadow: Heavy vertical separation
        float r = baseColor.r + sin(uv.y * 50.0 + u_time * 0.003) * intensity * 0.15;
        float g = baseColor.g + sin((uv.y + 0.1) * 45.0 + u_time * 0.0025) * intensity * 0.12;
        float b = baseColor.b + sin((uv.y - 0.1) * 55.0 + u_time * 0.0035) * intensity * 0.18;
        return vec3(r, g, b);
    }
    else if (layerIndex == 2) {
        // Content: Explosive radial separation
        float dist = length(uv);
        float angle = atan(uv.y, uv.x);
        float r = baseColor.r + sin(dist * 30.0 + angle * 10.0 + u_time * 0.004) * intensity * 0.2;
        float g = baseColor.g + cos(dist * 25.0 + angle * 8.0 + u_time * 0.0035) * intensity * 0.18;
        float b = baseColor.b + sin(dist * 35.0 + angle * 12.0 + u_time * 0.0045) * intensity * 0.22;
        return vec3(r, g, b);
    }
    else if (layerIndex == 3) {
        // Highlight: Lightning-like separation
        float lightning = sin(uv.x * 80.0 + u_time * 0.008) * cos(uv.y * 60.0 + u_time * 0.006);
        float r = baseColor.r + lightning * intensity * 0.25;
        float g = baseColor.g + sin(lightning * 40.0 + u_time * 0.005) * intensity * 0.2;
        float b = baseColor.b + cos(lightning * 30.0 + u_time * 0.007) * intensity * 0.3;
        return vec3(r, g, b);
    }
    else {
        // Accent: Chaotic multi-directional separation
        float chaos1 = sin(uv.x * 100.0 + uv.y * 80.0 + u_time * 0.01);
        float chaos2 = cos(uv.x * 70.0 - uv.y * 90.0 + u_time * 0.008);
        float chaos3 = sin(uv.x * uv.y * 150.0 + u_time * 0.012);
        return baseColor + vec3(chaos1, chaos2, chaos3) * intensity * 0.3;
    }
}

void main() {
    vec2 uv = (gl_FragCoord.xy - u_resolution.xy * 0.5) / min(u_resolution.x, u_resolution.y);

    float orbitAngle = u_cameraOrbit;
    float cosOrbit = cos(orbitAngle);
    float sinOrbit = sin(orbitAngle);
    mat2 orbitMat = mat2(cosOrbit, -sinOrbit, sinOrbit, cosOrbit);
    uv = orbitMat * uv;

    float rollAngle = u_cameraRoll;
    float cosRoll = cos(rollAngle);
    float sinRoll = sin(rollAngle);
    mat2 rollMat = mat2(cosRoll, -sinRoll, sinRoll, cosRoll);

    float zoomFactor = exp(-u_cameraDolly);
    uv *= zoomFactor;
    uv = rollMat * uv;

    float elevation = u_cameraElevation;
    uv.y += sin(elevation) * (0.4 + abs(u_cameraDolly) * 0.25);
    uv.x += sin(elevation * 0.6) * 0.15;
    
    // Enhanced 4D position with holographic depth
    float timeSpeed = u_time * 0.0001 * u_speed;
    vec4 pos = vec4(uv * 3.0, sin(timeSpeed * 3.0), cos(timeSpeed * 2.0));
    pos.xy += (u_mouse - 0.5) * u_mouseIntensity * 2.0;
    pos.xy += vec2(
        sin(u_audioBeatPhase * 6.28318 + uv.y * 4.0) * (0.5 * u_audioSwing),
        cos(u_audioBeatPhase * 6.28318 + uv.x * 4.0) * (0.5 * u_audioSwing)
    );
    pos.z += sin(u_audioTriplet * 3.14159 + timeSpeed * 4.0) * u_audioDimensionShift * 0.5;
    pos.w += cos(u_audioTriplet * 3.14159 + timeSpeed * 3.5) * u_audioDimensionShift * 0.5;
    
    // Apply 4D rotations
    pos = rotateXW(u_rot4dXW) * pos;
    pos = rotateYW(u_rot4dYW) * pos;
    pos = rotateZW(u_rot4dZW) * pos;
    
    // Calculate enhanced geometry value
    float value = geometryFunction(pos);
    
    // Enhanced chaos with holographic effects
    float noise = sin(pos.x * 7.0) * cos(pos.y * 11.0) * sin(pos.z * 13.0);
    value += noise * (u_chaos + u_audioChaos * 0.8);
    
    // Enhanced intensity calculation with holographic glow
    float geometryIntensity = 1.0 - clamp(abs(value * 0.8), 0.0, 1.0);
    geometryIntensity = pow(geometryIntensity, 1.2 + u_audioDimensionShift * 0.6); // Dynamic dimension shaping
    geometryIntensity += u_clickIntensity * 0.3;
    geometryIntensity += u_audioEnergy * 0.2;
    
    // Holographic shimmer effect
    float shimmer = sin(uv.x * 20.0 + timeSpeed * 5.0 + u_audioColorOrbit * 6.28318) *
                    cos(uv.y * 15.0 + timeSpeed * 3.0 + u_audioBeatPhase * 6.28318) *
                    (0.1 + u_audioVelocity * 0.2);
    geometryIntensity += shimmer * geometryIntensity;
    
    // Apply user intensity control
    float finalIntensity = geometryIntensity * u_intensity;
    
    // Old hemispheric color system completely removed - now using extreme layer-by-layer system
    
    // EXTREME LAYER-BY-LAYER COLOR SYSTEM
    // Determine canvas layer from role/variant (0=background, 1=shadow, 2=content, 3=highlight, 4=accent)
    int layerIndex = 0;
    if (u_roleIntensity == 0.7) layerIndex = 1;      // shadow layer
    else if (u_roleIntensity == 1.0) layerIndex = 2; // content layer  
    else if (u_roleIntensity == 0.85) layerIndex = 3; // highlight layer
    else if (u_roleIntensity == 0.6) layerIndex = 4;  // accent layer
    
    // Get layer-specific base color with extreme dynamics
    // Use u_hue as global intensity modifier (0-1) affecting all layers
    float globalIntensity = u_hue; // Now 0-1 from JavaScript
    float colorTime = timeSpeed * 2.0 + value * 3.0 + globalIntensity * 5.0;
    vec3 layerColor = getLayerColorPalette(layerIndex, colorTime) * (0.5 + globalIntensity * 1.5);
    
    // Apply geometry-based intensity modulation per layer
    vec3 extremeBaseColor;
    float rhythmAccent = 0.6 + 0.4 * sin(u_audioBeatPhase * 6.28318 + float(layerIndex) * 0.8);
    if (layerIndex == 0) {
        // Background: Subtle, fills empty space
        extremeBaseColor = layerColor * (0.3 + geometryIntensity * 0.4);
    }
    else if (layerIndex == 1) {
        // Shadow: Aggressive, high contrast where geometry is weak
        float shadowIntensity = pow(1.0 - geometryIntensity, 2.0); // Inverted for shadows
        extremeBaseColor = layerColor * (shadowIntensity * 0.8 + 0.1 + u_audioChaos * 0.2);
    }
    else if (layerIndex == 2) {
        // Content: Dominant, follows geometry strongly
        extremeBaseColor = layerColor * (geometryIntensity * 1.2 + 0.2 + u_audioEnergy * 0.4);
    }
    else if (layerIndex == 3) {
        // Highlight: Electric, peaks only
        float peakIntensity = pow(geometryIntensity, 3.0); // Cubic for sharp peaks
        extremeBaseColor = layerColor * (peakIntensity * 1.5 + 0.1 + u_audioOnset * 0.5);
    }
    else {
        // Accent: Chaotic, random bursts
        float randomBurst = sin(value * 50.0 + timeSpeed * 10.0 + u_audioColorOrbit * 12.0) * 0.5 + 0.5;
        extremeBaseColor = layerColor * (randomBurst * (geometryIntensity + u_audioChaos * 0.6) * 1.5 + 0.05);
    }

    extremeBaseColor *= rhythmAccent;
    extremeBaseColor = mix(extremeBaseColor, vec3(1.0), u_audioColorBeat * 0.2);
    extremeBaseColor *= (0.8 + u_audioEnergy * 0.4);

    // Apply extreme RGB separation per layer
    vec3 extremeColor = extremeRGBSeparation(extremeBaseColor, uv, finalIntensity, layerIndex);
    
    // Layer-specific particle systems with extreme colors
    float extremeParticles = 0.0;
    if (layerIndex == 2 || layerIndex == 3) {
        // Only content and highlight layers get particles
        vec2 particleUV = uv * (layerIndex == 2 ? 12.0 : 20.0);
        vec2 particleID = floor(particleUV);
        vec2 particlePos = fract(particleUV) - 0.5;
        float particleDist = length(particlePos);
        
        float particleTime = timeSpeed * (layerIndex == 2 ? 3.0 : 8.0) + dot(particleID, vec2(127.1, 311.7));
        float particleAlpha = sin(particleTime) * 0.5 + 0.5;
        float particleSize = layerIndex == 2 ? 0.2 : 0.1;
        extremeParticles = (1.0 - smoothstep(0.05, particleSize, particleDist)) * particleAlpha * 0.4;
    }
    
    // Combine extreme color with particles based on layer
    vec3 finalColor;
    if (layerIndex == 0) {
        // Background: Pure extreme color
        finalColor = extremeColor;
    }
    else if (layerIndex == 1) {
        // Shadow: Dark with toxic highlights
        finalColor = extremeColor * (0.8 + u_audioChaos * 0.2);
    }
    else if (layerIndex == 2) {
        // Content: Blazing with white-hot particles
        finalColor = extremeColor + extremeParticles * vec3(1.0 + u_audioOnset * 0.3, 1.0, 1.0);
    }
    else if (layerIndex == 3) {
        // Highlight: Electric with cyan particles
        finalColor = extremeColor + extremeParticles * vec3(0.0, 1.0 + u_audioOnset * 0.4, 1.0 + u_audioEnergy * 0.3);
    }
    else {
        // Accent: Chaotic magenta madness
        finalColor = extremeColor * (1.0 + sin(timeSpeed * 20.0 + u_audioColorOrbit * 12.0) * (0.3 + u_audioChaos * 0.3));
    }

    finalColor = mix(finalColor, vec3(1.0), u_audioColorBeat * 0.1);
    finalColor += layerColor * u_audioOnset * 0.15;

    // Layer-specific alpha intensity with extreme contrast
    float layerAlpha;
    if (layerIndex == 0) layerAlpha = 0.6;        // Background: Medium
    else if (layerIndex == 1) layerAlpha = 0.4;   // Shadow: Lower
    else if (layerIndex == 2) layerAlpha = 1.0;   // Content: Full intensity
    else if (layerIndex == 3) layerAlpha = 0.8;   // Highlight: High
    else layerAlpha = 0.3;                        // Accent: Subtle bursts

    layerAlpha *= clamp(0.8 + u_audioEnergy * 0.3 + u_audioOnset * 0.2, 0.4, 1.6);

    vec3 filmColor = finalColor;
    float exposure = max(0.1, u_exposure);
    vec3 toneMapped = vec3(1.0) - exp(-filmColor * exposure);
    float shutter = clamp(u_shutter, 0.2, 3.0);
    toneMapped = pow(clamp(toneMapped, 0.0, 8.0), vec3(1.0 / shutter));
    vec3 bloom = pow(clamp(filmColor, 0.0, 12.0), vec3(1.25)) * clamp(u_bloom, 0.0, 3.0);
    toneMapped += bloom;

    float rimBoost = clamp(u_rimLight, 0.0, 1.5) * pow(clamp(geometryIntensity, 0.0, 1.0), 1.4);
    toneMapped += rimBoost * vec3(0.6, 0.85, 1.0);

    float keyFactor = clamp(u_keyLight, 0.0, 2.0);
    toneMapped *= (0.65 + keyFactor * 0.6);

    float ambient = clamp(u_ambientLight, 0.0, 1.0);
    toneMapped = mix(vec3(ambient), toneMapped, 0.85 + ambient * 0.1);

    float vignette = mix(1.0, smoothstep(1.35, 0.2, length(uv) * (1.0 + u_cameraDolly * 0.4)), clamp(u_vignette, 0.0, 1.0));
    toneMapped *= vignette;

    float parallaxWarp = clamp(u_cameraParallax, -1.2, 1.2);
    vec2 parallaxUv = uv + uv * parallaxWarp * 0.12;
    float distortion = clamp(u_lensDistortion, -0.6, 0.9);
    float radiusSq = dot(parallaxUv, parallaxUv);
    parallaxUv *= 1.0 + distortion * radiusSq;
    float focusSpread = max(0.05, u_focusSpread);
    float focusDistance = clamp(u_focusDistance, 0.0, 3.0);
    float focusFalloff = exp(-pow(length(parallaxUv) - focusDistance, 2.0) * (2.2 + focusSpread * 2.5));
    float fogFactor = exp(-pow(length(parallaxUv), 2.0) * (0.8 + clamp(u_fogDensity, 0.0, 1.6) * 1.6));
    float shadowMix = clamp(0.55 + clamp(u_shadowContrast, 0.0, 2.0) * 0.35, 0.0, 1.0);

    vec3 fogColor = mix(vec3(0.12, 0.16, 0.22), vec3(0.28, 0.3, 0.32), clamp(u_lightTemperature, 0.0, 1.2));
    toneMapped = mix(fogColor, toneMapped, clamp(fogFactor + focusFalloff * 0.35, 0.0, 1.0));

    vec3 coolGrade = vec3(0.72, 0.9, 1.1);
    vec3 warmGrade = vec3(1.08, 0.92, 0.78);
    toneMapped *= mix(coolGrade, warmGrade, clamp(u_lightTemperature, 0.0, 1.4));

    vec3 luminanceVec = vec3(0.299, 0.587, 0.114);
    float luminance = dot(toneMapped, luminanceVec);
    toneMapped = mix(vec3(luminance * (0.8 + shadowMix * 0.5)), toneMapped, shadowMix);

    float wrapStrength = clamp(u_lightWrap, 0.0, 1.6);
    vec3 wrapped = mix(
        toneMapped,
        vec3(luminance),
        clamp(wrapStrength * (0.35 + focusFalloff * 0.45), 0.0, 0.85)
    );
    toneMapped = mix(toneMapped, wrapped, clamp(wrapStrength, 0.0, 1.0));

    float aberration = clamp(u_chromaticAberration, 0.0, 1.2);
    toneMapped.r *= 1.0 + sin(parallaxUv.y * 9.0 + timeSpeed * 2.2) * aberration * 0.12;
    toneMapped.b *= 1.0 - sin(parallaxUv.x * 7.0 - timeSpeed * 1.7) * aberration * 0.12;

    float godrayAngle = atan(parallaxUv.y, parallaxUv.x);
    float godrayWave = max(0.0, sin(godrayAngle * 6.0 + timeSpeed * 3.5));
    float godrayDistance = exp(-length(parallaxUv) * (1.4 - parallaxWarp * 0.6));
    float godray = godrayWave * godrayDistance * focusFalloff;
    toneMapped += vec3(0.32, 0.4, 0.55) * godray * clamp(u_godrayIntensity, 0.0, 2.0);

    toneMapped += vec3(0.18, 0.1, 0.24) * parallaxWarp * (0.5 + focusFalloff * 0.5);

    float frameBlend = clamp(u_frameBlend, 0.0, 1.2);
    float streak = sin(timeSpeed * 32.0 + radiusSq * 80.0) * 0.5 + 0.5;
    vec3 motionTint = mix(vec3(0.75, 0.6, 0.82), vec3(1.2, 0.9, 0.7), clamp(u_lightTemperature, 0.0, 1.2));
    toneMapped = mix(
        toneMapped,
        toneMapped * mix(vec3(1.0), motionTint, clamp(streak, 0.0, 1.0)),
        clamp(frameBlend * 0.35, 0.0, 0.8)
    );

    float bleed = clamp(u_colorBleed, 0.0, 1.6);
    vec3 bleedColor = vec3(
        toneMapped.r + toneMapped.g * 0.14,
        toneMapped.g + toneMapped.b * 0.14,
        toneMapped.b + toneMapped.r * 0.14
    );
    toneMapped = mix(toneMapped, bleedColor, clamp(bleed * 0.32, 0.0, 0.6));

    float moireStrength = clamp(u_glitchMoire, 0.0, 1.0);
    if (moireStrength > 0.001) {
        float moire = sin((parallaxUv.x + u_audioHigh * 0.4) * (220.0 + u_audioChaos * 40.0)) *
                      sin((parallaxUv.y - u_audioMid * 0.35) * (200.0 + u_audioEnergy * 60.0));
        float rgbShift = sin(timeSpeed * 25.0 + length(parallaxUv) * 80.0);
        vec3 glitchColor = vec3(
            0.5 + 0.5 * sin(timeSpeed * 12.0 + parallaxUv.x * 140.0),
            0.5 + 0.5 * sin(timeSpeed * 17.0 + parallaxUv.y * 160.0 + 1.2),
            0.5 + 0.5 * sin(timeSpeed * 22.0 + parallaxUv.x * 120.0 + 2.4)
        );
        float dynamicStrength = moireStrength * (0.35 + u_audioOnset * 0.4 + u_audioHigh * 0.45);
        toneMapped += glitchColor * moire * dynamicStrength;
        toneMapped.rg += vec2(moire, -moire) * 0.08 * dynamicStrength;
        toneMapped.b += rgbShift * 0.05 * dynamicStrength;
    }

    float filmGrain = clamp(u_filmGrain, 0.0, 1.8);
    float grain = fract(sin(dot(parallaxUv * 120.0, vec2(12.9898, 78.233)) + timeSpeed * 130.0) * 43758.5453);
    grain = (grain - 0.5) * 2.0;
    toneMapped += grain * filmGrain * 0.06;
    toneMapped = clamp(toneMapped, 0.0, 5.0);

    gl_FragColor = vec4(toneMapped, finalIntensity * layerAlpha);
}`;
        
        this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
        this.uniforms = {
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
            time: this.gl.getUniformLocation(this.program, 'u_time'),
            mouse: this.gl.getUniformLocation(this.program, 'u_mouse'),
            geometry: this.gl.getUniformLocation(this.program, 'u_geometry'),
            gridDensity: this.gl.getUniformLocation(this.program, 'u_gridDensity'),
            morphFactor: this.gl.getUniformLocation(this.program, 'u_morphFactor'),
            chaos: this.gl.getUniformLocation(this.program, 'u_chaos'),
            speed: this.gl.getUniformLocation(this.program, 'u_speed'),
            hue: this.gl.getUniformLocation(this.program, 'u_hue'),
            intensity: this.gl.getUniformLocation(this.program, 'u_intensity'),
            saturation: this.gl.getUniformLocation(this.program, 'u_saturation'),
            dimension: this.gl.getUniformLocation(this.program, 'u_dimension'),
            rot4dXW: this.gl.getUniformLocation(this.program, 'u_rot4dXW'),
            rot4dYW: this.gl.getUniformLocation(this.program, 'u_rot4dYW'),
            rot4dZW: this.gl.getUniformLocation(this.program, 'u_rot4dZW'),
            colorProfile: this.gl.getUniformLocation(this.program, 'u_colorProfile'),
            colorStyle: this.gl.getUniformLocation(this.program, 'u_colorStyle'),
            colorVibrance: this.gl.getUniformLocation(this.program, 'u_colorVibrance'),
            glitchMoire: this.gl.getUniformLocation(this.program, 'u_glitchMoire'),
            mouseIntensity: this.gl.getUniformLocation(this.program, 'u_mouseIntensity'),
            clickIntensity: this.gl.getUniformLocation(this.program, 'u_clickIntensity'),
            roleIntensity: this.gl.getUniformLocation(this.program, 'u_roleIntensity'),
            audioBass: this.gl.getUniformLocation(this.program, 'u_audioBass'),
            audioMid: this.gl.getUniformLocation(this.program, 'u_audioMid'),
            audioHigh: this.gl.getUniformLocation(this.program, 'u_audioHigh'),
            audioEnergy: this.gl.getUniformLocation(this.program, 'u_audioEnergy'),
            audioOnset: this.gl.getUniformLocation(this.program, 'u_audioOnset'),
            audioSwing: this.gl.getUniformLocation(this.program, 'u_audioSwing'),
            audioTriplet: this.gl.getUniformLocation(this.program, 'u_audioTriplet'),
            audioBeatPhase: this.gl.getUniformLocation(this.program, 'u_audioBeatPhase'),
            audioMeasurePhase: this.gl.getUniformLocation(this.program, 'u_audioMeasurePhase'),
            audioColorOrbit: this.gl.getUniformLocation(this.program, 'u_audioColorOrbit'),
            audioColorBeat: this.gl.getUniformLocation(this.program, 'u_audioColorBeat'),
            audioSaturationPulse: this.gl.getUniformLocation(this.program, 'u_audioSaturationPulse'),
            audioDimensionShift: this.gl.getUniformLocation(this.program, 'u_audioDimensionShift'),
            universeModifier: this.gl.getUniformLocation(this.program, 'u_universeModifier'),
            audioChaos: this.gl.getUniformLocation(this.program, 'u_audioChaos'),
            audioVelocity: this.gl.getUniformLocation(this.program, 'u_audioVelocity'),
            cameraOrbit: this.gl.getUniformLocation(this.program, 'u_cameraOrbit'),
            cameraElevation: this.gl.getUniformLocation(this.program, 'u_cameraElevation'),
            cameraDolly: this.gl.getUniformLocation(this.program, 'u_cameraDolly'),
            cameraRoll: this.gl.getUniformLocation(this.program, 'u_cameraRoll'),
            exposure: this.gl.getUniformLocation(this.program, 'u_exposure'),
            shutter: this.gl.getUniformLocation(this.program, 'u_shutter'),
            bloom: this.gl.getUniformLocation(this.program, 'u_bloom'),
            keyLight: this.gl.getUniformLocation(this.program, 'u_keyLight'),
            rimLight: this.gl.getUniformLocation(this.program, 'u_rimLight'),
            ambientLight: this.gl.getUniformLocation(this.program, 'u_ambientLight'),
            vignette: this.gl.getUniformLocation(this.program, 'u_vignette'),
            cameraParallax: this.gl.getUniformLocation(this.program, 'u_cameraParallax'),
            focusDistance: this.gl.getUniformLocation(this.program, 'u_focusDistance'),
            focusSpread: this.gl.getUniformLocation(this.program, 'u_focusSpread'),
            chromaticAberration: this.gl.getUniformLocation(this.program, 'u_chromaticAberration'),
            lightTemperature: this.gl.getUniformLocation(this.program, 'u_lightTemperature'),
            shadowContrast: this.gl.getUniformLocation(this.program, 'u_shadowContrast'),
            fogDensity: this.gl.getUniformLocation(this.program, 'u_fogDensity'),
            godrayIntensity: this.gl.getUniformLocation(this.program, 'u_godrayIntensity'),
            filmGrain: this.gl.getUniformLocation(this.program, 'u_filmGrain'),
            lensDistortion: this.gl.getUniformLocation(this.program, 'u_lensDistortion'),
            frameBlend: this.gl.getUniformLocation(this.program, 'u_frameBlend'),
            lightWrap: this.gl.getUniformLocation(this.program, 'u_lightWrap'),
            colorBleed: this.gl.getUniformLocation(this.program, 'u_colorBleed')
        };
    }
    
    /**
     * Create WebGL program from shaders
     */
    createProgram(vertexSource, fragmentSource) {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        
        if (!vertexShader || !fragmentShader) {
            return null;
        }
        
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const error = this.gl.getProgramInfoLog(program);
            console.error('Program linking failed:', error);
            if (window.mobileDebug) {
                window.mobileDebug.log(`❌ ${this.canvas?.id}: Shader program link failed - ${error}`);
            }
            return null;
        } else {
            if (window.mobileDebug) {
                window.mobileDebug.log(`✅ ${this.canvas?.id}: Shader program linked successfully`);
            }
        }
        
        return program;
    }
    
    /**
     * Create individual shader
     */
    createShader(type, source) {
        // CRITICAL FIX: Check WebGL context state before shader operations
        if (!this.gl) {
            console.error('❌ Cannot create shader: WebGL context is null');
            if (window.mobileDebug) {
                window.mobileDebug.log(`❌ ${this.canvas?.id}: Cannot create shader - WebGL context is null`);
            }
            return null;
        }
        
        if (this.gl.isContextLost()) {
            console.error('❌ Cannot create shader: WebGL context is lost');
            if (window.mobileDebug) {
                window.mobileDebug.log(`❌ ${this.canvas?.id}: Cannot create shader - WebGL context is lost`);
            }
            return null;
        }
        
        try {
            const shader = this.gl.createShader(type);
            
            if (!shader) {
                console.error('❌ Failed to create shader object - WebGL context may be invalid');
                if (window.mobileDebug) {
                    window.mobileDebug.log(`❌ ${this.canvas?.id}: Failed to create shader object`);
                }
                return null;
            }
            
            this.gl.shaderSource(shader, source);
            this.gl.compileShader(shader);
            
            if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
                const error = this.gl.getShaderInfoLog(shader);
                const shaderType = type === this.gl.VERTEX_SHADER ? 'vertex' : 'fragment';
                
                // CRITICAL FIX: Show actual error instead of null
                if (error) {
                    console.error(`❌ ${shaderType} shader compilation failed:`, error);
                } else {
                    console.error(`❌ ${shaderType} shader compilation failed: WebGL returned no error info (context may be invalid)`);
                }
                
                console.error('Shader source:', source);
                
                if (window.mobileDebug) {
                    const errorMsg = error || 'No error info (context may be invalid)';
                    window.mobileDebug.log(`❌ ${this.canvas?.id}: ${shaderType} shader compile failed - ${errorMsg}`);
                    // Log first few lines of problematic shader for mobile debugging
                    const sourceLines = source.split('\n').slice(0, 5).join('\\n');
                    window.mobileDebug.log(`🔍 ${shaderType} shader source start: ${sourceLines}...`);
                }
                
                this.gl.deleteShader(shader);
                return null;
            } else {
                if (window.mobileDebug) {
                    const shaderType = type === this.gl.VERTEX_SHADER ? 'vertex' : 'fragment';
                    window.mobileDebug.log(`✅ ${this.canvas?.id}: ${shaderType} shader compiled successfully`);
                }
            }
            
            return shader;
        } catch (error) {
            console.error('❌ Exception during shader creation:', error);
            if (window.mobileDebug) {
                window.mobileDebug.log(`❌ ${this.canvas?.id}: Exception during shader creation - ${error.message}`);
            }
            return null;
        }
    }
    
    /**
     * Initialize vertex buffers
     */
    initBuffers() {
        const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        
        this.buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
        
        const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    }
    
    /**
     * Resize canvas and viewport
     */
    resize() {
        // Mobile-optimized canvas sizing
        const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for mobile performance
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        // Mobile debug: Check for zero dimensions that would cause invisible rendering
        if (window.mobileDebug && (width === 0 || height === 0) && !this._zeroDimWarned) {
            window.mobileDebug.log(`⚠️ ${this.canvas?.id}: Canvas clientWidth=${width}, clientHeight=${height} - will be invisible`);
            this._zeroDimWarned = true;
        }
        
        // Only resize if dimensions actually changed (mobile optimization)
        if (this.canvas.width !== width * dpr || this.canvas.height !== height * dpr) {
            this.canvas.width = width * dpr;
            this.canvas.height = height * dpr;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            
            // Mobile debug: Log final canvas dimensions
            if (window.mobileDebug && !this._finalSizeLogged) {
                window.mobileDebug.log(`📐 ${this.canvas?.id}: Final canvas buffer ${this.canvas.width}x${this.canvas.height} (DPR=${dpr})`);
                this._finalSizeLogged = true;
            }
        }
    }
    
    /**
     * Show user-friendly WebGL error message
     */
    showWebGLError() {
        if (!this.canvas) return;
        const ctx = this.canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = '#64ff96';
            ctx.font = '16px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('WebGL Required', this.canvas.width / 2, this.canvas.height / 2);
            ctx.fillStyle = '#888';
            ctx.font = '12px Orbitron, monospace';
            ctx.fillText('Please enable WebGL in your browser', this.canvas.width / 2, this.canvas.height / 2 + 25);
        }
    }
    
    /**
     * Update visualization parameters with immediate GPU sync
     */
    updateParameters(params) {
        this.params = { ...this.params, ...params };

        // Don't call render() here - engine will call it to prevent infinite loop
    }

    /**
     * Update a single parameter
     */
    updateParameter(name, value) {
        this.params[name] = value;
    }
    
    /**
     * Update mouse interaction state
     */
    updateInteraction(x, y, intensity) {
        this.mouseX = x;
        this.mouseY = y;
        this.mouseIntensity = intensity;
    }

    setAudioChoreography(audioData = {}) {
        const bands = audioData.bands || {};
        const rhythm = audioData.rhythmPhases || {};
        const dynamics = audioData.extremeDynamics || {};
        const color = audioData.colorChoreography || {};

        this.audioChoreo = {
            bass: Math.max(0, Math.min(1, bands.bass ?? 0)),
            mid: Math.max(0, Math.min(1, bands.mid ?? 0)),
            high: Math.max(0, Math.min(1, bands.high ?? 0)),
            energy: Math.max(0, Math.min(1, audioData.rms ?? audioData.energy ?? 0)),
            onset: Math.max(0, Math.min(1, audioData.onset ?? dynamics.transientBurst ?? 0)),
            swing: rhythm.swingPulse ?? 0,
            triplet: rhythm.tripletPulse ?? 0,
            beatPhase: rhythm.beatPhase ?? 0,
            measurePhase: rhythm.measurePhase ?? 0,
            colorOrbit: color.orbit ?? 0,
            colorBeat: Math.max(0, Math.min(1, color.downbeatColor ?? 0)),
            saturationPulse: Math.max(0, Math.min(1, color.saturationPulse ?? 0)),
            dimensionShift: Math.max(0, dynamics.dimensionLift ?? 0),
            intensityExponent: Math.max(0.2, dynamics.intensityExponent ?? 1),
            chaos: Math.max(0, Math.min(1, dynamics.chaosSurge ?? 0)),
            velocity: Math.max(0, Math.min(1, dynamics.motionVelocity ?? 0))
        };
    }
    
    /**
     * Render frame
     */
    render() {
        if (!this.program) {
            console.error(`❌ QUANTUM RENDER BLOCKED: No WebGL program! Canvas: ${this.canvas?.id}`);
            if (window.mobileDebug && !this._noProgramWarned) {
                window.mobileDebug.log(`❌ ${this.canvas?.id}: No WebGL program for render`);
                this._noProgramWarned = true;
            }
            return;
        }

        if (!this._renderStartLogged) {
            console.log(`✅ QUANTUM RENDER STARTED: Canvas ${this.canvas?.id}, program exists, gl context: ${!!this.gl}`);
            this._renderStartLogged = true;
        }
        
        this.resize();
        this.gl.useProgram(this.program);
        
        // CRITICAL FIX: Clear framebuffer before rendering
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        // Mobile optimization: Log render parameters once per canvas (console only)
        if (!this._renderParamsLogged) {
            console.log(`[Mobile] ${this.canvas?.id}: Render params - geometry=${this.params.geometry}, gridDensity=${this.params.gridDensity}, intensity=${this.params.intensity}`);
            this._renderParamsLogged = true;
        }
        
        // Role-specific intensity for quantum effects
        const roleIntensities = {
            'background': 0.4,
            'shadow': 0.6,
            'content': 1.0,
            'highlight': 1.3,
            'accent': 1.6
        };
        
        const time = Date.now() - this.startTime;
        
        // Set uniforms
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.uniforms.time, time);
        this.gl.uniform2f(this.uniforms.mouse, this.mouseX, this.mouseY);
        this.gl.uniform1f(this.uniforms.geometry, this.params.geometry);
        // 🎵 QUANTUM AUDIO REACTIVITY - Direct and effective
        const audio = this.audioChoreo || {};
        let gridDensity = this.params.gridDensity + audio.bass * 40;
        let morphFactor = this.params.morphFactor + audio.mid * 1.2 + audio.dimensionShift * 0.5;
        let hue = this.params.hue + audio.high * 120 + audio.colorOrbit * 360;
        let chaos = this.params.chaos + audio.energy * 0.6 + audio.chaos * 0.8;

        this.gl.uniform1f(this.uniforms.gridDensity, Math.min(120, gridDensity));
        this.gl.uniform1f(this.uniforms.morphFactor, Math.min(2.5, morphFactor));
        this.gl.uniform1f(this.uniforms.chaos, Math.min(1.5, chaos));
        this.gl.uniform1f(this.uniforms.speed, this.params.speed + audio.velocity * 0.6);
        // Hue now used as global intensity modifier for extreme layer system
        this.gl.uniform1f(this.uniforms.hue, ((hue % 360) + 360) % 360 / 360.0); // Normalize to 0-1 and wrap safely
        this.gl.uniform1f(this.uniforms.intensity, this.params.intensity + audio.energy * 0.3);
        this.gl.uniform1f(this.uniforms.saturation, this.params.saturation);
        this.gl.uniform1f(this.uniforms.dimension, this.params.dimension + audio.dimensionShift);
        this.gl.uniform1f(this.uniforms.rot4dXW, this.params.rot4dXW);
        this.gl.uniform1f(this.uniforms.rot4dYW, this.params.rot4dYW);
        this.gl.uniform1f(this.uniforms.rot4dZW, this.params.rot4dZW);
        this.gl.uniform1f(this.uniforms.colorStyle, this.params.colorStyle || 0);
        this.gl.uniform1f(this.uniforms.colorProfile, this.params.colorProfile || 0);
        this.gl.uniform1f(this.uniforms.colorVibrance, this.params.colorVibrance ?? 1.0);
        this.gl.uniform1f(this.uniforms.glitchMoire, this.params.glitchMoire ?? 0);
        this.gl.uniform1f(this.uniforms.mouseIntensity, this.mouseIntensity);
        this.gl.uniform1f(this.uniforms.clickIntensity, this.clickIntensity);
        this.gl.uniform1f(this.uniforms.roleIntensity, roleIntensities[this.role] || 1.0);

        this.gl.uniform1f(this.uniforms.audioBass, audio.bass || 0);
        this.gl.uniform1f(this.uniforms.audioMid, audio.mid || 0);
        this.gl.uniform1f(this.uniforms.audioHigh, audio.high || 0);
        this.gl.uniform1f(this.uniforms.audioEnergy, audio.energy || 0);
        this.gl.uniform1f(this.uniforms.audioOnset, audio.onset || 0);
        this.gl.uniform1f(this.uniforms.audioSwing, audio.swing || 0);
        this.gl.uniform1f(this.uniforms.audioTriplet, audio.triplet || 0);
        this.gl.uniform1f(this.uniforms.audioBeatPhase, audio.beatPhase || 0);
        this.gl.uniform1f(this.uniforms.audioMeasurePhase, audio.measurePhase || 0);
        this.gl.uniform1f(this.uniforms.audioColorOrbit, audio.colorOrbit || 0);
        this.gl.uniform1f(this.uniforms.audioColorBeat, audio.colorBeat || 0);
        this.gl.uniform1f(this.uniforms.audioSaturationPulse, audio.saturationPulse || 0);
        this.gl.uniform1f(this.uniforms.audioDimensionShift, audio.dimensionShift || 0);
        this.gl.uniform1f(this.uniforms.universeModifier, audio.intensityExponent || 1);
        this.gl.uniform1f(this.uniforms.audioChaos, audio.chaos || 0);
        this.gl.uniform1f(this.uniforms.audioVelocity, audio.velocity || 0);

        const camera = this.cameraLighting || {};
        this.gl.uniform1f(this.uniforms.cameraOrbit, camera.orbit || 0);
        this.gl.uniform1f(this.uniforms.cameraElevation, camera.elevation || 0);
        this.gl.uniform1f(this.uniforms.cameraDolly, camera.dolly || 0);
        this.gl.uniform1f(this.uniforms.cameraRoll, camera.roll || 0);
        this.gl.uniform1f(this.uniforms.exposure, Math.max(0.1, camera.exposure || 0));
        this.gl.uniform1f(this.uniforms.shutter, Math.max(0.2, camera.shutter || 0.5));
        this.gl.uniform1f(this.uniforms.bloom, Math.max(0, camera.bloom || 0));
        this.gl.uniform1f(this.uniforms.keyLight, Math.max(0, camera.keyLight || 0));
        this.gl.uniform1f(this.uniforms.rimLight, Math.max(0, camera.rimLight || 0));
        this.gl.uniform1f(this.uniforms.ambientLight, Math.max(0, camera.ambientLight || 0));
        this.gl.uniform1f(this.uniforms.vignette, Math.max(0, camera.vignette || 0));
        this.gl.uniform1f(this.uniforms.cameraParallax, camera.parallax || 0);
        this.gl.uniform1f(this.uniforms.focusDistance, Math.max(0, camera.focus || 0));
        this.gl.uniform1f(this.uniforms.focusSpread, Math.max(0.01, camera.focusSpread || 0));
        this.gl.uniform1f(this.uniforms.chromaticAberration, Math.max(0, camera.chromaticAberration || 0));
        this.gl.uniform1f(this.uniforms.lightTemperature, Math.max(0, camera.lightTemperature || 0));
        this.gl.uniform1f(this.uniforms.shadowContrast, Math.max(0, camera.shadowContrast || 0));
        this.gl.uniform1f(this.uniforms.fogDensity, Math.max(0, camera.fogDensity || 0));
        this.gl.uniform1f(this.uniforms.godrayIntensity, Math.max(0, camera.godrayIntensity || 0));
        this.gl.uniform1f(this.uniforms.filmGrain, Math.max(0, camera.filmGrain || 0));
        this.gl.uniform1f(this.uniforms.lensDistortion, camera.lensDistortion || 0);
        this.gl.uniform1f(this.uniforms.frameBlend, Math.max(0, camera.frameBlend || 0));
        this.gl.uniform1f(this.uniforms.lightWrap, Math.max(0, camera.lightWrap || 0));
        this.gl.uniform1f(this.uniforms.colorBleed, Math.max(0, camera.colorBleed || 0));

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    
    // Audio reactivity now handled directly in render() loop - no complex methods needed

    /**
     * Get elapsed time in seconds
     */
    getTime() {
        return (Date.now() - this.startTime) * 0.001;
    }

    /**
     * Clean up WebGL resources
     */
    destroy() {
        if (this.gl && this.program) {
            this.gl.deleteProgram(this.program);
        }
        if (this.gl && this.buffer) {
            this.gl.deleteBuffer(this.buffer);
        }
    }
}

// Legacy compatibility for historical demo entry points that still import the old class name.
// Keeping the alias avoids breaking the static HTML showcases while the new systems evolve.
export { QuantumHolographicVisualizer as QuantumVisualizer };
