import { getUniformPalette, lerpColor, applyVibrance, clampColor } from '../../color/UniformPaletteLibrary.js';

/**
 * Core Holographic Visualizer - Clean WebGL rendering engine
 * Extracted from working system, no debugging mess
 */
export class HolographicVisualizer {
    constructor(canvasId, role = 'content', reactivity = 1.0, variant = 0) {
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
        
        // CRITICAL FIX: Check if context already exists from SmartCanvasPool
        let existingContext = this.canvas.getContext('webgl2') || 
                             this.canvas.getContext('webgl') || 
                             this.canvas.getContext('experimental-webgl');
        
        if (existingContext && !existingContext.isContextLost()) {
            console.log(`🔄 Reusing existing WebGL context for ${canvasId}`);
            this.gl = existingContext;
        } else {
            // Try WebGL2 first (better mobile support), then WebGL1
            this.gl = this.canvas.getContext('webgl2', this.contextOptions) || 
                      this.canvas.getContext('webgl', this.contextOptions) ||
                      this.canvas.getContext('experimental-webgl', this.contextOptions);
        }
        
        if (!this.gl) {
            console.error(`WebGL not supported for ${canvasId}`);
            this.showWebGLError();
            throw new Error(`WebGL not supported for ${canvasId}`);
        }
        
        this.variantParams = this.generateVariantParams(variant);
        this.roleParams = this.generateRoleParams(role);

        this.baseVariantParams = {
            hue: this.variantParams.hue,
            saturation: this.variantParams.saturation,
            intensity: this.variantParams.intensity,
            density: this.variantParams.density,
            speed: this.variantParams.speed,
            chaos: this.variantParams.chaos,
            morph: this.variantParams.morph
        };

        this.colorStyle = 0;
        this.colorProfile = 0;
        this.colorVibrance = 1.0;
        this.colorState = {
            primary: [0.55, 0.62, 0.9],
            secondary: [0.34, 0.4, 0.62],
            accent: [0.94, 0.55, 0.82],
            highlight: [0.98, 0.82, 0.94],
            shadow: [0.08, 0.05, 0.12]
        };

        // Initialize state
        this.mouseX = 0.5;
        this.mouseY = 0.5;
        this.mouseIntensity = 0.0;
        this.clickIntensity = 0.0;
        this.clickDecay = 0.95;
        
        // Touch and scroll
        this.touchX = 0.5;
        this.touchY = 0.5;
        this.touchActive = false;
        this.touchMorph = 0.0;
        this.touchChaos = 0.0;
        this.scrollPosition = 0.0;
        this.scrollVelocity = 0.0;
        this.scrollDecay = 0.92;
        this.parallaxDepth = 0.0;
        this.gridDensityShift = 0.0;
        this.colorScrollShift = 0.0;
        
        // Density system
        this.densityVariation = 0.0;
        this.densityTarget = 0.0;
        
        // Audio reactivity
        this.audioData = { bass: 0, mid: 0, high: 0 };
        this.audioDensityBoost = 0.0;
        this.audioMorphBoost = 0.0;
        this.audioSpeedBoost = 0.0;
        this.audioChaosBoost = 0.0;
        this.audioColorShift = 0.0;
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
            chaos: 0,
            densityBoost: 0,
            morphBoost: 0,
            speedBoost: 0,
            colorOrbit: 0,
            saturationPulse: 0,
            colorBeat: 0,
            accentLuma: 0,
            ribbon: 0,
            dimensionShift: 0,
            motionVelocity: 0
        };

        this.cameraLighting = {
            orbit: 0,
            elevation: 0.4,
            dolly: -0.18,
            roll: 0.15,
            exposure: 1.1,
            shutter: 0.7,
            bloom: 0.4,
            keyLight: 0.6,
            rimLight: 0.5,
            ambientLight: 0.28,
            vignette: 0.3,
            parallax: 0.0,
            focus: 0.9,
            focusSpread: 0.7,
            chromaticAberration: 0.1,
            lightTemperature: 0.55,
            shadowContrast: 0.5,
            fogDensity: 0.12,
            godrayIntensity: 0.22,
            filmGrain: 0.2,
            lensDistortion: 0.05,
            frameBlend: 0.34,
            lightWrap: 0.36,
            colorBleed: 0.3
        };
        this.audioSmooth = {
            density: 0,
            morph: 0,
            speed: 0,
            chaos: 0,
            orbit: 0,
            saturation: 0,
            dimension: 0,
            layerIntensity: 0,
            layerSpeed: 0,
            layerShimmer: 0
        };
        this.layerAudioIntensity = 0;
        this.layerAudioSpeed = 0;
        this.layerAudioShimmer = 0;

        this.startTime = Date.now();
        this.initShaders();
        this.initBuffers();

        // CRITICAL FIX: Enable alpha blending for transparency
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.resize();
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
        } else if (!this.colorState.secondary) {
            this.colorState.secondary = lerpColor(this.colorState.primary, [0.25, 0.28, 0.35], 0.35);
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
            this.colorState.highlight = lerpColor(this.colorState.accent, [1, 1, 1], 0.28);
        }

        if (!this.colorState.secondary) {
            this.colorState.secondary = lerpColor(this.colorState.primary, this.colorState.shadow, 0.25);
        }
    }
    
    generateVariantParams(variant) {
        const vib3Geometries = [
            'TETRAHEDRON', 'HYPERCUBE', 'SPHERE', 'TORUS', 
            'KLEIN BOTTLE', 'FRACTAL', 'WAVE', 'CRYSTAL'
        ];
        
        const geometryMap = [
            0, 0, 0, 0,  // 0-3: TETRAHEDRON variations
            1, 1, 1, 1,  // 4-7: HYPERCUBE variations
            2, 2, 2, 2,  // 8-11: SPHERE variations
            3, 3, 3, 3,  // 12-15: TORUS variations
            4, 4, 4, 4,  // 16-19: KLEIN BOTTLE variations
            5, 5, 5,     // 20-22: FRACTAL variations
            6, 6, 6,     // 23-25: WAVE variations
            7, 7, 7, 7   // 26-29: CRYSTAL variations
        ];
        
        const baseGeometry = geometryMap[variant] || 0;
        const variationLevel = variant % 4;
        const geometryName = vib3Geometries[baseGeometry];
        
        const suffixes = [' LATTICE', ' FIELD', ' MATRIX', ' RESONANCE'];
        const finalName = geometryName + suffixes[variationLevel];
        
        const geometryConfigs = {
            0: { density: 0.8 + variationLevel * 0.2, speed: 0.3 + variationLevel * 0.1, chaos: variationLevel * 0.1, morph: 0.0 + variationLevel * 0.2 },
            1: { density: 1.0 + variationLevel * 0.3, speed: 0.5 + variationLevel * 0.1, chaos: variationLevel * 0.15, morph: variationLevel * 0.2 },
            2: { density: 1.2 + variationLevel * 0.4, speed: 0.4 + variationLevel * 0.2, chaos: 0.1 + variationLevel * 0.1, morph: 0.3 + variationLevel * 0.2 },
            3: { density: 0.9 + variationLevel * 0.3, speed: 0.6 + variationLevel * 0.2, chaos: 0.2 + variationLevel * 0.2, morph: 0.5 + variationLevel * 0.1 },
            4: { density: 1.4 + variationLevel * 0.5, speed: 0.7 + variationLevel * 0.1, chaos: 0.3 + variationLevel * 0.2, morph: 0.7 + variationLevel * 0.1 },
            5: { density: 1.8 + variationLevel * 0.3, speed: 0.5 + variationLevel * 0.3, chaos: 0.5 + variationLevel * 0.2, morph: 0.8 + variationLevel * 0.05 },
            6: { density: 0.6 + variationLevel * 0.4, speed: 0.8 + variationLevel * 0.4, chaos: 0.4 + variationLevel * 0.3, morph: 0.6 + variationLevel * 0.2 },
            7: { density: 1.6 + variationLevel * 0.2, speed: 0.2 + variationLevel * 0.1, chaos: 0.1 + variationLevel * 0.1, morph: 0.2 + variationLevel * 0.2 }
        };
        
        const config = geometryConfigs[baseGeometry];
        
        return {
            geometryType: baseGeometry,
            name: finalName,
            density: config.density,
            speed: config.speed,
            hue: (variant * 12.27) % 360,
            saturation: 0.8 + (variationLevel * 0.05), // Add saturation parameter
            intensity: 0.5 + (variationLevel * 0.1),
            chaos: config.chaos,
            morph: config.morph
        };
    }
    
    generateRoleParams(role) {
        const vp = this.variantParams;
        
        const roleConfigs = {
            'background': { 
                densityMult: 0.4, speedMult: 0.2, colorShift: 0.0, intensity: 0.2,
                mouseReactivity: 0.3, clickReactivity: 0.1 
            },
            'shadow': { 
                densityMult: 0.8, speedMult: 0.3, colorShift: 180.0, intensity: 0.4,
                mouseReactivity: 0.5, clickReactivity: 0.3 
            },
            'content': { 
                densityMult: vp.density, speedMult: vp.speed, 
                colorShift: vp.hue, intensity: vp.intensity,
                mouseReactivity: 1.0, clickReactivity: 0.8 
            },
            'highlight': { 
                densityMult: 1.5 + (vp.density * 0.3), speedMult: 0.8 + (vp.speed * 0.2), 
                colorShift: vp.hue + 60.0, intensity: 0.6 + (vp.intensity * 0.2),
                mouseReactivity: 1.2, clickReactivity: 1.0 
            },
            'accent': { 
                densityMult: 2.5 + (vp.density * 0.5), speedMult: 0.4 + (vp.speed * 0.1), 
                colorShift: vp.hue + 300.0, intensity: 0.3 + (vp.intensity * 0.1),
                mouseReactivity: 1.5, clickReactivity: 1.2 
            }
        };
        
        return roleConfigs[role] || { 
            densityMult: 1.0, speedMult: 0.5, colorShift: 0.0, intensity: 0.5, 
            mouseReactivity: 1.0, clickReactivity: 0.5 
        };
    }
    
    initShaders() {
        const vertexShaderSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        const fragmentShaderSource = `
            precision highp float;
            
            uniform vec2 u_resolution;
            uniform float u_time;
            uniform vec2 u_mouse;
            uniform float u_geometry;
            uniform float u_density;
            uniform float u_speed;
            uniform vec3 u_color;
            uniform float u_intensity;
            uniform float u_roleDensity;
            uniform float u_roleSpeed;
            uniform float u_colorShift;
            uniform float u_chaosIntensity;
            uniform float u_mouseIntensity;
            uniform float u_clickIntensity;
            uniform float u_densityVariation;
            uniform float u_geometryType;
            uniform float u_chaos;
            uniform float u_morph;
            uniform float u_touchMorph;
            uniform float u_touchChaos;
            uniform float u_scrollParallax;
            uniform float u_gridDensityShift;
            uniform float u_colorScrollShift;
            uniform float u_audioDensityBoost;
            uniform float u_audioMorphBoost;
            uniform float u_audioSpeedBoost;
            uniform float u_audioChaosBoost;
            uniform float u_audioColorShift;
            uniform float u_rot4dXW;
            uniform float u_rot4dYW;
            uniform float u_rot4dZW;
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
                return mat4(c, 0, 0, -s, 0, 1, 0, 0, 0, 0, 1, 0, s, 0, 0, c);
            }
            
            mat4 rotateYW(float theta) {
                float c = cos(theta);
                float s = sin(theta);
                return mat4(1, 0, 0, 0, 0, c, 0, -s, 0, 0, 1, 0, 0, s, 0, c);
            }
            
            mat4 rotateZW(float theta) {
                float c = cos(theta);
                float s = sin(theta);
                return mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, c, -s, 0, 0, s, c);
            }
            
            // 4D to 3D projection
            vec3 project4Dto3D(vec4 p) {
                float w = 2.5 / (2.5 + p.w);
                return vec3(p.x * w, p.y * w, p.z * w);
            }
            
            // Enhanced VIB3 Geometry Library - Higher Fidelity
            float tetrahedronLattice(vec3 p, float gridSize) {
                vec3 q = fract(p * gridSize) - 0.5;
                
                // Enhanced tetrahedron vertices with holographic shimmer
                float d1 = length(q);
                float d2 = length(q - vec3(0.35, 0.0, 0.0));
                float d3 = length(q - vec3(0.0, 0.35, 0.0));
                float d4 = length(q - vec3(0.0, 0.0, 0.35));
                float d5 = length(q - vec3(0.2, 0.2, 0.0));
                float d6 = length(q - vec3(0.2, 0.0, 0.2));
                float d7 = length(q - vec3(0.0, 0.2, 0.2));
                
                float vertices = 1.0 - smoothstep(0.0, 0.03, min(min(min(d1, d2), min(d3, d4)), min(min(d5, d6), d7)));
                
                // Enhanced edge network with interference patterns
                float edges = 0.0;
                float shimmer = sin(u_time * 0.002) * 0.02;
                edges = max(edges, 1.0 - smoothstep(0.0, 0.015, abs(length(q.xy) - (0.18 + shimmer))));
                edges = max(edges, 1.0 - smoothstep(0.0, 0.015, abs(length(q.yz) - (0.18 + shimmer * 0.8))));
                edges = max(edges, 1.0 - smoothstep(0.0, 0.015, abs(length(q.xz) - (0.18 + shimmer * 1.2))));
                
                // Add interference patterns between vertices
                float interference = sin(d1 * 25.0 + u_time * 0.003) * sin(d2 * 22.0 + u_time * 0.0025) * 0.1;
                
                // Volumetric density based on distance field
                float volume = exp(-length(q) * 3.0) * 0.15;
                
                return max(vertices, edges * 0.7) + interference + volume;
            }
            
            float hypercubeLattice(vec3 p, float gridSize) {
                vec3 grid = fract(p * gridSize);
                vec3 q = grid - 0.5;
                
                // Enhanced hypercube with 4D projection effects
                vec3 edges = 1.0 - smoothstep(0.0, 0.025, abs(q));
                float wireframe = max(max(edges.x, edges.y), edges.z);
                
                // Add 4D hypercube vertices (8 corners + 8 hypervertices)
                float vertices = 0.0;
                for(int i = 0; i < 8; i++) {
                    // WebGL 1.0 compatible modulus replacement
                    float iFloat = float(i);
                    vec3 corner = vec3(
                        floor(iFloat - floor(iFloat / 2.0) * 2.0) - 0.5,
                        floor((iFloat / 2.0) - floor((iFloat / 2.0) / 2.0) * 2.0) - 0.5,
                        float(i / 4) - 0.5
                    );
                    float dist = length(q - corner * 0.4);
                    vertices = max(vertices, 1.0 - smoothstep(0.0, 0.04, dist));
                }
                
                // Holographic interference patterns
                float interference = sin(length(q) * 20.0 + u_time * 0.002) * 0.08;
                
                // Cross-dimensional glow
                float glow = exp(-length(q) * 2.5) * 0.12;
                
                return wireframe * 0.8 + vertices + interference + glow;
            }
            
            float sphereLattice(vec3 p, float gridSize) {
                vec3 q = fract(p * gridSize) - 0.5;
                float r = length(q);
                return 1.0 - smoothstep(0.2, 0.5, r);
            }
            
            float torusLattice(vec3 p, float gridSize) {
                vec3 q = fract(p * gridSize) - 0.5;
                float r1 = sqrt(q.x*q.x + q.y*q.y);
                float r2 = sqrt((r1 - 0.3)*(r1 - 0.3) + q.z*q.z);
                return 1.0 - smoothstep(0.0, 0.1, r2);
            }
            
            float kleinLattice(vec3 p, float gridSize) {
                vec3 q = fract(p * gridSize);
                float u = q.x * 2.0 * 3.14159;
                float v = q.y * 2.0 * 3.14159;
                float x = cos(u) * (3.0 + cos(u/2.0) * sin(v) - sin(u/2.0) * sin(2.0*v));
                float klein = length(vec2(x, q.z)) - 0.1;
                return 1.0 - smoothstep(0.0, 0.05, abs(klein));
            }
            
            float fractalLattice(vec3 p, float gridSize) {
                vec3 q = p * gridSize;
                float scale = 1.0;
                float fractal = 0.0;
                for(int i = 0; i < 4; i++) {
                  q = fract(q) - 0.5;
                  fractal += abs(length(q)) / scale;
                  scale *= 2.0;
                  q *= 2.0;
                }
                return 1.0 - smoothstep(0.0, 1.0, fractal);
            }
            
            float waveLattice(vec3 p, float gridSize) {
                vec3 q = p * gridSize;
                float wave = sin(q.x * 2.0) * sin(q.y * 2.0) * sin(q.z * 2.0 + u_time);
                return smoothstep(-0.5, 0.5, wave);
            }
            
            float crystalLattice(vec3 p, float gridSize) {
                vec3 q = fract(p * gridSize) - 0.5;
                float d = max(max(abs(q.x), abs(q.y)), abs(q.z));
                return 1.0 - smoothstep(0.3, 0.5, d);
            }
            
            float getDynamicGeometry(vec3 p, float gridSize, float geometryType) {
                // WebGL 1.0 compatible modulus replacement
                float baseGeomFloat = geometryType - floor(geometryType / 8.0) * 8.0;
                int baseGeom = int(baseGeomFloat);
                float variation = floor(geometryType / 8.0) / 4.0;
                float variedGridSize = gridSize * (0.5 + variation * 1.5);
                
                if (baseGeom == 0) return tetrahedronLattice(p, variedGridSize);
                else if (baseGeom == 1) return hypercubeLattice(p, variedGridSize);
                else if (baseGeom == 2) return sphereLattice(p, variedGridSize);
                else if (baseGeom == 3) return torusLattice(p, variedGridSize);
                else if (baseGeom == 4) return kleinLattice(p, variedGridSize);
                else if (baseGeom == 5) return fractalLattice(p, variedGridSize);
                else if (baseGeom == 6) return waveLattice(p, variedGridSize);
                else return crystalLattice(p, variedGridSize);
            }
            
            vec3 hsv2rgb(vec3 c) {
                vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
            }
            
            vec3 rgbGlitch(vec3 color, vec2 uv, float intensity) {
                vec2 offset = vec2(intensity * 0.005, 0.0);
                float r = color.r + sin(uv.y * 30.0 + u_time * 0.001) * intensity * 0.06;
                float g = color.g + sin(uv.y * 28.0 + u_time * 0.0012) * intensity * 0.06;
                float b = color.b + sin(uv.y * 32.0 + u_time * 0.0008) * intensity * 0.06;
                return vec3(r, g, b);
            }
            
            float moirePattern(vec2 uv, float intensity) {
                float freq1 = 12.0 + intensity * 6.0 + u_densityVariation * 3.0;
                float freq2 = 14.0 + intensity * 8.0 + u_densityVariation * 4.0;
                float pattern1 = sin(uv.x * freq1) * sin(uv.y * freq1);
                float pattern2 = sin(uv.x * freq2) * sin(uv.y * freq2);
                return (pattern1 * pattern2) * intensity * 0.15;
            }
            
            float gridOverlay(vec2 uv, float intensity) {
                vec2 grid = fract(uv * (8.0 + u_densityVariation * 4.0));
                float lines = 0.0;
                lines = max(lines, 1.0 - smoothstep(0.0, 0.02, abs(grid.x - 0.5)));
                lines = max(lines, 1.0 - smoothstep(0.0, 0.02, abs(grid.y - 0.5)));
                return lines * intensity * 0.1;
            }
            
            void main() {
                vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                float aspectRatio = u_resolution.x / u_resolution.y;
                uv.x = (uv.x - 0.5) * aspectRatio;
                uv.y -= 0.5;

                float orbitAngle = u_cameraOrbit;
                mat2 orbitMat = mat2(cos(orbitAngle), -sin(orbitAngle), sin(orbitAngle), cos(orbitAngle));
                uv = orbitMat * uv;

                float rollAngle = u_cameraRoll;
                mat2 rollMat = mat2(cos(rollAngle), -sin(rollAngle), sin(rollAngle), cos(rollAngle));
                uv = rollMat * uv;

                float zoomFactor = exp(-u_cameraDolly);
                uv *= zoomFactor;

                float elevation = u_cameraElevation;
                uv.y += sin(elevation) * (0.32 + abs(u_cameraDolly) * 0.2);
                uv.x += sin(elevation * 0.55) * 0.1;
                
                float time = u_time * 0.0004 * u_speed * u_roleSpeed;
                
                float mouseInfluence = u_mouseIntensity * 0.25; // FIX: Reduce mouse jarring by 50%
                vec2 mouseOffset = (u_mouse - 0.5) * mouseInfluence;
                
                float parallaxOffset = u_scrollParallax * 0.2;
                vec2 scrollOffset = vec2(parallaxOffset * 0.1, parallaxOffset * 0.05);
                
                float morphOffset = u_touchMorph * 0.3;
                
                vec4 p4d = vec4(uv + mouseOffset * 0.1 + scrollOffset, 
                               sin(time * 0.1 + morphOffset) * 0.15, 
                               cos(time * 0.08 + morphOffset * 0.5) * 0.15);
                
                float scrollRotation = u_scrollParallax * 0.1;
                float touchRotation = u_touchMorph * 0.2;
                
                // Combine manual rotation with automatic/interactive rotation
                p4d = rotateXW(u_rot4dXW + time * 0.2 + mouseOffset.y * 0.5 + scrollRotation) * p4d;
                p4d = rotateYW(u_rot4dYW + time * 0.15 + mouseOffset.x * 0.5 + touchRotation) * p4d;
                p4d = rotateZW(u_rot4dZW + time * 0.25 + u_clickIntensity * 0.3 + u_touchChaos * 0.4) * p4d;
                
                vec3 p = project4Dto3D(p4d);
                
                float scrollDensityMod = 1.0 + u_gridDensityShift * 0.3;
                float audioDensityMod = 1.0 + u_audioDensityBoost * 0.5;
                // FIX: Prevent density doubling by using base density with controlled variations
                float baseDensity = u_density * u_roleDensity;
                float densityVariations = (u_densityVariation * 0.3 + (scrollDensityMod - 1.0) * 0.4 + (audioDensityMod - 1.0) * 0.2);
                float roleDensity = baseDensity + densityVariations;
                
                float morphedGeometry = u_geometryType + u_morph * 3.0 + u_touchMorph * 2.0 + u_audioMorphBoost * 1.5;
                float lattice = getDynamicGeometry(p, roleDensity, morphedGeometry);
                
                // Enhanced holographic color processing
                vec3 baseColor = u_color;
                float latticeIntensity = lattice * u_intensity;
                
                // Multi-layer color composition for higher fidelity
                vec3 color = baseColor * (0.2 + latticeIntensity * 0.8);
                
                // Holographic shimmer layers
                vec3 shimmer1 = baseColor * lattice * 0.5;
                vec3 shimmer2 = baseColor * sin(lattice * 8.0 + u_time * 0.001) * 0.2;
                vec3 shimmer3 = baseColor * cos(lattice * 12.0 + u_time * 0.0008) * 0.15;
                
                color += shimmer1 + shimmer2 + shimmer3;
                
                // Enhanced brightness variations with interference
                color += vec3(lattice * 0.6) * baseColor;
                color += vec3(sin(lattice * 15.0) * 0.1) * baseColor;
                
                // Depth-based coloring for 3D effect
                float depth = 1.0 - length(p) * 0.3;
                color *= (0.7 + depth * 0.3);
                
                float enhancedChaos = u_chaos + u_chaosIntensity + u_touchChaos * 0.3 + u_audioChaosBoost * 0.4;
                color += vec3(moirePattern(uv + scrollOffset, enhancedChaos));
                color += vec3(gridOverlay(uv, u_mouseIntensity + u_scrollParallax * 0.1));
                color = rgbGlitch(color, uv, enhancedChaos);
                
                // Apply morph distortion to position
                vec2 morphDistortion = vec2(sin(uv.y * 10.0 + u_time * 0.001) * u_morph * 0.1, 
                                           cos(uv.x * 10.0 + u_time * 0.001) * u_morph * 0.1);
                color = mix(color, color * (1.0 + length(morphDistortion)), u_morph * 0.5);
                
                // Enhanced holographic interaction effects
                float mouseDist = length(uv - (u_mouse - 0.5) * vec2(aspectRatio, 1.0));
                
                // Multi-layer mouse glow with holographic ripples
                float mouseGlow = exp(-mouseDist * 1.2) * u_mouseIntensity * 0.25;
                float mouseRipple = sin(mouseDist * 15.0 - u_time * 0.003) * exp(-mouseDist * 2.0) * u_mouseIntensity * 0.1;
                color += vec3(mouseGlow + mouseRipple) * baseColor * 0.8;
                
                // Enhanced click pulse with interference
                float clickPulse = u_clickIntensity * exp(-mouseDist * 1.8) * 0.4;
                float clickRing = sin(mouseDist * 20.0 - u_clickIntensity * 5.0) * u_clickIntensity * 0.15;
                color += vec3(clickPulse + clickRing, (clickPulse + clickRing) * 0.6, (clickPulse + clickRing) * 1.2);
                
                // Holographic interference from interactions
                float interference = sin(mouseDist * 25.0 + u_time * 0.002) * u_mouseIntensity * 0.05;
                color += vec3(interference) * baseColor;

                vec3 filmColor = color;
                float exposure = max(0.1, u_exposure);
                vec3 toneMapped = vec3(1.0) - exp(-filmColor * exposure);
                float shutter = clamp(u_shutter, 0.2, 3.0);
                toneMapped = pow(clamp(toneMapped, 0.0, 6.0), vec3(1.0 / shutter));
                vec3 bloom = pow(clamp(filmColor, 0.0, 10.0), vec3(1.2)) * clamp(u_bloom, 0.0, 3.0);
                toneMapped += bloom;

                float rim = clamp(u_rimLight, 0.0, 1.5) * pow(clamp(length(p), 0.0, 1.0), 1.2);
                toneMapped += rim * vec3(0.55, 0.85, 1.1);

                float key = clamp(u_keyLight, 0.0, 2.0);
                toneMapped *= (0.68 + key * 0.5);

                float ambient = clamp(u_ambientLight, 0.0, 1.0);
                toneMapped = mix(vec3(ambient), toneMapped, 0.88 + ambient * 0.1);

                float vignette = mix(1.0, smoothstep(1.35, 0.25, length(uv) * (1.0 + u_cameraDolly * 0.35)), clamp(u_vignette, 0.0, 1.0));
                toneMapped *= vignette;

                float parallaxWarp = clamp(u_cameraParallax, -1.1, 1.1);
                vec2 parallaxUv = uv + uv * parallaxWarp * 0.1;
                float lensDistortion = clamp(u_lensDistortion, -0.5, 0.8);
                float radiusSq = dot(parallaxUv, parallaxUv);
                parallaxUv *= 1.0 + lensDistortion * radiusSq;
                float focusSpread = max(0.05, u_focusSpread);
                float focusDistance = clamp(u_focusDistance, 0.0, 2.8);
                float focusFalloff = exp(-pow(length(parallaxUv) - focusDistance, 2.0) * (1.9 + focusSpread * 2.2));
                float fogFactor = exp(-pow(length(parallaxUv), 2.0) * (0.7 + clamp(u_fogDensity, 0.0, 1.6) * 1.4));
                float shadowMix = clamp(0.58 + clamp(u_shadowContrast, 0.0, 2.0) * 0.32, 0.0, 1.0);

                vec3 fogColor = mix(vec3(0.14, 0.16, 0.22), vec3(0.24, 0.28, 0.35), clamp(u_lightTemperature, 0.0, 1.2));
                toneMapped = mix(fogColor, toneMapped, clamp(fogFactor + focusFalloff * 0.4, 0.0, 1.0));

                vec3 coolGrade = vec3(0.68, 0.92, 1.08);
                vec3 warmGrade = vec3(1.12, 0.94, 0.76);
                toneMapped *= mix(coolGrade, warmGrade, clamp(u_lightTemperature, 0.0, 1.3));

                vec3 luminanceVec = vec3(0.299, 0.587, 0.114);
                float luminance = dot(toneMapped, luminanceVec);
                toneMapped = mix(vec3(luminance * (0.82 + shadowMix * 0.45)), toneMapped, shadowMix);

                float lightWrap = clamp(u_lightWrap, 0.0, 1.6);
                vec3 wrapColor = mix(
                    toneMapped,
                    vec3(luminance),
                    clamp(lightWrap * (0.3 + focusFalloff * 0.5), 0.0, 0.8)
                );
                toneMapped = mix(toneMapped, wrapColor, clamp(lightWrap, 0.0, 1.0));

                float aberration = clamp(u_chromaticAberration, 0.0, 1.0);
                toneMapped.rg *= vec2(
                    1.0 + sin(parallaxUv.y * 8.0 + u_time * 0.0015) * aberration * 0.1,
                    1.0 - sin(parallaxUv.x * 6.5 - u_time * 0.0012) * aberration * 0.08
                );
                toneMapped.b *= 1.0 + cos(parallaxUv.x * 9.0 + parallaxUv.y * 5.0 + u_time * 0.0018) * aberration * 0.07;

                float godrayAngle = atan(parallaxUv.y, parallaxUv.x);
                float godrayWave = max(0.0, sin(godrayAngle * 5.5 + u_time * 0.0025));
                float godrayDistance = exp(-length(parallaxUv) * (1.3 - parallaxWarp * 0.5));
                float godray = godrayWave * godrayDistance * focusFalloff;
                toneMapped += vec3(0.36, 0.44, 0.6) * godray * clamp(u_godrayIntensity, 0.0, 1.8);

                toneMapped += vec3(0.16, 0.12, 0.26) * parallaxWarp * (0.45 + focusFalloff * 0.55);

                float frameBlend = clamp(u_frameBlend, 0.0, 1.2);
                float streak = sin(u_time * 0.004 + radiusSq * 70.0) * 0.5 + 0.5;
                vec3 motionTint = mix(vec3(0.82, 0.72, 1.05), vec3(1.18, 0.86, 0.68), clamp(u_lightTemperature, 0.0, 1.2));
                toneMapped = mix(
                    toneMapped,
                    toneMapped * mix(vec3(1.0), motionTint, clamp(streak, 0.0, 1.0)),
                    clamp(frameBlend * 0.32, 0.0, 0.75)
                );

                float colorBleed = clamp(u_colorBleed, 0.0, 1.6);
                vec3 bleedColor = vec3(
                    toneMapped.r + toneMapped.g * 0.12,
                    toneMapped.g + toneMapped.b * 0.12,
                    toneMapped.b + toneMapped.r * 0.12
                );
                toneMapped = mix(toneMapped, bleedColor, clamp(colorBleed * 0.3, 0.0, 0.6));

                float filmGrain = clamp(u_filmGrain, 0.0, 1.8);
                float grain = fract(sin(dot(parallaxUv * 110.0, vec2(43.2321, 17.719))) * 43758.5453 + u_time * 0.007);
                grain = (grain - 0.5) * 2.0;
                toneMapped += grain * filmGrain * 0.05;
                toneMapped = clamp(toneMapped, 0.0, 5.0);

                gl_FragColor = vec4(toneMapped, 0.95);
            }
        `;
        
        this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
        this.uniforms = {
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
            time: this.gl.getUniformLocation(this.program, 'u_time'),
            mouse: this.gl.getUniformLocation(this.program, 'u_mouse'),
            geometry: this.gl.getUniformLocation(this.program, 'u_geometry'),
            density: this.gl.getUniformLocation(this.program, 'u_density'),
            speed: this.gl.getUniformLocation(this.program, 'u_speed'),
            color: this.gl.getUniformLocation(this.program, 'u_color'),
            intensity: this.gl.getUniformLocation(this.program, 'u_intensity'),
            roleDensity: this.gl.getUniformLocation(this.program, 'u_roleDensity'),
            roleSpeed: this.gl.getUniformLocation(this.program, 'u_roleSpeed'),
            colorShift: this.gl.getUniformLocation(this.program, 'u_colorShift'),
            chaosIntensity: this.gl.getUniformLocation(this.program, 'u_chaosIntensity'),
            mouseIntensity: this.gl.getUniformLocation(this.program, 'u_mouseIntensity'),
            clickIntensity: this.gl.getUniformLocation(this.program, 'u_clickIntensity'),
            densityVariation: this.gl.getUniformLocation(this.program, 'u_densityVariation'),
            geometryType: this.gl.getUniformLocation(this.program, 'u_geometryType'),
            chaos: this.gl.getUniformLocation(this.program, 'u_chaos'),
            morph: this.gl.getUniformLocation(this.program, 'u_morph'),
            touchMorph: this.gl.getUniformLocation(this.program, 'u_touchMorph'),
            touchChaos: this.gl.getUniformLocation(this.program, 'u_touchChaos'),
            scrollParallax: this.gl.getUniformLocation(this.program, 'u_scrollParallax'),
            gridDensityShift: this.gl.getUniformLocation(this.program, 'u_gridDensityShift'),
            colorScrollShift: this.gl.getUniformLocation(this.program, 'u_colorScrollShift'),
            audioDensityBoost: this.gl.getUniformLocation(this.program, 'u_audioDensityBoost'),
            audioMorphBoost: this.gl.getUniformLocation(this.program, 'u_audioMorphBoost'),
            audioSpeedBoost: this.gl.getUniformLocation(this.program, 'u_audioSpeedBoost'),
            audioChaosBoost: this.gl.getUniformLocation(this.program, 'u_audioChaosBoost'),
            audioColorShift: this.gl.getUniformLocation(this.program, 'u_audioColorShift'),
            rot4dXW: this.gl.getUniformLocation(this.program, 'u_rot4dXW'),
            rot4dYW: this.gl.getUniformLocation(this.program, 'u_rot4dYW'),
            rot4dZW: this.gl.getUniformLocation(this.program, 'u_rot4dZW'),
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
    
    createProgram(vertexSource, fragmentSource) {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            throw new Error('Program linking failed: ' + this.gl.getProgramInfoLog(program));
        }
        
        return program;
    }
    
    createShader(type, source) {
        // CRITICAL FIX: Check WebGL context state before shader operations
        if (!this.gl) {
            console.error('❌ Cannot create shader: WebGL context is null');
            throw new Error('WebGL context is null');
        }
        
        if (this.gl.isContextLost()) {
            console.error('❌ Cannot create shader: WebGL context is lost');
            throw new Error('WebGL context is lost');
        }
        
        try {
            const shader = this.gl.createShader(type);
            
            if (!shader) {
                console.error('❌ Failed to create shader object - WebGL context may be invalid');
                throw new Error('Failed to create shader object - WebGL context may be invalid');
            }
            
            this.gl.shaderSource(shader, source);
            this.gl.compileShader(shader);
            
            if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
                const error = this.gl.getShaderInfoLog(shader);
                const shaderType = type === this.gl.VERTEX_SHADER ? 'vertex' : 'fragment';
                
                // CRITICAL FIX: Show actual error instead of null
                if (error) {
                    console.error(`❌ ${shaderType} shader compilation failed:`, error);
                    throw new Error(`${shaderType} shader compilation failed: ${error}`);
                } else {
                    console.error(`❌ ${shaderType} shader compilation failed: WebGL returned no error info (context may be invalid)`);
                    throw new Error(`${shaderType} shader compilation failed: WebGL returned no error info (context may be invalid)`);
                }
            }
            
            return shader;
        } catch (error) {
            console.error('❌ Exception during shader creation:', error);
            throw error;
        }
    }
    
    initBuffers() {
        const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        
        this.buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
        
        const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    }
    
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
        const ctx = this.canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = '#ff64ff';
            ctx.font = '16px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('WebGL Required', this.canvas.width / 2, this.canvas.height / 2);
            ctx.fillStyle = '#888';
            ctx.font = '12px Orbitron, monospace';
            ctx.fillText('Please enable WebGL in your browser', this.canvas.width / 2, this.canvas.height / 2 + 25);
        }
    }
    
    updateInteraction(mouseX, mouseY, intensity) {
        this.mouseX = mouseX;
        this.mouseY = mouseY;
        this.mouseIntensity = intensity * this.roleParams.mouseReactivity * this.reactivity;
    }
    
    triggerClick(x, y) {
        this.clickIntensity = Math.min(1.0, this.clickIntensity + this.roleParams.clickReactivity * this.reactivity);
    }
    
    updateDensity(variation) {
        this.densityTarget = variation;
    }
    
    updateTouch(touchX, touchY, active) {
        this.touchX = touchX;
        this.touchY = touchY;
        this.touchActive = active;
        this.touchMorph = (touchX - 0.5) * 2.0;
        this.touchChaos = Math.abs(touchY - 0.5) * 2.0;
    }
    
    updateScroll(deltaY) {
        this.scrollVelocity += deltaY * 0.001;
        this.scrollVelocity = Math.max(-2.0, Math.min(2.0, this.scrollVelocity));
    }
    
    // Audio reactivity now handled directly in render() loop
    updateAudio_DISABLED() {
        return; // No longer used - audio handled in render()

        // Musical visualization approach - responsive but controlled
        const smoothing = 0.6; // Less smoothing for more reactivity
        
        // Initialize if needed
        if (!this.audioSmooth) {
            this.audioSmooth = {
                density: 0, morph: 0, speed: 0, chaos: 0, color: 0, beat: 0
            };
        }
        
        // Speed: More responsive to rhythm and bass
        const targetSpeed = audioData.rhythm > 0 ? audioData.rhythm * 0.8 : 
                           audioData.bass > 0.3 ? audioData.bass * 0.6 : 0;
        this.audioSmooth.speed = this.audioSmooth.speed * smoothing + targetSpeed * (1 - smoothing);
        this.audioSpeedBoost = this.audioSmooth.speed;
        
        // Density: More reactive to energy
        const targetDensity = audioData.energy * 1.2 + audioData.bass * 0.8;
        this.audioSmooth.density = this.audioSmooth.density * smoothing + targetDensity * (1 - smoothing);
        this.audioDensityBoost = this.audioSmooth.density;
        
        // Morph: More flowing with melody and mid frequencies
        const targetMorph = audioData.melody * 1.2 + audioData.mid * 0.8;
        this.audioSmooth.morph = this.audioSmooth.morph * smoothing + targetMorph * (1 - smoothing);
        this.audioMorphBoost = this.audioSmooth.morph;
        
        // Chaos: More responsive to bass and high frequencies
        const targetChaos = audioData.bass > 0.4 ? audioData.bass * 0.8 : 
                           audioData.high > 0.6 ? audioData.high * 0.6 : 0;
        this.audioSmooth.chaos = this.audioSmooth.chaos * smoothing + targetChaos * (1 - smoothing);
        this.audioChaosBoost = this.audioSmooth.chaos;
        
        // Color: More dynamic color shifting
        const targetColor = (audioData.melody + audioData.high + audioData.mid) * 0.6;
        this.audioSmooth.color = this.audioSmooth.color * smoothing + targetColor * (1 - smoothing);
        this.audioColorShift = this.audioSmooth.color * Math.PI;
        
        // Beat detection creates sharp visual pulses
        if (audioData.rhythm > 0.5) { // Lower threshold for beat detection
            this.clickIntensity = Math.max(this.clickIntensity, 1.0);
            this.audioSmooth.beat = 1.0;
        }
        this.audioSmooth.beat *= 0.8; // Faster beat decay for more responsive pulses
    }

    setAudioChoreography(audioData = {}) {
        const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value ?? 0));
        const smoothingBlend = (key, target, smoothing = 0.55) => {
            const current = this.audioSmooth[key] ?? 0;
            const next = current * smoothing + target * (1 - smoothing);
            this.audioSmooth[key] = next;
            return next;
        };

        const bands = audioData.bands || {};
        const rhythm = audioData.rhythmPhases || {};
        const dynamics = audioData.extremeDynamics || {};
        const color = audioData.colorChoreography || {};

        const bass = clamp(bands.bass);
        const mid = clamp(bands.mid);
        const high = clamp(bands.high);
        const energy = clamp(audioData.rms ?? audioData.energy ?? 0);
        const onsetStrength = clamp(
            Math.max(
                typeof audioData.onset === 'number' ? audioData.onset : 0,
                audioData.onsetEvent?.strength || 0,
                dynamics.transientBurst || 0
            )
        );

        const densityTarget = Math.min(2.5, bass * 1.8 + energy * 0.6);
        const morphTarget = Math.min(2.0, mid * 1.2 + (dynamics.dimensionLift || 0) * 0.9);
        const speedTarget = Math.min(2.2, energy * 0.7 + (dynamics.motionVelocity || 0) * 1.1 + Math.abs(rhythm.swingPulse || 0) * 0.4);
        const chaosTarget = Math.min(2.0, high * 1.1 + (dynamics.chaosSurge || 0) * 1.2);
        const orbitTarget = ((color.orbit ?? 0) + (rhythm.beatPhase || 0) * 0.1 + (rhythm.tripletPulse || 0) * 0.05) % 1;
        const saturationTarget = clamp((color.saturationPulse ?? 0) + (color.downbeatColor ?? 0) * 0.4);
        const dimensionTarget = Math.min(1.5, (dynamics.dimensionLift || 0) + energy * 0.2);

        this.audioDensityBoost = smoothingBlend('density', densityTarget, 0.55);
        this.audioMorphBoost = smoothingBlend('morph', morphTarget, 0.55);
        this.audioSpeedBoost = smoothingBlend('speed', speedTarget, 0.5);
        this.audioChaosBoost = smoothingBlend('chaos', chaosTarget, 0.5);
        const orbit = smoothingBlend('orbit', orbitTarget, 0.65);
        const saturation = smoothingBlend('saturation', saturationTarget, 0.6);
        const dimensionShift = smoothingBlend('dimension', dimensionTarget, 0.6);

        const intensityLayer = smoothingBlend('layerIntensity', clamp(bass + onsetStrength * 0.7), 0.6);
        const speedLayer = smoothingBlend('layerSpeed', clamp(speedTarget, 0, 2.5), 0.6);
        const shimmerLayer = smoothingBlend(
            'layerShimmer',
            clamp(high + (color.accentLuma || 0) * 0.6 + (color.ribbon || 0) * 0.3),
            0.6
        );

        this.layerAudioIntensity = intensityLayer;
        this.layerAudioSpeed = speedLayer;
        this.layerAudioShimmer = shimmerLayer;

        this.audioColorShift = orbit * Math.PI * 2;

        this.audioChoreo = {
            bass,
            mid,
            high,
            energy,
            onset: onsetStrength,
            swing: rhythm.swingPulse || 0,
            triplet: rhythm.tripletPulse || 0,
            beatPhase: rhythm.beatPhase || 0,
            measurePhase: rhythm.measurePhase || 0,
            chaos: this.audioChaosBoost,
            densityBoost: this.audioDensityBoost,
            morphBoost: this.audioMorphBoost,
            speedBoost: this.audioSpeedBoost,
            colorOrbit: orbit,
            saturationPulse: saturation,
            colorBeat: clamp(color.downbeatColor ?? 0),
            accentLuma: clamp(color.accentLuma ?? 0),
            ribbon: clamp(color.ribbon ?? 0),
            dimensionShift,
            motionVelocity: dynamics.motionVelocity || 0
        };
    }

    setLayerIntensity(value = 0) {
        const target = Math.max(0, value);
        this.audioSmooth.layerIntensity = (this.audioSmooth.layerIntensity ?? 0) * 0.6 + target * 0.4;
        this.layerAudioIntensity = this.audioSmooth.layerIntensity;
    }

    setLayerSpeed(value = 0) {
        const target = Math.max(0, value);
        this.audioSmooth.layerSpeed = (this.audioSmooth.layerSpeed ?? 0) * 0.6 + target * 0.4;
        this.layerAudioSpeed = this.audioSmooth.layerSpeed;
    }

    setShimmerIntensity(value = 0) {
        const target = Math.max(0, value);
        this.audioSmooth.layerShimmer = (this.audioSmooth.layerShimmer ?? 0) * 0.6 + target * 0.4;
        this.layerAudioShimmer = this.audioSmooth.layerShimmer;
    }
    
    updateScrollPhysics() {
        this.scrollPosition += this.scrollVelocity;
        this.scrollVelocity *= this.scrollDecay;
        this.parallaxDepth = Math.sin(this.scrollPosition * 0.1) * 0.5;
        this.gridDensityShift = Math.sin(this.scrollPosition * 0.05) * 0.3;
        this.colorScrollShift = (this.scrollPosition * 0.02) % (Math.PI * 2);
    }
    
    render() {
        if (!this.program) {
            console.error(`❌ HOLOGRAPHIC RENDER BLOCKED: No WebGL program! Canvas: ${this.canvas?.id}`);
            return;
        }

        if (!this._renderStartLogged) {
            console.log(`✅ HOLOGRAPHIC RENDER STARTED: Canvas ${this.canvas?.id}, program exists, gl context: ${!!this.gl}`);
            this._renderStartLogged = true;
        }
        
        this.resize();
        this.gl.useProgram(this.program);
        
        this.densityVariation += (this.densityTarget - this.densityVariation) * 0.05;
        this.clickIntensity *= this.clickDecay;
        this.updateScrollPhysics();
        
        const time = Date.now() - this.startTime;

        const audio = this.audioChoreo || {};
        const baseHue = this.baseVariantParams.hue || 0;
        const orbitShift = audio.colorOrbit * 360;
        const beatShift = audio.colorBeat * 140;
        const swingShift = (audio.triplet || 0) * 20;
        const finalHueDegrees = ((baseHue + orbitShift + beatShift + swingShift) % 360 + 360) % 360;

        const baseSaturation = Math.max(0.05, Math.min(1.0, this.baseVariantParams.saturation || 0.8));
        const vibrance = Math.min(3, Math.max(0.2, this.colorVibrance || 1));
        const style = Math.round(this.colorStyle || 0);
        const profileIndex = Math.max(0, Math.floor(this.colorProfile || 0));
        const orbitBlend = Math.min(
            1,
            Math.max(0, (audio.colorOrbit || 0) * 0.65 + (audio.swing || 0) * 0.35)
        );
        const accentBlend = Math.min(
            1,
            Math.max(0, (audio.accentLuma || 0) * 0.75 + (audio.onset || 0) * 0.55)
        );
        const energyBlend = Math.min(
            1,
            Math.max(0, (audio.energy || 0) * 0.7 + (audio.colorBeat || 0) * 0.45)
        );
        const shimmerBlend = Math.min(
            1,
            Math.max(0, (audio.saturationPulse || 0) * 0.5 + (this.layerAudioShimmer || 0) * 0.25)
        );

        let rgbColor;
        if (style <= 0) {
            const palette = this.colorState || {};
            const primary = clampColor(palette.primary || [0.55, 0.62, 0.9]);
            const secondary = clampColor(palette.secondary || [0.34, 0.4, 0.62]);
            const accent = clampColor(palette.accent || [0.94, 0.55, 0.82]);
            const highlight = clampColor(palette.highlight || lerpColor(accent, [1, 1, 1], 0.3));
            const shadow = clampColor(palette.shadow || [0.08, 0.05, 0.12]);
            const hyperOrbit = Math.min(
                1,
                Math.max(
                    0,
                    (audio.colorOrbit || 0) * 0.6
                        + (audio.swing || 0) * 0.3
                        + (audio.measurePhase || 0) * 0.2
                )
            );
            const hyperAccent = Math.min(
                1,
                Math.max(0, (audio.accentLuma || 0) * 0.7 + (audio.onset || 0) * 0.55)
            );
            const hyperEnergy = Math.min(
                1,
                Math.max(0, (audio.energy || 0) * 0.65 + (audio.colorBeat || 0) * 0.4)
            );
            const baseColor = lerpColor(primary, secondary, hyperOrbit);
            const accented = lerpColor(baseColor, accent, hyperAccent);
            const lifted = lerpColor(accented, highlight, hyperEnergy);
            const ribbon = Math.min(1, Math.max(0, (audio.ribbon || 0) * 0.35));
            const shadowMix = Math.min(1, Math.max(0, 0.18 + ribbon * 0.4 - (audio.energy || 0) * 0.1));
            const shaded = lerpColor(lifted, shadow, shadowMix * 0.25);
            rgbColor = applyVibrance(shaded, vibrance);
        } else {
            const palette = getUniformPalette(profileIndex);
            const baseColor = lerpColor(palette.base, palette.mid, orbitBlend);
            const accented = lerpColor(baseColor, palette.accent, accentBlend);
            const lifted = lerpColor(accented, palette.highlight, energyBlend);
            const shimmered = lerpColor(lifted, palette.highlight, shimmerBlend * 0.4);
            const ribbon = Math.min(1, Math.max(0, (audio.ribbon || 0) * 0.4));
            const shaded = lerpColor(shimmered, palette.shadow, ribbon * 0.2);
            rgbColor = applyVibrance(shaded, vibrance);
        }
        rgbColor = clampColor(rgbColor);

        const saturation = Math.max(
            0.05,
            Math.min(
                1.0,
                baseSaturation * (0.65 + (vibrance - 1) * 0.35) + (audio.saturationPulse || 0) * 0.3 + (this.layerAudioShimmer || 0) * 0.25
            )
        );

        const grayscale = (rgbColor[0] + rgbColor[1] + rgbColor[2]) / 3;
        rgbColor = clampColor([
            grayscale + (rgbColor[0] - grayscale) * saturation,
            grayscale + (rgbColor[1] - grayscale) * saturation,
            grayscale + (rgbColor[2] - grayscale) * saturation
        ]);
        
        // Set uniforms with proper variant parameters
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.uniforms.time, time);
        this.gl.uniform2f(this.uniforms.mouse, this.mouseX, this.mouseY);
        this.gl.uniform1f(this.uniforms.geometryType, this.variantParams.geometryType || 0);

        const densityBase = this.baseVariantParams.density || 1.0;
        const density = densityBase + this.audioDensityBoost * 0.75 + audio.densityBoost * 0.35 + (this.layerAudioIntensity || 0) * 0.2;
        this.gl.uniform1f(this.uniforms.density, density);

        const baseSpeed = (this.baseVariantParams.speed || 0.5) * 0.18;
        const audioSpeed = (this.audioSpeedBoost || 0) * 0.18 + (this.layerAudioSpeed || 0) * 0.08;
        this.gl.uniform1f(this.uniforms.speed, baseSpeed + audioSpeed);

        this.gl.uniform3fv(this.uniforms.color, new Float32Array(rgbColor));

        const intensityBase = (this.baseVariantParams.intensity || 0.5) * this.roleParams.intensity;
        const intensityGain = (1 + (this.layerAudioIntensity || 0) * 0.6 + audio.energy * 0.25 + audio.accentLuma * 0.25)
            * (0.85 + saturation * 0.25);
        this.gl.uniform1f(this.uniforms.intensity, intensityBase * intensityGain);

        this.gl.uniform1f(this.uniforms.roleDensity, this.roleParams.densityMult * (1 + audio.densityBoost * 0.15));
        this.gl.uniform1f(this.uniforms.roleSpeed, this.roleParams.speedMult * (1 + audio.motionVelocity * 0.25));

        const uniformShift = ((this.roleParams.colorShift || 0) / 360)
            + orbitBlend * 0.12
            + (audio.measurePhase || 0) * 0.05;
        const colorShiftNormalized = style <= 0
            ? ((this.roleParams.colorShift || 0) + finalHueDegrees) / 360
            : uniformShift;
        this.gl.uniform1f(this.uniforms.colorShift, Math.max(0, Math.min(1, colorShiftNormalized)));

        const chaosEnvelope = Math.min(2.5, (this.baseVariantParams.chaos || 0) + this.audioChaosBoost * 0.5 + audio.chaos * 0.35);
        this.gl.uniform1f(this.uniforms.chaosIntensity, chaosEnvelope);
        this.gl.uniform1f(this.uniforms.mouseIntensity, this.mouseIntensity);
        this.gl.uniform1f(this.uniforms.clickIntensity, this.clickIntensity);
        this.gl.uniform1f(this.uniforms.densityVariation, this.densityVariation);
        this.gl.uniform1f(this.uniforms.geometryType, this.variantParams.geometryType !== undefined ? this.variantParams.geometryType : this.variant || 0);
        const chaosValue = Math.min(2.5, (this.baseVariantParams.chaos || 0) + this.audioChaosBoost * 0.5 + audio.chaos * 0.35);
        const morphValue = Math.min(2.0, (this.baseVariantParams.morph || 0) + this.audioMorphBoost * 0.6 + audio.dimensionShift * 0.35);
        this.gl.uniform1f(this.uniforms.chaos, chaosValue);
        this.gl.uniform1f(this.uniforms.morph, morphValue);
        
        // Touch and scroll uniforms
        this.gl.uniform1f(this.uniforms.touchMorph, this.touchMorph);
        this.gl.uniform1f(this.uniforms.touchChaos, this.touchChaos);
        this.gl.uniform1f(this.uniforms.scrollParallax, this.parallaxDepth);
        this.gl.uniform1f(this.uniforms.gridDensityShift, this.gridDensityShift);
        this.gl.uniform1f(this.uniforms.colorScrollShift, this.colorScrollShift);
        
        const audioDensity = Math.max(0, this.audioDensityBoost);
        const audioMorph = Math.max(0, this.audioMorphBoost);
        const audioSpeedUniform = Math.max(0, this.audioSpeedBoost);
        const audioChaos = Math.max(0, this.audioChaosBoost + audio.chaos * 0.25);
        const audioColorShift = this.audioColorShift + audio.colorBeat * Math.PI * 0.5;

        this.gl.uniform1f(this.uniforms.audioDensityBoost, audioDensity);
        this.gl.uniform1f(this.uniforms.audioMorphBoost, audioMorph);
        this.gl.uniform1f(this.uniforms.audioSpeedBoost, audioSpeedUniform);
        this.gl.uniform1f(this.uniforms.audioChaosBoost, audioChaos);
        this.gl.uniform1f(this.uniforms.audioColorShift, audioColorShift);

        // 4D rotation uniforms
        const swingWarp = (audio.swing || 0) * 0.35;
        const tripletWarp = (audio.triplet || 0) * 0.2;
        this.gl.uniform1f(this.uniforms.rot4dXW, (this.variantParams.rot4dXW || 0.0) + swingWarp);
        this.gl.uniform1f(this.uniforms.rot4dYW, (this.variantParams.rot4dYW || 0.0) + tripletWarp);
        this.gl.uniform1f(this.uniforms.rot4dZW, (this.variantParams.rot4dZW || 0.0) + audio.motionVelocity * 0.4);

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
    
    /**
     * CRITICAL FIX: Reinitialize WebGL context and resources after SmartCanvasPool context recreation
     */
    reinitializeContext() {
        console.log(`🔄 Reinitializing WebGL context for ${this.canvas?.id}`);
        
        // Clear ALL old WebGL references
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
            console.error(`❌ No WebGL context available for ${this.canvas?.id} - SmartCanvasPool should have created one`);
            return false;
        }
        
        if (this.gl.isContextLost()) {
            console.error(`❌ WebGL context is lost for ${this.canvas?.id}`);
            return false;
        }
        
        // Reinitialize shaders and buffers if context is valid
        try {
            this.initShaders();
            this.initBuffers();
            this.resize();
            
            console.log(`✅ ${this.canvas?.id}: Holographic context reinitialized successfully`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to reinitialize holographic WebGL resources for ${this.canvas?.id}:`, error);
            return false;
        }
    }

    /**
     * CRITICAL FIX: Update visualization parameters with immediate re-render
     * This method was missing and causing parameter sliders to not work in holographic system
     */
    updateParameters(params) {
        // Update variant parameters with proper mapping and scaling
        if (this.variantParams) {
            Object.keys(params).forEach(param => {
                if (param === 'colorStyle') {
                    this.colorStyle = params[param];
                    return;
                }
                if (param === 'colorProfile') {
                    this.colorProfile = params[param];
                    return;
                }
                if (param === 'colorVibrance') {
                    this.colorVibrance = params[param];
                    return;
                }

                const mappedParam = this.mapParameterName(param);
                if (mappedParam !== null) {
                    let scaledValue = params[param];

                    // FIX: Scale gridDensity to reasonable holographic density range (back to normal levels)
                    if (param === 'gridDensity') {
                        // Convert gridDensity (5-100) to holographic density (0.3-2.5) - reasonable range
                        // Formula: density = 0.3 + (gridDensity - 5) / (100 - 5) * (2.5 - 0.3)
                        scaledValue = 0.3 + (parseFloat(params[param]) - 5) / 95 * 2.2;
                        console.log(`🔧 Density scaling: gridDensity=${params[param]} → density=${scaledValue.toFixed(3)} (normal range)`);
                    }

                    this.variantParams[mappedParam] = scaledValue;

                    // Handle special parameter types
                    if (mappedParam === 'geometryType') {
                        // Regenerate role params with new geometry
                        this.roleParams = this.generateRoleParams(this.role);
                    }
                }
            });
        }
        
        // Don't call render() here - engine will call it to prevent infinite loop
    }

    /**
     * Update a single parameter
     */
    updateParameter(name, value) {
        if (name === 'colorStyle') {
            this.colorStyle = value;
            return;
        }
        if (name === 'colorProfile') {
            this.colorProfile = value;
            return;
        }
        if (name === 'colorVibrance') {
            this.colorVibrance = value;
            return;
        }

        const mappedParam = this.mapParameterName(name);
        if (mappedParam !== null && this.variantParams) {
            let scaledValue = value;

            // Scale gridDensity if needed
            if (name === 'gridDensity') {
                scaledValue = 0.3 + (parseFloat(value) - 5) / 95 * 2.2;
            }

            this.variantParams[mappedParam] = scaledValue;

            if (mappedParam === 'geometryType') {
                this.roleParams = this.generateRoleParams(this.role);
            }
        }
    }

    /**
     * Map global parameter names to holographic system parameter names
     */
    mapParameterName(globalParam) {
        if (globalParam === 'colorStyle' || globalParam === 'colorProfile' || globalParam === 'colorVibrance') {
            return null;
        }
        const paramMap = {
            'gridDensity': 'density',
            'morphFactor': 'morph',
            'rot4dXW': 'rot4dXW',
            'rot4dYW': 'rot4dYW',
            'rot4dZW': 'rot4dZW',
            'hue': 'hue',
            'intensity': 'intensity',
            'saturation': 'saturation',
            'chaos': 'chaos',
            'speed': 'speed',
            'geometry': 'geometryType'
        };
        return paramMap[globalParam] || globalParam;
    }

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