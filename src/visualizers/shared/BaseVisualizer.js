/**
 * Base Visualizer - Common WebGL Rendering Interface
 * All visualizers extend this for consistent WebGL handling
 *
 * A Paul Phillips Manifestation
 * © 2025 Clear Seas Solutions LLC
 */

export class BaseVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = null;
        this.program = null;

        // WebGL resources
        this.buffers = {};
        this.uniforms = {};
        this.textures = {};

        // Context options
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

        // Mouse state
        this.mouseX = 0.5;
        this.mouseY = 0.5;
        this.mouseIntensity = 0.0;
        this.clickIntensity = 0.0;

        // Time
        this.startTime = Date.now();

        // Initialize WebGL
        this.initWebGL();
    }

    /**
     * Initialize WebGL context
     */
    initWebGL() {
        // Try WebGL2 first, fallback to WebGL1
        this.gl = this.canvas.getContext('webgl2', this.contextOptions) ||
                  this.canvas.getContext('webgl', this.contextOptions) ||
                  this.canvas.getContext('experimental-webgl', this.contextOptions);

        if (!this.gl) {
            throw new Error('WebGL not supported');
        }

        // Setup WebGL state
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);

        console.log(`✅ WebGL context created (${this.gl instanceof WebGL2RenderingContext ? 'WebGL2' : 'WebGL1'})`);
    }

    /**
     * Create shader program
     */
    createProgram(vertexShaderSource, fragmentShaderSource) {
        const gl = this.gl;

        // Compile vertex shader
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
        if (!vertexShader) return null;

        // Compile fragment shader
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        if (!fragmentShader) {
            gl.deleteShader(vertexShader);
            return null;
        }

        // Link program
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        // Check for errors
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            return null;
        }

        // Cleanup shaders (no longer needed after linking)
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        this.program = program;
        return program;
    }

    /**
     * Compile a shader
     */
    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const typeName = type === gl.VERTEX_SHADER ? 'vertex' : 'fragment';
            console.error(`${typeName} shader compile error:`, gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    /**
     * Create a buffer
     */
    createBuffer(data, target = this.gl.ARRAY_BUFFER, usage = this.gl.STATIC_DRAW) {
        const gl = this.gl;
        const buffer = gl.createBuffer();

        gl.bindBuffer(target, buffer);
        gl.bufferData(target, data, usage);
        gl.bindBuffer(target, null);

        return buffer;
    }

    /**
     * Get uniform location and cache it
     */
    getUniform(name) {
        if (!this.uniforms[name]) {
            this.uniforms[name] = this.gl.getUniformLocation(this.program, name);
        }
        return this.uniforms[name];
    }

    /**
     * Set uniform value
     */
    setUniform(name, type, ...values) {
        const gl = this.gl;
        const location = this.getUniform(name);

        if (location === null) {
            // Uniform not found or optimized out
            return;
        }

        switch(type) {
            case '1f':
                gl.uniform1f(location, values[0]);
                break;
            case '2f':
                gl.uniform2f(location, values[0], values[1]);
                break;
            case '3f':
                gl.uniform3f(location, values[0], values[1], values[2]);
                break;
            case '4f':
                gl.uniform4f(location, values[0], values[1], values[2], values[3]);
                break;
            case '1i':
                gl.uniform1i(location, values[0]);
                break;
            case 'mat4':
                gl.uniformMatrix4fv(location, false, values[0]);
                break;
            default:
                console.warn(`Unknown uniform type: ${type}`);
        }
    }

    /**
     * Create fullscreen quad
     */
    createFullscreenQuad() {
        const gl = this.gl;

        // Vertex positions (-1 to 1)
        const positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);

        this.buffers.position = this.createBuffer(positions);

        // Bind to attribute
        const positionLoc = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(positionLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    }

    /**
     * Clear canvas
     */
    clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    /**
     * Draw fullscreen quad
     */
    drawQuad() {
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    /**
     * Update mouse position (0-1 range)
     */
    setMousePosition(x, y) {
        this.mouseX = x;
        this.mouseY = y;

        // Update intensity based on distance from center
        const dx = x - 0.5;
        const dy = y - 0.5;
        this.mouseIntensity = Math.sqrt(dx * dx + dy * dy) * 2;
    }

    /**
     * Trigger click effect
     */
    triggerClick() {
        this.clickIntensity = 1.0;
    }

    /**
     * Update click intensity (decay over time)
     */
    updateClickIntensity(deltaTime) {
        if (this.clickIntensity > 0) {
            this.clickIntensity = Math.max(0, this.clickIntensity - deltaTime * 0.003);
        }
    }

    /**
     * Get elapsed time in seconds
     */
    getTime() {
        return (Date.now() - this.startTime) * 0.001;
    }

    /**
     * Handle canvas resize
     */
    handleResize(width, height) {
        if (this.gl) {
            this.gl.viewport(0, 0, width, height);
        }
    }

    /**
     * Update parameter (to be overridden by subclass)
     */
    updateParameter(name, value) {
        // Subclasses implement specific parameter handling
    }

    /**
     * Render frame (to be overridden by subclass)
     */
    render(parameters) {
        throw new Error('render() must be implemented by subclass');
    }

    /**
     * Cleanup WebGL resources
     */
    destroy() {
        const gl = this.gl;

        // Delete buffers
        for (const buffer of Object.values(this.buffers)) {
            if (buffer) gl.deleteBuffer(buffer);
        }

        // Delete textures
        for (const texture of Object.values(this.textures)) {
            if (texture) gl.deleteTexture(texture);
        }

        // Delete program
        if (this.program) {
            gl.deleteProgram(this.program);
        }

        // Lose context
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
            loseContext.loseContext();
        }

        console.log('🗑️ Visualizer destroyed');
    }
}

/**
 * Standard vertex shader for fullscreen quad
 */
export const FULLSCREEN_VERTEX_SHADER = `
    attribute vec2 a_position;
    varying vec2 v_uv;

    void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
`;
