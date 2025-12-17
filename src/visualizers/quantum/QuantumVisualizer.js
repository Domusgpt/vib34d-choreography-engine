/**
 * VIB34D Quantum Holographic Visualizer
 * Enhanced WebGL renderer with complex 3D lattice functions and holographic effects
 * This is the superior system with volumetric lighting, particles, and RGB glitch effects
 */

import { GeometryLibrary } from '../../geometry/GeometryLibrary.js';

const clamp01 = (value) => Math.max(0, Math.min(1, value));

function hueToRgb(hueDeg, saturation = 0.85, value = 1.0) {
    const h = ((hueDeg % 360) + 360) % 360 / 60;
    const c = value * saturation;
    const x = c * (1 - Math.abs((h % 2) - 1));
    const m = value - c;
    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 1) {
        r = c; g = x; b = 0;
    } else if (h < 2) {
        r = x; g = c; b = 0;
    } else if (h < 3) {
        r = 0; g = c; b = x;
    } else if (h < 4) {
        r = 0; g = x; b = c;
    } else if (h < 5) {
        r = x; g = 0; b = c;
    } else {
        r = c; g = 0; b = x;
    }

    return [clamp01(r + m), clamp01(g + m), clamp01(b + m)];
}

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
            rot4dZW: 0.0
        };

        this.behaviorState = {
            journeyPhase: 'orbit',
            beatEnvelope: 0,
            onsetEnvelope: 0,
            volumetricDensity: 0.35,
            hueSpan: [180, 240],
            contrastCurve: 0.9,
            cameraPreset: { tilt: 0.08, sway: 0.04 },
            paletteBands: [
                { position: 0.0, color: [0.05, 0.02, 0.12] },
                { position: 0.32, color: [0.25, 0.15, 0.35] },
                { position: 0.68, color: [0.68, 0.35, 0.15] },
                { position: 1.0, color: [1.0, 0.65, 0.28] }
            ],
            rotationTargets: { xw: 0, yw: 0, zw: 0 }
        };

        this.behaviorTargets = {
            hueSpan: [...this.behaviorState.hueSpan],
            contrastCurve: this.behaviorState.contrastCurve,
            cameraMotion: [this.behaviorState.cameraPreset.tilt, this.behaviorState.cameraPreset.sway],
            paletteBands: this.behaviorState.paletteBands.map(b => ({ ...b })),
            volumetricDensity: this.behaviorState.volumetricDensity
        };

        this.smoothedParams = {
            gridDensity: this.params.gridDensity,
            morphFactor: this.params.morphFactor,
            chaos: this.params.chaos,
            speed: this.params.speed,
            hue: (this.params.hue % 360) / 360,
            intensity: this.params.intensity,
            saturation: this.params.saturation,
            dimension: this.params.dimension,
            rot4dXW: 0,
            rot4dYW: 0,
            rot4dZW: 0,
            volumetricDensity: this.behaviorState.volumetricDensity
        };

        this.envelopeSmoothing = {
            beat: 0,
            onset: 0
        };

        this.cameraDrift = {
            tilt: 0,
            sway: 0
        };
        this.behaviorSmoothing = {
            hueSpan: [...this.behaviorTargets.hueSpan],
            contrastCurve: this.behaviorTargets.contrastCurve,
            cameraMotion: [...this.behaviorTargets.cameraMotion],
            paletteBands: this.behaviorTargets.paletteBands.map(b => ({ ...b })),
            volumetricDensity: this.behaviorTargets.volumetricDensity
        };
        this.lastRenderTime = Date.now();
        this.rotationTargets = { xw: 0, yw: 0, zw: 0 };
        
        this.init();
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
uniform float u_mouseIntensity;
uniform float u_clickIntensity;
uniform float u_roleIntensity;
uniform vec3 u_paletteColors[6];
uniform float u_paletteStops[6];
uniform int u_paletteCount;
uniform vec2 u_hueSpan;
uniform float u_contrastCurve;
uniform float u_volumetricDensity;
uniform float u_journeyPhase;
uniform float u_beatEnvelope;
uniform float u_onsetEnvelope;
uniform vec2 u_cameraMotion;

// 4D rotation matrices
mat4 rotateXW(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat4(c, 0.0, 0.0, -s, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, s, 0.0, 0.0, c);
}

// Backwards-compatible alias for legacy demo pages
export const QuantumVisualizer = QuantumHolographicVisualizer;

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

vec3 project4Dto3D(vec4 p) {
    float w = 2.5 / (2.5 + p.w);
    return vec3(p.x * w, p.y * w, p.z * w);
}

// Complex 3D Lattice Functions - Superior Quantum Shaders
float tetrahedronLattice(vec3 p, float gridSize) {
    vec3 q = fract(p * gridSize) - 0.5;
    float d1 = length(q);
    float d2 = length(q - vec3(0.4, 0.0, 0.0));
    float d3 = length(q - vec3(0.0, 0.4, 0.0));
    float d4 = length(q - vec3(0.0, 0.0, 0.4));
    float vertices = 1.0 - smoothstep(0.0, 0.04, min(min(d1, d2), min(d3, d4)));
    float edges = 0.0;
    edges = max(edges, 1.0 - smoothstep(0.0, 0.02, abs(length(q.xy) - 0.2)));
    edges = max(edges, 1.0 - smoothstep(0.0, 0.02, abs(length(q.yz) - 0.2)));
    edges = max(edges, 1.0 - smoothstep(0.0, 0.02, abs(length(q.xz) - 0.2)));
    return max(vertices, edges * 0.5);
}

float hypercubeLattice(vec3 p, float gridSize) {
    vec3 grid = fract(p * gridSize);
    vec3 edges = min(grid, 1.0 - grid);
    float minEdge = min(min(edges.x, edges.y), edges.z);
    float lattice = 1.0 - smoothstep(0.0, 0.03, minEdge);
    
    vec3 centers = abs(grid - 0.5);
    float maxCenter = max(max(centers.x, centers.y), centers.z);
    float vertices = 1.0 - smoothstep(0.45, 0.5, maxCenter);
    
    return max(lattice * 0.7, vertices);
}

float sphereLattice(vec3 p, float gridSize) {
    vec3 cell = fract(p * gridSize) - 0.5;
    float sphere = 1.0 - smoothstep(0.15, 0.25, length(cell));
    
    float rings = 0.0;
    float ringRadius = length(cell.xy);
    rings = max(rings, 1.0 - smoothstep(0.0, 0.02, abs(ringRadius - 0.3)));
    rings = max(rings, 1.0 - smoothstep(0.0, 0.02, abs(ringRadius - 0.2)));
    
    return max(sphere, rings * 0.6);
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

// Enhanced geometry function with holographic effects
float geometryFunction(vec4 p) {
    int geomType = int(u_geometry);
    vec3 p3d = project4Dto3D(p);
    float gridSize = u_gridDensity * 0.08;
    
    if (geomType == 0) {
        return tetrahedronLattice(p3d, gridSize) * u_morphFactor;
    }
    else if (geomType == 1) {
        return hypercubeLattice(p3d, gridSize) * u_morphFactor;
    }
    else if (geomType == 2) {
        return sphereLattice(p3d, gridSize) * u_morphFactor;
    }
    else if (geomType == 3) {
        return torusLattice(p3d, gridSize) * u_morphFactor;
    }
    else if (geomType == 4) {
        return kleinLattice(p3d, gridSize) * u_morphFactor;
    }
    else if (geomType == 5) {
        return fractalLattice(p3d, gridSize) * u_morphFactor;
    }
    else if (geomType == 6) {
        return waveLattice(p3d, gridSize) * u_morphFactor;
    }
    else if (geomType == 7) {
        return crystalLattice(p3d, gridSize) * u_morphFactor;
    }
    else {
        return hypercubeLattice(p3d, gridSize) * u_morphFactor;
    }
}

// EXTREME LAYER-BY-LAYER COLOR SYSTEM
// Each canvas layer gets completely different color behavior

// Layer-specific color palettes with extreme juxtapositions
vec3 getLayerColorPalette(int layerIndex, float t) {
    if (layerIndex == 0) {
        // BACKGROUND LAYER: Deep space colors - purple/black/deep blue
        vec3 color1 = vec3(0.05, 0.0, 0.2);   // Deep purple
        vec3 color2 = vec3(0.0, 0.0, 0.1);    // Near black
        vec3 color3 = vec3(0.0, 0.05, 0.3);   // Deep blue
        return mix(mix(color1, color2, sin(t * 3.0) * 0.5 + 0.5), color3, cos(t * 2.0) * 0.5 + 0.5);
    }
    else if (layerIndex == 1) {
        // SHADOW LAYER: Toxic greens and sickly yellows - high contrast
        vec3 color1 = vec3(0.0, 1.0, 0.0);    // Pure toxic green
        vec3 color2 = vec3(0.8, 1.0, 0.0);    // Sickly yellow-green
        vec3 color3 = vec3(0.0, 0.8, 0.3);    // Forest green
        return mix(mix(color1, color2, sin(t * 7.0) * 0.5 + 0.5), color3, cos(t * 5.0) * 0.5 + 0.5);
    }
    else if (layerIndex == 2) {
        // CONTENT LAYER: Blazing hot colors - red/orange/white hot
        vec3 color1 = vec3(1.0, 0.0, 0.0);    // Pure red
        vec3 color2 = vec3(1.0, 0.5, 0.0);    // Blazing orange
        vec3 color3 = vec3(1.0, 1.0, 1.0);    // White hot
        return mix(mix(color1, color2, sin(t * 11.0) * 0.5 + 0.5), color3, cos(t * 8.0) * 0.5 + 0.5);
    }
    else if (layerIndex == 3) {
        // HIGHLIGHT LAYER: Electric blues and cyans - crackling energy
        vec3 color1 = vec3(0.0, 1.0, 1.0);    // Electric cyan
        vec3 color2 = vec3(0.0, 0.5, 1.0);    // Electric blue
        vec3 color3 = vec3(0.5, 1.0, 1.0);    // Bright cyan
        return mix(mix(color1, color2, sin(t * 13.0) * 0.5 + 0.5), color3, cos(t * 9.0) * 0.5 + 0.5);
    }
    else {
        // ACCENT LAYER: Violent magentas and purples - chaotic
        vec3 color1 = vec3(1.0, 0.0, 1.0);    // Pure magenta
        vec3 color2 = vec3(0.8, 0.0, 1.0);    // Violet
        vec3 color3 = vec3(1.0, 0.3, 1.0);    // Hot pink
        return mix(mix(color1, color2, sin(t * 17.0) * 0.5 + 0.5), color3, cos(t * 12.0) * 0.5 + 0.5);
    }
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

// Palette sampler for multi-stop bands driven by journey hue spans
vec3 samplePalette(float t, vec3 fallback) {
    if (u_paletteCount < 2) {
        return fallback;
    }

    float prevPos = 0.0;
    vec3 prevColor = u_paletteColors[0];

    for (int i = 1; i < 6; i++) {
        if (i >= u_paletteCount) {
            break;
        }

        float pos = u_paletteStops[i];
        float segmentT = smoothstep(prevPos, pos, clamp(t, 0.0, 1.0));
        vec3 blended = mix(prevColor, u_paletteColors[i], segmentT);

        if (t <= pos || i == u_paletteCount - 1) {
            return blended;
        }

        prevPos = pos;
        prevColor = u_paletteColors[i];
    }

    return prevColor;
}

void main() {
    vec2 cameraDrift = vec2(
        sin(u_time * 0.0006 + u_journeyPhase * 1.4) * u_cameraMotion.x,
        cos(u_time * 0.0004 + u_journeyPhase) * u_cameraMotion.y
    );
    vec2 uv = (gl_FragCoord.xy - u_resolution.xy * 0.5) / min(u_resolution.x, u_resolution.y) + cameraDrift;

    // Enhanced 4D position with holographic depth
    float timeSpeed = u_time * 0.0001 * u_speed;
    vec4 pos = vec4(uv * 3.0, sin(timeSpeed * 3.0), cos(timeSpeed * 2.0));
    pos.xy += (u_mouse - 0.5) * u_mouseIntensity * 2.0;
    pos.xy += cameraDrift * 2.0;

    // Apply 4D rotations
    pos = rotateXW(u_rot4dXW) * pos;
    pos = rotateYW(u_rot4dYW) * pos;
    pos = rotateZW(u_rot4dZW) * pos;

    // Calculate enhanced geometry value
    float value = geometryFunction(pos);

    // Enhanced chaos with holographic effects
    float noise = sin(pos.x * 7.0) * cos(pos.y * 11.0) * sin(pos.z * 13.0);
    value += noise * u_chaos;

    // Enhanced intensity calculation with holographic glow
    float geometryIntensity = 1.0 - clamp(abs(value * 0.8), 0.0, 1.0);
    geometryIntensity = pow(geometryIntensity, 1.5); // More dramatic falloff
    geometryIntensity += u_clickIntensity * 0.3;

    // Holographic shimmer effect
    float shimmer = sin(uv.x * 20.0 + timeSpeed * 5.0) * cos(uv.y * 15.0 + timeSpeed * 3.0) * 0.1;
    geometryIntensity += shimmer * geometryIntensity;
    geometryIntensity += (u_beatEnvelope * 0.35 + u_onsetEnvelope * 0.45);

    // Apply user intensity control
    float finalIntensity = geometryIntensity * u_intensity;
    finalIntensity *= mix(0.6, 1.6, u_volumetricDensity);
    
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
    float paletteCoord = clamp(value * 0.6 + u_beatEnvelope * 0.4 + u_onsetEnvelope * 0.3, 0.0, 1.0);
    vec3 journeyColor = samplePalette(paletteCoord, layerColor);
    float hueJourney = mix(u_hueSpan.x, u_hueSpan.y, 0.5 + 0.5 * sin(timeSpeed * 0.8 + u_journeyPhase));
    journeyColor *= mix(0.7, 1.3, hueJourney);
    journeyColor = pow(max(journeyColor, 0.0), vec3(u_contrastCurve));
    
    // Apply geometry-based intensity modulation per layer
    vec3 extremeBaseColor;
    if (layerIndex == 0) {
        // Background: Subtle, fills empty space
        extremeBaseColor = journeyColor * (0.3 + geometryIntensity * 0.4);
    }
    else if (layerIndex == 1) {
        // Shadow: Aggressive, high contrast where geometry is weak
        float shadowIntensity = pow(1.0 - geometryIntensity, 2.0); // Inverted for shadows
        extremeBaseColor = journeyColor * (shadowIntensity * 0.8 + 0.1);
    }
    else if (layerIndex == 2) {
        // Content: Dominant, follows geometry strongly
        extremeBaseColor = journeyColor * (geometryIntensity * 1.2 + 0.2);
    }
    else if (layerIndex == 3) {
        // Highlight: Electric, peaks only
        float peakIntensity = pow(geometryIntensity, 3.0); // Cubic for sharp peaks
        extremeBaseColor = journeyColor * (peakIntensity * 1.5 + 0.1);
    }
    else {
        // Accent: Chaotic, random bursts
        float randomBurst = sin(value * 50.0 + timeSpeed * 10.0) * 0.5 + 0.5;
        extremeBaseColor = journeyColor * (randomBurst * geometryIntensity * 2.0 + 0.05);
    }
    
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
        finalColor = extremeColor * 0.8;
    }
    else if (layerIndex == 2) {
        // Content: Blazing with white-hot particles
        finalColor = extremeColor + extremeParticles * vec3(1.0, 1.0, 1.0);
    }
    else if (layerIndex == 3) {
        // Highlight: Electric with cyan particles
        finalColor = extremeColor + extremeParticles * vec3(0.0, 1.0, 1.0);
    }
    else {
        // Accent: Chaotic magenta madness
        finalColor = extremeColor * (1.0 + sin(timeSpeed * 20.0) * 0.3);
    }
    
    // Layer-specific alpha intensity with extreme contrast
    float layerAlpha;
    if (layerIndex == 0) layerAlpha = 0.6;        // Background: Medium
    else if (layerIndex == 1) layerAlpha = 0.4;   // Shadow: Lower
    else if (layerIndex == 2) layerAlpha = 1.0;   // Content: Full intensity
    else if (layerIndex == 3) layerAlpha = 0.8;   // Highlight: High
    else layerAlpha = 0.3;                        // Accent: Subtle bursts
    
    gl_FragColor = vec4(finalColor, finalIntensity * layerAlpha);
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
            mouseIntensity: this.gl.getUniformLocation(this.program, 'u_mouseIntensity'),
            clickIntensity: this.gl.getUniformLocation(this.program, 'u_clickIntensity'),
            roleIntensity: this.gl.getUniformLocation(this.program, 'u_roleIntensity'),
            paletteColors: this.gl.getUniformLocation(this.program, 'u_paletteColors[0]'),
            paletteStops: this.gl.getUniformLocation(this.program, 'u_paletteStops[0]'),
            paletteCount: this.gl.getUniformLocation(this.program, 'u_paletteCount'),
            hueSpan: this.gl.getUniformLocation(this.program, 'u_hueSpan'),
            contrastCurve: this.gl.getUniformLocation(this.program, 'u_contrastCurve'),
            volumetricDensity: this.gl.getUniformLocation(this.program, 'u_volumetricDensity'),
            journeyPhase: this.gl.getUniformLocation(this.program, 'u_journeyPhase'),
            beatEnvelope: this.gl.getUniformLocation(this.program, 'u_beatEnvelope'),
            onsetEnvelope: this.gl.getUniformLocation(this.program, 'u_onsetEnvelope'),
            cameraMotion: this.gl.getUniformLocation(this.program, 'u_cameraMotion')
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

    normalizePaletteBands(bands, hueSpan = this.behaviorState.hueSpan || [0, 360]) {
        const safeBands = (bands || []).map((band, idx) => ({
            position: band.position ?? (idx / Math.max(1, (bands.length || 1) - 1)),
            color: (band.color || [0, 0, 0]).map(component => clamp01(component))
        }));

        if (!safeBands.length) {
            return this.generateHueSpanPalette(hueSpan);
        }

        const sorted = safeBands
            .map(band => ({
                position: clamp01(band.position),
                color: band.color
            }))
            .sort((a, b) => a.position - b.position);

        // Ensure first and last stops bracket the full 0..1 range
        if (sorted[0].position !== 0) {
            sorted.unshift({ position: 0, color: sorted[0].color.slice() });
        }
        if (sorted[sorted.length - 1].position !== 1) {
            sorted.push({ position: 1, color: sorted[sorted.length - 1].color.slice() });
        }

        return sorted.slice(0, 6);
    }

    generateHueSpanPalette(hueSpan) {
        const [startHue, endHue] = hueSpan || [0, 360];
        const span = endHue - startHue;
        const anchors = [0, 0.32, 0.68, 1];

        return anchors.map((anchor, idx) => {
            const hue = startHue + span * anchor + (idx === 1 ? span * 0.05 : idx === 2 ? -span * 0.05 : 0);
            return {
                position: anchor,
                color: hueToRgb(hue)
            };
        });
    }

    /**
     * Apply behavior/sweep engine state for cinematic journeys
     */
    applyBehaviorState(behaviorState) {
        if (behaviorState.parameterDiagnostics) {
            this.parameterDiagnostics = behaviorState.parameterDiagnostics;
        }

        const resolvedHueSpan = behaviorState.hueSpan || this.behaviorState.hueSpan;
        const normalizedPalette = this.normalizePaletteBands(behaviorState.paletteBands, resolvedHueSpan);

        this.behaviorState = {
            ...this.behaviorState,
            ...behaviorState,
            hueSpan: resolvedHueSpan,
            paletteBands: normalizedPalette,
            rotationTargets: behaviorState.rotationTargets || this.behaviorState.rotationTargets,
            cameraPreset: behaviorState.cameraPreset || this.behaviorState.cameraPreset
        };

        this.behaviorTargets = {
            ...this.behaviorTargets,
            hueSpan: [...(this.behaviorState.hueSpan || [0, 360])],
            contrastCurve: this.behaviorState.contrastCurve,
            cameraMotion: [
                this.behaviorState.cameraPreset?.tilt || 0,
                this.behaviorState.cameraPreset?.sway || 0
            ],
            paletteBands: normalizedPalette.slice(0, 6).map(band => ({
                position: band.position ?? 0,
                color: band.color ? [...band.color] : [0, 0, 0]
            })),
            volumetricDensity: behaviorState.volumetricDensity ?? this.behaviorTargets.volumetricDensity
        };

        if (behaviorState.rotationTargets) {
            this.rotationTargets = behaviorState.rotationTargets;
        }

        if (behaviorState.volumetricDensity !== undefined) {
            this.smoothedParams.volumetricDensity = behaviorState.volumetricDensity;
        }
    }

    updateBehaviorSmoothing(lerpFactor) {
        const smoothing = Math.min(1, lerpFactor * 1.25);
        const targetSpan = this.behaviorTargets.hueSpan || [0, 360];

        this.behaviorSmoothing.hueSpan[0] += (targetSpan[0] - this.behaviorSmoothing.hueSpan[0]) * smoothing;
        this.behaviorSmoothing.hueSpan[1] += (targetSpan[1] - this.behaviorSmoothing.hueSpan[1]) * smoothing;
        this.behaviorSmoothing.contrastCurve += (this.behaviorTargets.contrastCurve - this.behaviorSmoothing.contrastCurve) * smoothing;

        this.behaviorSmoothing.cameraMotion[0] += (this.behaviorTargets.cameraMotion[0] - this.behaviorSmoothing.cameraMotion[0]) * smoothing;
        this.behaviorSmoothing.cameraMotion[1] += (this.behaviorTargets.cameraMotion[1] - this.behaviorSmoothing.cameraMotion[1]) * smoothing;

        const targetBands = this.behaviorTargets.paletteBands?.length ? this.behaviorTargets.paletteBands : this.behaviorSmoothing.paletteBands;
        const maxBands = 6;
        const activeBands = Math.min(maxBands, Math.max(2, targetBands.length || 2));

        for (let i = 0; i < activeBands; i++) {
            const targetBand = targetBands[Math.min(i, targetBands.length - 1)] || { position: i / Math.max(1, activeBands - 1), color: [0, 0, 0] };
            const smoothingBand = this.behaviorSmoothing.paletteBands[i] || { position: targetBand.position, color: [...targetBand.color] };

            smoothingBand.position += (targetBand.position - smoothingBand.position) * smoothing;
            smoothingBand.color = smoothingBand.color || [0, 0, 0];

            smoothingBand.color[0] += (targetBand.color[0] - smoothingBand.color[0]) * smoothing;
            smoothingBand.color[1] += (targetBand.color[1] - smoothingBand.color[1]) * smoothing;
            smoothingBand.color[2] += (targetBand.color[2] - smoothingBand.color[2]) * smoothing;

            this.behaviorSmoothing.paletteBands[i] = smoothingBand;
        }

        this.behaviorSmoothing.paletteBands.length = activeBands;

        this.behaviorSmoothing.volumetricDensity += (this.behaviorTargets.volumetricDensity - this.behaviorSmoothing.volumetricDensity) * smoothing;
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
        const now = Date.now();
        const deltaMs = now - this.lastRenderTime;
        this.lastRenderTime = now;
        const lerpFactor = 1 - Math.exp(-deltaMs / 180);

        this.updateBehaviorSmoothing(lerpFactor);

        const beatTarget = this.behaviorState.beatEnvelope || 0;
        const onsetTarget = this.behaviorState.onsetEnvelope || 0;
        const beatSmoothing = beatTarget > this.envelopeSmoothing.beat ? 0.45 : 0.18;
        const onsetSmoothing = onsetTarget > this.envelopeSmoothing.onset ? 0.38 : 0.16;

        this.envelopeSmoothing.beat += (beatTarget - this.envelopeSmoothing.beat) * beatSmoothing;
        this.envelopeSmoothing.onset += (onsetTarget - this.envelopeSmoothing.onset) * onsetSmoothing;

        const beatEnvelope = this.envelopeSmoothing.beat;
        const onsetEnvelope = this.envelopeSmoothing.onset;

        // Set uniforms
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.uniforms.time, time);
        this.gl.uniform2f(this.uniforms.mouse, this.mouseX, this.mouseY);
        this.gl.uniform1f(this.uniforms.geometry, this.params.geometry);

        // 🎵 QUANTUM AUDIO REACTIVITY - smoothed for cinematic pacing
        let gridDensityTarget = this.params.gridDensity;
        let morphFactorTarget = this.params.morphFactor;
        let hueTarget = this.params.hue;
        let chaosTarget = this.params.chaos;
        let intensityTarget = this.params.intensity * (0.85 + beatEnvelope * 0.4 + onsetEnvelope * 0.35);

        if (window.audioEnabled && window.audioReactive) {
            gridDensityTarget += window.audioReactive.bass * 40;
            morphFactorTarget += window.audioReactive.mid * 1.2;
            hueTarget += window.audioReactive.high * 120;
            chaosTarget += window.audioReactive.energy * 0.6;
        }

        this.smoothedParams.gridDensity += (Math.min(100, gridDensityTarget) - this.smoothedParams.gridDensity) * lerpFactor;
        this.smoothedParams.morphFactor += (Math.min(2, morphFactorTarget) - this.smoothedParams.morphFactor) * lerpFactor;
        this.smoothedParams.chaos += (Math.min(1, chaosTarget) - this.smoothedParams.chaos) * lerpFactor;
        this.smoothedParams.speed += (this.params.speed - this.smoothedParams.speed) * lerpFactor;
        this.smoothedParams.hue += (((hueTarget % 360) / 360.0) - this.smoothedParams.hue) * lerpFactor;
        this.smoothedParams.intensity += (intensityTarget - this.smoothedParams.intensity) * lerpFactor;
        this.smoothedParams.saturation += (this.params.saturation - this.smoothedParams.saturation) * lerpFactor;
        this.smoothedParams.dimension += (this.params.dimension - this.smoothedParams.dimension) * lerpFactor;

        const motionScale = 0.15 + beatEnvelope * 0.6 + onsetEnvelope * 0.55;
        const rotationTarget = {
            xw: (this.rotationTargets.xw || 0) * motionScale,
            yw: (this.rotationTargets.yw || 0) * motionScale,
            zw: (this.rotationTargets.zw || 0) * motionScale
        };

        this.smoothedParams.rot4dXW += (rotationTarget.xw - this.smoothedParams.rot4dXW) * lerpFactor;
        this.smoothedParams.rot4dYW += (rotationTarget.yw - this.smoothedParams.rot4dYW) * lerpFactor;
        this.smoothedParams.rot4dZW += (rotationTarget.zw - this.smoothedParams.rot4dZW) * lerpFactor;
        this.smoothedParams.volumetricDensity += ((this.behaviorSmoothing.volumetricDensity || 0.35) - this.smoothedParams.volumetricDensity) * lerpFactor;

        this.gl.uniform1f(this.uniforms.gridDensity, this.smoothedParams.gridDensity);
        this.gl.uniform1f(this.uniforms.morphFactor, this.smoothedParams.morphFactor);
        this.gl.uniform1f(this.uniforms.chaos, this.smoothedParams.chaos);
        this.gl.uniform1f(this.uniforms.speed, this.smoothedParams.speed);
        this.gl.uniform1f(this.uniforms.hue, this.smoothedParams.hue);
        this.gl.uniform1f(this.uniforms.intensity, this.smoothedParams.intensity);
        this.gl.uniform1f(this.uniforms.saturation, this.smoothedParams.saturation);
        this.gl.uniform1f(this.uniforms.dimension, this.smoothedParams.dimension);
        this.gl.uniform1f(this.uniforms.rot4dXW, this.smoothedParams.rot4dXW);
        this.gl.uniform1f(this.uniforms.rot4dYW, this.smoothedParams.rot4dYW);
        this.gl.uniform1f(this.uniforms.rot4dZW, this.smoothedParams.rot4dZW);
        this.gl.uniform1f(this.uniforms.mouseIntensity, this.mouseIntensity);
        this.gl.uniform1f(this.uniforms.clickIntensity, this.clickIntensity);
        this.gl.uniform1f(this.uniforms.roleIntensity, roleIntensities[this.role] || 1.0);

        // Behavior-driven uniforms
        const palette = this.behaviorSmoothing.paletteBands || [];
        const paletteColors = new Float32Array(18).fill(0);
        const paletteStops = new Float32Array(6).fill(0);
        const paletteCount = Math.min(6, palette.length || 0);

        for (let i = 0; i < paletteCount; i++) {
            const band = palette[i];
            const normalizedPos = Math.max(0, Math.min(1, band.position ?? (i / Math.max(1, paletteCount - 1))));

            paletteColors.set(band.color || [0, 0, 0], i * 3);
            paletteStops[i] = i === 0 ? 0 : normalizedPos;
        }

        if (paletteCount > 0) {
            paletteStops[paletteCount - 1] = 1;
        }

        const hueSpan = this.behaviorSmoothing.hueSpan || [0.0, 1.0];
        const normalizedHueSpan = [
            Math.max(0, Math.min(1, hueSpan[0] / 360)),
            Math.max(0, Math.min(1, hueSpan[1] / 360))
        ];

        const driftTime = time * 0.001;
        this.cameraDrift.tilt = Math.sin(driftTime * 0.35) * 0.02 + Math.cos(driftTime * 0.18) * 0.015;
        this.cameraDrift.sway = Math.cos(driftTime * 0.27) * 0.018 + Math.sin(driftTime * 0.22) * 0.012;

        const cameraMotion = [
            (this.behaviorSmoothing.cameraMotion?.[0] || 0) * (0.3 + beatEnvelope * 0.7) + this.cameraDrift.tilt,
            (this.behaviorSmoothing.cameraMotion?.[1] || 0) * (0.25 + onsetEnvelope * 0.75) + this.cameraDrift.sway
        ];

        this.gl.uniform3fv(this.uniforms.paletteColors, paletteColors);
        this.gl.uniform1fv(this.uniforms.paletteStops, paletteStops);
        this.gl.uniform1i(this.uniforms.paletteCount, paletteCount);
        this.gl.uniform2f(this.uniforms.hueSpan, normalizedHueSpan[0], normalizedHueSpan[1]);
        this.gl.uniform1f(this.uniforms.contrastCurve, this.behaviorSmoothing.contrastCurve || 1.0);
        this.gl.uniform1f(this.uniforms.volumetricDensity, this.smoothedParams.volumetricDensity);
        this.gl.uniform1f(this.uniforms.journeyPhase, this.behaviorState.journeyPhase === 'spiral' ? 2.0 : this.behaviorState.journeyPhase === 'pendulum' ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.beatEnvelope, beatEnvelope || 0);
        this.gl.uniform1f(this.uniforms.onsetEnvelope, onsetEnvelope || 0);
        this.gl.uniform2f(this.uniforms.cameraMotion, cameraMotion[0], cameraMotion[1]);

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

// Backwards-compatible alias for legacy demo pages and mobile-smart bundles
export const QuantumVisualizer = QuantumHolographicVisualizer;