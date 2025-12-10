/**
 * VIB34D Integrated Holographic Visualizer
 * WebGL-based renderer for individual holographic layers
 */

import { GeometryLibrary } from '../../geometry/GeometryLibrary.js';

// The original demos and build pipeline still import "FacetedVisualizer"
// from this module. Maintain that export alongside the preferred
// IntegratedHolographicVisualizer name so Vite can scan every example
// without choking on a missing symbol (which currently prevents the
// behavior preview and other pages from rendering in production).
export class IntegratedHolographicVisualizer {
    constructor(canvasId, role, reactivity, variant) {
        this.canvas = document.getElementById(canvasId);
        this.role = role;
        this.reactivity = reactivity;
        this.variant = variant;
        
        if (!this.canvas) {
            console.error(`Canvas ${canvasId} not found`);
            return;
        }
        let rect = this.canvas.getBoundingClientRect();
        const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
        
        // Store context options for later use
        this.contextOptions = {
            alpha: true,
            depth: true,
            stencil: false,
            antialias: false,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance',
            failIfMajorPerformanceCaveat: false
        };
        
        // CRITICAL FIX: Ensure canvas is properly sized BEFORE creating WebGL context
        this.ensureCanvasSizedThenInitWebGL(rect, devicePixelRatio);
        
        this.mouseX = 0.5;
        this.mouseY = 0.5;
        this.mouseIntensity = 0.0;
        this.clickIntensity = 0.0;
        this.startTime = Date.now();
        this.lastRenderTime = Date.now();

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

        // Behavior/journey-driven state
        this.behaviorState = {
            hueSpan: [this.params?.hue || 200, (this.params?.hue || 200) + 40],
            paletteBands: [],
            rotationTargets: { xw: 0, yw: 0, zw: 0 },
            cameraPreset: { tilt: 0, sway: 0 },
            volumetricDensity: 0.25,
            contrastCurve: 0.85,
            beatEnvelope: 0,
            onsetEnvelope: 0
        };

        this.behaviorTargets = {
            hueSpan: [...this.behaviorState.hueSpan],
            paletteBands: [],
            cameraMotion: [0, 0],
            contrastCurve: this.behaviorState.contrastCurve,
            volumetricDensity: this.behaviorState.volumetricDensity
        };

        this.behaviorSmoothing = {
            hueSpan: [...this.behaviorState.hueSpan],
            paletteBands: [],
            cameraMotion: [0, 0],
            contrastCurve: this.behaviorState.contrastCurve,
            volumetricDensity: this.behaviorState.volumetricDensity
        };

        this.rotationTargets = { ...this.behaviorState.rotationTargets };
        this.envelopeSmoothing = { beat: 0, onset: 0 };

        this.smoothedParams = {
            gridDensity: this.params.gridDensity,
            morphFactor: this.params.morphFactor,
            chaos: this.params.chaos,
            speed: this.params.speed,
            hue: this.params.hue / 360.0,
            intensity: this.params.intensity,
            saturation: this.params.saturation,
            dimension: this.params.dimension,
            rot4dXW: this.params.rot4dXW,
            rot4dYW: this.params.rot4dYW,
            rot4dZW: this.params.rot4dZW
        };
        
        // Initialization now happens in ensureCanvasSizedThenInitWebGL after sizing
        // this.init(); // MOVED
    }
    
    /**
     * CRITICAL FIX: Ensure canvas is properly sized before creating WebGL context
     */
    async ensureCanvasSizedThenInitWebGL(rect, devicePixelRatio) {
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
                            window.mobileDebug.log(`📐 Canvas ${this.canvas.id}: Using viewport fallback ${this.canvas.width}x${this.canvas.height}`);
                        }
                    } else {
                        this.canvas.width = rect.width * devicePixelRatio;
                        this.canvas.height = rect.height * devicePixelRatio;
                        
                        if (window.mobileDebug) {
                            window.mobileDebug.log(`📐 Canvas ${this.canvas.id}: Layout ready ${this.canvas.width}x${this.canvas.height}`);
                        }
                    }
                    resolve();
                }, 100);
            });
        } else {
            this.canvas.width = rect.width * devicePixelRatio;
            this.canvas.height = rect.height * devicePixelRatio;
            
            if (window.mobileDebug) {
                window.mobileDebug.log(`📐 Canvas ${this.canvas.id}: ${this.canvas.width}x${this.canvas.height} (DPR: ${devicePixelRatio})`);
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
        // CRITICAL FIX: Check if context already exists from CanvasManager
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
                window.mobileDebug.log(`❌ WebGL context failed for ${this.canvas.id} (size: ${this.canvas.width}x${this.canvas.height})`);
            }
            // Show user-friendly error instead of white screen
            this.showWebGLError();
            return;
        } else {
            if (window.mobileDebug) {
                const version = this.gl.getParameter(this.gl.VERSION);
                window.mobileDebug.log(`✅ WebGL context created for ${this.canvas.id}: ${version} (size: ${this.canvas.width}x${this.canvas.height})`);
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
     * Initialize shaders with 4D mathematics
     */
    initShaders() {
        const vertexShaderSource = `attribute vec2 a_position;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;
        
        const fragmentShaderSource = `precision highp float;

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
uniform vec2 u_hueSpan;
uniform vec3 u_paletteColors[6];
uniform float u_paletteStops[6];
uniform float u_contrastCurve;
uniform float u_volumetricDensity;
uniform float u_cameraTilt;
uniform float u_cameraSway;
uniform int u_paletteCount;

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

vec3 project4Dto3D(vec4 p) {
    float w = 2.5 / (2.5 + p.w);
    return vec3(p.x * w, p.y * w, p.z * w);
}

vec3 samplePalette(float t) {
    if (u_paletteCount <= 1) {
        float hue = mix(u_hueSpan.x, u_hueSpan.y, t) / 360.0;
        return vec3(
            sin(hue * 6.28318 + 0.0) * 0.5 + 0.5,
            sin(hue * 6.28318 + 2.0943) * 0.5 + 0.5,
            sin(hue * 6.28318 + 4.1887) * 0.5 + 0.5
        );
    }

    vec3 color = u_paletteColors[0];
    float stop = u_paletteStops[0];

    for (int i = 1; i < 6; i++) {
        if (i >= u_paletteCount) break;
        float nextStop = u_paletteStops[i];
        vec3 nextColor = u_paletteColors[i];

        if (t <= nextStop + 0.0001) {
            float span = max(0.0001, nextStop - stop);
            float localT = clamp((t - stop) / span, 0.0, 1.0);
            color = mix(color, nextColor, localT);
            break;
        }

        color = nextColor;
        stop = nextStop;
    }

    return color;
}

// Simplified geometry functions for WebGL 1.0 compatibility (ORIGINAL FACETED)
float geometryFunction(vec4 p) {
    int geomType = int(u_geometry);
    
    if (geomType == 0) {
        // Tetrahedron lattice - UNIFORM GRID DENSITY
        vec4 pos = fract(p * u_gridDensity * 0.08);
        vec4 dist = min(pos, 1.0 - pos);
        return min(min(dist.x, dist.y), min(dist.z, dist.w)) * u_morphFactor;
    }
    else if (geomType == 1) {
        // Hypercube lattice - UNIFORM GRID DENSITY
        vec4 pos = fract(p * u_gridDensity * 0.08);
        vec4 dist = min(pos, 1.0 - pos);
        float minDist = min(min(dist.x, dist.y), min(dist.z, dist.w));
        return minDist * u_morphFactor;
    }
    else if (geomType == 2) {
        // Sphere lattice - UNIFORM GRID DENSITY
        float r = length(p);
        float density = u_gridDensity * 0.08;
        float spheres = abs(fract(r * density) - 0.5) * 2.0;
        float theta = atan(p.y, p.x);
        float harmonics = sin(theta * 3.0) * 0.2;
        return (spheres + harmonics) * u_morphFactor;
    }
    else if (geomType == 3) {
        // Torus lattice - UNIFORM GRID DENSITY
        float r1 = length(p.xy) - 2.0;
        float torus = length(vec2(r1, p.z)) - 0.8;
        float lattice = sin(p.x * u_gridDensity * 0.08) * sin(p.y * u_gridDensity * 0.08);
        return (torus + lattice * 0.3) * u_morphFactor;
    }
    else if (geomType == 4) {
        // Klein bottle lattice - UNIFORM GRID DENSITY
        float u = atan(p.y, p.x);
        float v = atan(p.w, p.z);
        float dist = length(p) - 2.0;
        float lattice = sin(u * u_gridDensity * 0.08) * sin(v * u_gridDensity * 0.08);
        return (dist + lattice * 0.4) * u_morphFactor;
    }
    else if (geomType == 5) {
        // Fractal lattice - NOW WITH UNIFORM GRID DENSITY
        vec4 pos = fract(p * u_gridDensity * 0.08);
        pos = abs(pos * 2.0 - 1.0);
        float dist = length(max(abs(pos) - 1.0, 0.0));
        return dist * u_morphFactor;
    }
    else if (geomType == 6) {
        // Wave lattice - UNIFORM GRID DENSITY
        float freq = u_gridDensity * 0.08;
        float time = u_time * 0.001 * u_speed;
        float wave1 = sin(p.x * freq + time);
        float wave2 = sin(p.y * freq + time * 1.3);
        float wave3 = sin(p.z * freq * 0.8 + time * 0.7); // Add Z-dimension waves
        float interference = wave1 * wave2 * wave3;
        return interference * u_morphFactor;
    }
    else if (geomType == 7) {
        // Crystal lattice - UNIFORM GRID DENSITY
        vec4 pos = fract(p * u_gridDensity * 0.08) - 0.5;
        float cube = max(max(abs(pos.x), abs(pos.y)), max(abs(pos.z), abs(pos.w)));
        return cube * u_morphFactor;
    }
    else {
        // Default hypercube - UNIFORM GRID DENSITY
        vec4 pos = fract(p * u_gridDensity * 0.08);
        vec4 dist = min(pos, 1.0 - pos);
        return min(min(dist.x, dist.y), min(dist.z, dist.w)) * u_morphFactor;
    }
}

void main() {
    vec2 uv = (gl_FragCoord.xy - u_resolution.xy * 0.5) / min(u_resolution.x, u_resolution.y);
    
    // 4D position with mouse interaction - NOW USING SPEED PARAMETER
    float timeSpeed = u_time * 0.0001 * u_speed;
    vec4 pos = vec4(uv * 3.0, sin(timeSpeed * 3.0), cos(timeSpeed * 2.0));
    pos.xy += (u_mouse - 0.5) * u_mouseIntensity * 2.0;
    
    // Apply 4D rotations
    pos = rotateXW(u_rot4dXW) * pos;
    pos = rotateYW(u_rot4dYW) * pos;
    pos = rotateZW(u_rot4dZW) * pos;
    
    // Apply subtle camera drift
    pos.xy += vec2(u_cameraTilt, u_cameraSway) * 0.5;

    // Calculate geometry value
    float value = geometryFunction(pos);
    
    // Apply chaos
    float noise = sin(pos.x * 7.0) * cos(pos.y * 11.0) * sin(pos.z * 13.0);
    value += noise * u_chaos;
    
    // Color based on geometry value and hue with user-controlled intensity/saturation
    float geometryIntensity = 1.0 - clamp(abs(value), 0.0, 1.0);
    geometryIntensity += u_clickIntensity * 0.3;

    float hue = mix(u_hueSpan.x, u_hueSpan.y, clamp(0.5 + value * 0.25, 0.0, 1.0)) / 360.0;

    // Palette-driven color selection
    float palettePos = clamp(0.5 + value * 0.5 + u_mouseIntensity * 0.2, 0.0, 1.0);
    vec3 paletteColor = samplePalette(palettePos);

    // Apply user intensity control
    float finalIntensity = pow(geometryIntensity * (u_intensity + u_volumetricDensity * 0.5), mix(0.6, 1.4, u_contrastCurve));

    // Create color with saturation control
    vec3 baseColor = mix(
        vec3(
            sin(hue * 6.28318 + 0.0) * 0.5 + 0.5,
            sin(hue * 6.28318 + 2.0943) * 0.5 + 0.5,
            sin(hue * 6.28318 + 4.1887) * 0.5 + 0.5
        ),
        paletteColor,
        0.6
    );
    
    // Apply saturation (mix with grayscale)
    float gray = (baseColor.r + baseColor.g + baseColor.b) / 3.0;
    vec3 color = mix(vec3(gray), baseColor, u_saturation) * finalIntensity;
    
    gl_FragColor = vec4(color, finalIntensity * u_roleIntensity);
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
            hueSpan: this.gl.getUniformLocation(this.program, 'u_hueSpan'),
            paletteColors: this.gl.getUniformLocation(this.program, 'u_paletteColors[0]'),
            paletteStops: this.gl.getUniformLocation(this.program, 'u_paletteStops[0]'),
            contrastCurve: this.gl.getUniformLocation(this.program, 'u_contrastCurve'),
            volumetricDensity: this.gl.getUniformLocation(this.program, 'u_volumetricDensity'),
            cameraTilt: this.gl.getUniformLocation(this.program, 'u_cameraTilt'),
            cameraSway: this.gl.getUniformLocation(this.program, 'u_cameraSway'),
            paletteCount: this.gl.getUniformLocation(this.program, 'u_paletteCount')
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
            console.error('Program linking failed:', this.gl.getProgramInfoLog(program));
            return null;
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
            return null;
        }
        
        if (this.gl.isContextLost()) {
            console.error('❌ Cannot create shader: WebGL context is lost');
            return null;
        }
        
        try {
            const shader = this.gl.createShader(type);
            
            if (!shader) {
                console.error('❌ Failed to create shader object - WebGL context may be invalid');
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
                this.gl.deleteShader(shader);
                return null;
            }
            
            return shader;
        } catch (error) {
            console.error('❌ Exception during shader creation:', error);
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
        
        // Only resize if dimensions actually changed (mobile optimization)
        if (this.canvas.width !== width * dpr || this.canvas.height !== height * dpr) {
            this.canvas.width = width * dpr;
            this.canvas.height = height * dpr;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    /**
     * Show user-friendly WebGL error message
     */
    showWebGLError() {
        if (!this.canvas) return;
        
        // Try 2D canvas fallback
        const ctx = this.canvas.getContext('2d');
        if (ctx) {
            this.canvas.width = this.canvas.clientWidth;
            this.canvas.height = this.canvas.clientHeight;
            
            ctx.fillStyle = '#1a0033';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Mobile-friendly error display
            ctx.fillStyle = '#ff6b6b';
            ctx.font = `${Math.min(20, this.canvas.width / 15)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('⚠️ WebGL Error', this.canvas.width / 2, this.canvas.height / 2 - 30);
            
            ctx.fillStyle = '#ffd93d';
            ctx.font = `${Math.min(14, this.canvas.width / 20)}px sans-serif`;
            
            const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile) {
                ctx.fillText('Mobile device detected', this.canvas.width / 2, this.canvas.height / 2);
                ctx.fillText('Enable hardware acceleration', this.canvas.width / 2, this.canvas.height / 2 + 20);
                ctx.fillText('or try Chrome/Firefox', this.canvas.width / 2, this.canvas.height / 2 + 40);
            } else {
                ctx.fillText('Please enable WebGL', this.canvas.width / 2, this.canvas.height / 2);
                ctx.fillText('in your browser settings', this.canvas.width / 2, this.canvas.height / 2 + 20);
            }
            
            // Log to mobile debug
            if (window.mobileDebug) {
                window.mobileDebug.log(`📱 WebGL error fallback shown for canvas ${this.canvas.id}`);
            }
        } else {
            // Even 2D canvas failed - create HTML fallback
            const errorDiv = document.createElement('div');
            errorDiv.innerHTML = `
                <div style="
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: #1a0033;
                    color: #ff6b6b;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    font-family: sans-serif;
                    text-align: center;
                    padding: 20px;
                ">
                    <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
                    <div style="font-size: 18px; margin-bottom: 10px;">Graphics Error</div>
                    <div style="font-size: 14px; color: #ffd93d;">
                        Your device doesn't support<br>
                        the required graphics features
                    </div>
                </div>
            `;
            this.canvas.parentNode.insertBefore(errorDiv, this.canvas.nextSibling);
        }
    }
    
    /**
     * Update visualization parameters
     */
    updateParameters(params) {
        this.params = { ...this.params, ...params };
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
        // Check if interactions are enabled globally
        if (window.interactivityEnabled === false) {
            // Reset to default when disabled
            this.mouseX = 0.5;
            this.mouseY = 0.5;
            this.mouseIntensity = 0.0;
            return;
        }
        
        this.mouseX = x;
        this.mouseY = y;
        this.mouseIntensity = intensity;
    }

    normalizePaletteBands(bands, hueSpan = this.behaviorState.hueSpan) {
        const safeBands = (bands || []).map((band, idx) => ({
            position: band.position ?? (idx / Math.max(1, (bands.length || 1) - 1)),
            color: (band.color || [0, 0, 0]).map(component => Math.min(1, Math.max(0, component)))
        }));

        if (!safeBands.length) {
            const [startHue, endHue] = hueSpan || [0, 360];
            const anchors = [0, 0.35, 0.7, 1];

            return anchors.map((anchor, idx) => {
                const hue = startHue + (endHue - startHue) * anchor + (idx === 1 ? 6 : idx === 2 ? -6 : 0);
                return {
                    position: anchor,
                    color: [
                        Math.sin((hue / 360) * 6.28318 + 0.0) * 0.5 + 0.5,
                        Math.sin((hue / 360) * 6.28318 + 2.0943) * 0.5 + 0.5,
                        Math.sin((hue / 360) * 6.28318 + 4.1887) * 0.5 + 0.5
                    ]
                };
            });
        }

        const sorted = safeBands
            .map(band => ({ position: Math.min(1, Math.max(0, band.position)), color: band.color }))
            .sort((a, b) => a.position - b.position);

        if (sorted[0].position !== 0) {
            sorted.unshift({ position: 0, color: sorted[0].color.slice() });
        }
        if (sorted[sorted.length - 1].position !== 1) {
            sorted.push({ position: 1, color: sorted[sorted.length - 1].color.slice() });
        }

        return sorted.slice(0, 6);
    }

    applyBehaviorState(behaviorState) {
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
            paletteBands: normalizedPalette.slice(0, 6).map(band => ({
                position: band.position ?? 0,
                color: band.color ? [...band.color] : [0, 0, 0]
            })),
            cameraMotion: [
                this.behaviorState.cameraPreset?.tilt || 0,
                this.behaviorState.cameraPreset?.sway || 0
            ],
            contrastCurve: this.behaviorState.contrastCurve,
            volumetricDensity: behaviorState.volumetricDensity ?? this.behaviorTargets.volumetricDensity
        };

        if (behaviorState.rotationTargets) {
            this.rotationTargets = behaviorState.rotationTargets;
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
            console.error(`❌ FACETED RENDER BLOCKED: No WebGL program! Canvas: ${this.canvas?.id}`);
            if (window.mobileDebug) {
                window.mobileDebug.log(`❌ ${this.canvas?.id}: No WebGL program compiled`);
            }
            return;
        }

        if (!this.gl) {
            console.error(`❌ FACETED RENDER BLOCKED: No WebGL context! Canvas: ${this.canvas?.id}`);
            if (window.mobileDebug) {
                window.mobileDebug.log(`❌ ${this.canvas?.id}: No WebGL context`);
            }
            return;
        }

        if (!this._renderStartLogged) {
            console.log(`✅ FACETED RENDER STARTED: Canvas ${this.canvas?.id}, program exists, gl context exists`);
            this._renderStartLogged = true;
        }
        
        try {
            this.resize();
            this.gl.useProgram(this.program);
            
            // CRITICAL FIX: Clear framebuffer before rendering
            this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        } catch (error) {
            if (window.mobileDebug) {
                window.mobileDebug.log(`❌ ${this.canvas?.id}: WebGL render error: ${error.message}`);
            }
            return;
        }
        
        // Role-specific intensity (ORIGINAL FACETED VALUES)
        const roleIntensities = {
            'background': 0.3,
            'shadow': 0.5,
            'content': 0.8,
            'highlight': 1.0,
            'accent': 1.2
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

        const palette = this.behaviorSmoothing.paletteBands || [];
        const paletteColors = new Float32Array(18).fill(0);
        const paletteStops = new Float32Array(6).fill(0);
        const paletteCount = Math.min(6, palette.length || 0);

        let paletteLuma = 0;
        for (let i = 0; i < paletteCount; i++) {
            const band = palette[i];
            const normalizedPos = Math.max(0, Math.min(1, band.position ?? (i / Math.max(1, paletteCount - 1))));
            const color = band.color || [0, 0, 0];
            paletteStops[i] = normalizedPos;
            paletteColors.set(color, i * 3);
            paletteLuma += (color[0] + color[1] + color[2]) / paletteCount;
        }

        const hueSpan = this.behaviorSmoothing.hueSpan;
        const hueTarget = (hueSpan[0] + (hueSpan[1] - hueSpan[0]) * (0.45 + beatEnvelope * 0.25 + onsetEnvelope * 0.3)) / 360.0;

        const audioGrid = window.audioEnabled && window.audioReactive ? window.audioReactive.bass * 30 : 0;
        const audioHue = window.audioEnabled && window.audioReactive ? window.audioReactive.mid * 0.14 : 0;
        const audioIntensity = window.audioEnabled && window.audioReactive ? window.audioReactive.high * 0.4 : 0;

        const targetGridDensity = this.params.gridDensity + audioGrid;
        const targetMorph = this.params.morphFactor;
        const targetChaos = this.params.chaos;
        const targetSpeed = this.params.speed;
        const targetIntensity = this.params.intensity * (0.75 + beatEnvelope * 0.35 + onsetEnvelope * 0.32 + paletteLuma * 0.12) + audioIntensity;
        const targetSaturation = this.params.saturation;
        const targetDimension = this.params.dimension + this.behaviorSmoothing.volumetricDensity * 0.15;

        this.smoothedParams.gridDensity += (Math.min(100, targetGridDensity) - this.smoothedParams.gridDensity) * lerpFactor;
        this.smoothedParams.morphFactor += (Math.min(2, targetMorph) - this.smoothedParams.morphFactor) * lerpFactor;
        this.smoothedParams.chaos += (Math.min(1, targetChaos) - this.smoothedParams.chaos) * lerpFactor;
        this.smoothedParams.speed += (targetSpeed - this.smoothedParams.speed) * lerpFactor;
        this.smoothedParams.hue += (hueTarget + audioHue - this.smoothedParams.hue) * lerpFactor;
        this.smoothedParams.intensity += (Math.min(1.25, targetIntensity) - this.smoothedParams.intensity) * lerpFactor;
        this.smoothedParams.saturation += (targetSaturation - this.smoothedParams.saturation) * lerpFactor;
        this.smoothedParams.dimension += (targetDimension - this.smoothedParams.dimension) * lerpFactor;

        const motionScale = 0.12 + beatEnvelope * 0.5 + onsetEnvelope * 0.45;
        const rotationTarget = {
            xw: (this.rotationTargets.xw || 0) * motionScale,
            yw: (this.rotationTargets.yw || 0) * motionScale,
            zw: (this.rotationTargets.zw || 0) * motionScale
        };

        this.smoothedParams.rot4dXW += (rotationTarget.xw - this.smoothedParams.rot4dXW) * lerpFactor;
        this.smoothedParams.rot4dYW += (rotationTarget.yw - this.smoothedParams.rot4dYW) * lerpFactor;
        this.smoothedParams.rot4dZW += (rotationTarget.zw - this.smoothedParams.rot4dZW) * lerpFactor;

        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.uniforms.time, time);
        this.gl.uniform2f(this.uniforms.mouse, this.mouseX, this.mouseY);
        this.gl.uniform1f(this.uniforms.geometry, this.params.geometry);
        this.gl.uniform1f(this.uniforms.gridDensity, this.smoothedParams.gridDensity);
        this.gl.uniform1f(this.uniforms.morphFactor, this.smoothedParams.morphFactor);
        this.gl.uniform1f(this.uniforms.chaos, this.smoothedParams.chaos);
        this.gl.uniform1f(this.uniforms.speed, this.smoothedParams.speed);
        this.gl.uniform1f(this.uniforms.hue, (this.smoothedParams.hue * 360) % 360);
        this.gl.uniform1f(this.uniforms.intensity, Math.min(1.25, this.smoothedParams.intensity));
        this.gl.uniform1f(this.uniforms.saturation, this.smoothedParams.saturation);
        this.gl.uniform1f(this.uniforms.dimension, this.smoothedParams.dimension);
        this.gl.uniform1f(this.uniforms.rot4dXW, this.smoothedParams.rot4dXW);
        this.gl.uniform1f(this.uniforms.rot4dYW, this.smoothedParams.rot4dYW);
        this.gl.uniform1f(this.uniforms.rot4dZW, this.smoothedParams.rot4dZW);
        this.gl.uniform1f(this.uniforms.mouseIntensity, this.mouseIntensity);
        this.gl.uniform1f(this.uniforms.clickIntensity, this.clickIntensity);
        this.gl.uniform1f(this.uniforms.roleIntensity, roleIntensities[this.role] || 1.0);
        this.gl.uniform2f(this.uniforms.hueSpan, hueSpan[0], hueSpan[1]);
        this.gl.uniform3fv(this.uniforms.paletteColors, paletteColors);
        this.gl.uniform1fv(this.uniforms.paletteStops, paletteStops);
        this.gl.uniform1f(this.uniforms.contrastCurve, this.behaviorSmoothing.contrastCurve);
        this.gl.uniform1f(this.uniforms.volumetricDensity, this.behaviorSmoothing.volumetricDensity);
        this.gl.uniform1f(this.uniforms.cameraTilt, this.behaviorSmoothing.cameraMotion[0]);
        this.gl.uniform1f(this.uniforms.cameraSway, this.behaviorSmoothing.cameraMotion[1]);
        this.gl.uniform1i(this.uniforms.paletteCount, paletteCount);
        
        try {
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
            
            // Mobile success logging (only once per canvas)
            if (window.mobileDebug && !this._renderSuccessLogged) {
                window.mobileDebug.log(`✅ ${this.canvas?.id}: WebGL render successful`);
                this._renderSuccessLogged = true;
            }
        } catch (error) {
            if (window.mobileDebug) {
                window.mobileDebug.log(`❌ ${this.canvas?.id}: WebGL draw error: ${error.message}`);
            }
        }
    }
    
    /**
     * CRITICAL FIX: Reinitialize WebGL program after context recreation
     */
    reinitializeContext() {
        console.log(`🔄 Reinitializing WebGL context for ${this.canvas?.id}`);
        
        // Clear ALL old WebGL references
        this.program = null;
        this.buffer = null;
        this.uniforms = null;
        this.gl = null;
        
        // CRITICAL FIX: Don't create new context - CanvasManager already did this
        // Just get the existing context that CanvasManager created
        this.gl = this.canvas.getContext('webgl2') || 
                  this.canvas.getContext('webgl') ||
                  this.canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            console.error(`❌ No WebGL context available for ${this.canvas?.id} - CanvasManager should have created one`);
            return false;
        }
        
        if (this.gl.isContextLost()) {
            console.error(`❌ WebGL context is lost for ${this.canvas?.id}`);
            return false;
        }
        
        // Reinitialize shaders and buffers if context is valid
        try {
            this.init();
            console.log(`✅ ${this.canvas?.id}: Context reinitialized successfully`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to reinitialize WebGL resources for ${this.canvas?.id}:`, error);
            return false;
        }
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

// Backwards compatibility export for legacy demo imports
export const FacetedVisualizer = IntegratedHolographicVisualizer;