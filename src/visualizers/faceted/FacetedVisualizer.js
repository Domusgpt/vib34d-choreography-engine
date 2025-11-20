/**
 * VIB34D Integrated Holographic Visualizer
 * WebGL-based renderer for individual holographic layers
 */

import { GeometryLibrary } from '../../geometry/GeometryLibrary.js';
import { getUniformPalette, lerpColor, applyVibrance, clampColor } from '../../color/UniformPaletteLibrary.js';

const clamp01 = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

function rgbToHsl(color = [0, 0, 0]) {
    const r = clamp01(color[0]);
    const g = clamp01(color[1]);
    const b = clamp01(color[2]);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            default:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return {
        h: clamp01(h),
        s: clamp01(s),
        l: clamp01(l)
    };
}

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
            colorVibrance: 1.0
        };

        this.colorStyle = 0;
        this.colorProfile = 0;
        this.colorVibrance = 1.0;
        this.colorState = {
            primary: [0.48, 0.56, 0.86],
            secondary: [0.28, 0.32, 0.52],
            accent: [0.92, 0.52, 0.74],
            highlight: [0.98, 0.82, 0.94],
            shadow: [0.08, 0.07, 0.12]
        };
        this.audioState = {
            bass: 0,
            mid: 0,
            high: 0,
            energy: 0,
            onset: 0,
            accent: 0,
            orbit: 0,
            saturation: 0,
            ribbon: 0,
            measurePhase: 0,
            active: false
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
    
    // Calculate geometry value
    float value = geometryFunction(pos);
    
    // Apply chaos
    float noise = sin(pos.x * 7.0) * cos(pos.y * 11.0) * sin(pos.z * 13.0);
    value += noise * u_chaos;
    
    // Color based on geometry value and hue with user-controlled intensity/saturation
    float geometryIntensity = 1.0 - clamp(abs(value), 0.0, 1.0);
    geometryIntensity += u_clickIntensity * 0.3;
    
    // Apply user intensity control
    float finalIntensity = geometryIntensity * u_intensity;
    
    float hue = u_hue / 360.0 + value * 0.1;
    
    // Create color with saturation control
    vec3 baseColor = vec3(
        sin(hue * 6.28318 + 0.0) * 0.5 + 0.5,
        sin(hue * 6.28318 + 2.0943) * 0.5 + 0.5,
        sin(hue * 6.28318 + 4.1887) * 0.5 + 0.5
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
            roleIntensity: this.gl.getUniformLocation(this.program, 'u_roleIntensity')
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
        if (params) {
            if (typeof params.colorStyle === 'number') {
                this.colorStyle = params.colorStyle;
            }
            if (typeof params.colorProfile === 'number') {
                this.colorProfile = params.colorProfile;
            }
            if (typeof params.colorVibrance === 'number') {
                this.colorVibrance = params.colorVibrance;
            }
        }
        this.params = { ...this.params, ...params };
    }

    /**
     * Update a single parameter
     */
    updateParameter(name, value) {
        if (name === 'colorStyle') {
            this.colorStyle = value;
        } else if (name === 'colorProfile') {
            this.colorProfile = value;
        } else if (name === 'colorVibrance') {
            this.colorVibrance = value;
        }
        this.params[name] = value;
    }

    setParameters(params) {
        this.updateParameters(params);
    }

    setColor(color) {
        if (!color) {
            return;
        }

        const primary = clampColor(color.primary || color.base || color.main || color);
        const secondary = clampColor(color.secondary || color.alt);
        const accent = clampColor(color.accent || color.highlight || color.emphasis);
        const shadow = clampColor(color.shadow || color.depth);
        const highlight = clampColor(color.highlight || color.glow);

        if (primary) {
            this.colorState.primary = primary;
        }
        if (secondary) {
            this.colorState.secondary = secondary;
        }
        if (accent) {
            this.colorState.accent = accent;
        }
        if (shadow) {
            this.colorState.shadow = shadow;
        }
        if (highlight) {
            this.colorState.highlight = highlight;
        } else {
            this.colorState.highlight = lerpColor(this.colorState.accent, [1, 1, 1], 0.25);
        }

        if (!this.colorState.secondary) {
            this.colorState.secondary = lerpColor(this.colorState.primary, this.colorState.shadow, 0.3);
        }
    }

    setAudioData(audioData) {
        const smoothing = 0.78;
        if (!audioData) {
            this.audioState = {
                bass: 0,
                mid: 0,
                high: 0,
                energy: 0,
                onset: 0,
                accent: 0,
                orbit: 0,
                saturation: 0,
                ribbon: 0,
                measurePhase: 0,
                active: false
            };
            return;
        }

        const bands = audioData.bands || {};
        const color = audioData.colorChoreography || {};
        const rhythm = audioData.rhythmPhases || {};
        const dynamics = audioData.extremeDynamics || {};
        const onset = Math.max(
            0,
            audioData.onset || 0,
            audioData.onsetEvent?.strength || 0,
            dynamics.transientBurst || 0
        );

        const blend = (key, value) => {
            const current = this.audioState[key] ?? 0;
            this.audioState[key] = current * smoothing + value * (1 - smoothing);
        };

        blend('bass', clamp01(bands.bass || 0));
        blend('mid', clamp01(bands.mid || 0));
        blend('high', clamp01(bands.high || 0));
        blend('energy', clamp01(audioData.rms ?? audioData.energy ?? 0));
        blend('accent', clamp01(color.accentLuma || 0));
        blend('orbit', clamp01(color.orbit || 0));
        blend('saturation', clamp01(color.saturationPulse ?? 0.5));
        blend('ribbon', clamp01(color.ribbon || 0));
        this.audioState.measurePhase = clamp01(rhythm.measurePhase || 0);
        this.audioState.onset = (this.audioState.onset ?? 0) * 0.6 + onset * 0.4;
        this.audioState.active = true;
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
        
        const roleIntensities = {
            background: 0.3,
            shadow: 0.5,
            content: 0.8,
            highlight: 1.0,
            accent: 1.2
        };

        const time = Date.now() - this.startTime;
        const audio = this.audioState || {};
        const audioActive = !!audio.active;

        const style = Math.round(this.colorStyle ?? (this.params.colorStyle || 0));
        const profileIndex = Math.max(0, Math.floor(this.colorProfile ?? (this.params.colorProfile || 0)));
        const vibrance = Math.min(3, Math.max(0.2, this.colorVibrance ?? (this.params.colorVibrance || 1)));

        let gridDensity = this.params.gridDensity ?? 15;
        let hueValue = this.params.hue ?? 200;
        let intensityValue = this.params.intensity ?? 0.5;
        let saturationValue = this.params.saturation ?? 0.8;
        let speedValue = this.params.speed ?? 1.0;
        let chaosValue = this.params.chaos ?? 0.2;

        if (audioActive) {
            gridDensity += audio.bass * 28;
            hueValue += audio.mid * 70 + audio.orbit * 160;
            intensityValue += audio.high * 0.35 + audio.energy * 0.3 + audio.onset * 0.18;
            saturationValue += audio.saturation * 0.35 + audio.accent * 0.25;
            speedValue += audio.energy * 0.4 + audio.mid * 0.2;
            chaosValue += audio.high * 0.45 + audio.ribbon * 0.3;
        }

        const pointerBoost = clamp01(this.mouseIntensity * 0.35);
        intensityValue += pointerBoost * 0.2;
        saturationValue += pointerBoost * 0.15;

        let rgbColor;
        if (style <= 0) {
            const palette = this.colorState;
            const orbitMix = clamp01((audio.orbit || 0) * 0.6 + (audio.saturation || 0) * 0.3 + pointerBoost * 0.15);
            const accentMix = clamp01((audio.accent || 0) * 0.7 + (audio.onset || 0) * 0.55);
            const energyMix = clamp01((audio.energy || 0) * 0.65 + (audio.high || 0) * 0.35);
            let baseColor = lerpColor(palette.primary, palette.secondary, orbitMix);
            baseColor = lerpColor(baseColor, palette.accent, accentMix);
            baseColor = applyVibrance(lerpColor(baseColor, palette.highlight, energyMix), vibrance);
            const shadowMix = clamp01((audio.ribbon || 0) * 0.4);
            rgbColor = clampColor(lerpColor(baseColor, palette.shadow, shadowMix * 0.25));
        } else {
            const palette = getUniformPalette(profileIndex);
            const orbitMix = clamp01((audio.orbit || 0) * 0.65 + (audio.measurePhase || 0) * 0.2);
            const accentMix = clamp01((audio.accent || 0) * 0.7 + (audio.onset || 0) * 0.55);
            const energyMix = clamp01((audio.energy || 0) * 0.7 + (audio.high || 0) * 0.35);
            let baseColor = lerpColor(palette.base, palette.mid, orbitMix);
            baseColor = lerpColor(baseColor, palette.accent, accentMix);
            baseColor = applyVibrance(lerpColor(baseColor, palette.highlight, energyMix), vibrance);
            const shadowMix = clamp01((audio.ribbon || 0) * 0.35);
            rgbColor = clampColor(lerpColor(baseColor, palette.shadow, shadowMix * 0.25));
        }

        const { h, s, l } = rgbToHsl(rgbColor);
        hueValue = h * 360;
        const saturationBoost = audioActive ? Math.max(audio.saturation || 0, audio.accent || 0) : 0;
        saturationValue = clamp01(s * (0.75 + (vibrance - 1) * 0.35) + saturationBoost * 0.25);
        intensityValue = Math.max(
            0.12,
            Math.min(
                1.2,
                intensityValue * 0.5 + l * (0.9 + (audio.energy || 0) * 0.35) + (audio.onset || 0) * 0.2
            )
        );

        const hueNormalized = ((hueValue % 360) + 360) % 360;
        const gridDensityClamped = Math.min(100, Math.max(4, gridDensity));
        const chaosClamped = Math.min(1.6, Math.max(0, chaosValue));
        const speedClamped = Math.max(0.1, speedValue);

        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.uniforms.time, time);
        this.gl.uniform2f(this.uniforms.mouse, this.mouseX, this.mouseY);
        this.gl.uniform1f(this.uniforms.geometry, this.params.geometry);
        this.gl.uniform1f(this.uniforms.gridDensity, gridDensityClamped);
        this.gl.uniform1f(this.uniforms.morphFactor, this.params.morphFactor);
        this.gl.uniform1f(this.uniforms.chaos, chaosClamped);
        this.gl.uniform1f(this.uniforms.speed, speedClamped);
        this.gl.uniform1f(this.uniforms.hue, hueNormalized);
        this.gl.uniform1f(this.uniforms.intensity, Math.min(1.2, intensityValue));
        this.gl.uniform1f(this.uniforms.saturation, saturationValue);
        this.gl.uniform1f(this.uniforms.dimension, this.params.dimension);
        this.gl.uniform1f(this.uniforms.rot4dXW, this.params.rot4dXW);
        this.gl.uniform1f(this.uniforms.rot4dYW, this.params.rot4dYW);
        this.gl.uniform1f(this.uniforms.rot4dZW, this.params.rot4dZW);
        this.gl.uniform1f(this.uniforms.mouseIntensity, this.mouseIntensity);
        this.gl.uniform1f(this.uniforms.clickIntensity, this.clickIntensity);
        this.gl.uniform1f(this.uniforms.roleIntensity, roleIntensities[this.role] || 1.0);
        
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

// Preserve the historic FacetedVisualizer name for legacy demos that still import it directly.
export { IntegratedHolographicVisualizer as FacetedVisualizer };
