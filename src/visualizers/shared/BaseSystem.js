/**
 * Base System - Unified Interface for All Visualization Systems
 * All engines (Faceted, Quantum, Holographic, Polychora) extend this class
 *
 * A Paul Phillips Manifestation
 * © 2025 Clear Seas Solutions LLC
 */

import { ParameterMapper } from '../../audio/ParameterMapper.js';
import { ColorSystem } from '../../color/ColorSystem.js';
import { VisualizerControlBus } from './VisualizerControlBus.js';
import { CameraLightingSystem } from './CameraLightingSystem.js';

export class BaseSystem {
    constructor(config) {
        this.name = config.name;
        this.type = config.type; // 'faceted', 'quantum', 'holographic', 'polychora'
        this.canvasId = config.canvasId || 'mainCanvas';

        // Core components (to be set by subclasses)
        this.canvas = null;
        this.visualizer = null;
        this.parameters = null;

        // Advanced systems
        this.audioAnalyzer = null;
        this.parameterMapper = new ParameterMapper();
        this.useLegacyParameterMapper = Boolean(config.useLegacyParameterMapper);
        this.colorSystem = new ColorSystem();
        this.controlBus = new VisualizerControlBus();
        this.cameraLighting = new CameraLightingSystem();

        this.activeCameraPreset = null;

        // State
        this.isInitialized = false;
        this.isRunning = false;
        this.lastFrameTime = 0;
        this.animationId = null;

        // User-controlled parameters (not affected by audio)
        this.userParameters = {};

        // Audio reactivity settings
        this.audioReactivity = 0.7; // 0-1, how much audio affects parameters
        this.audioEnabled = true;

        // Macro lifecycle tracking
        this.activeMacroIds = new Set();

        this._handleWindowMouseUp = null;
    }

    setCameraPreset(name, overrides = {}) {
        if (!this.cameraLighting) {
            return;
        }

        this.cameraLighting.setPreset(name, overrides);
        this.activeCameraPreset = name;
    }

    transitionCameraPreset(name, options = {}) {
        if (!this.cameraLighting || !name) {
            return;
        }

        this.cameraLighting.transitionToPreset(name, options);
        this.activeCameraPreset = name;
    }

    getCameraState() {
        return this.cameraLighting ? this.cameraLighting.getState() : null;
    }

    getActiveCameraPreset() {
        return this.activeCameraPreset;
    }

    /**
     * Initialize the system
     * Must be called before render()
     */
    async initialize() {
        console.log(`🎨 Initializing ${this.name} system...`);

        // Create canvas
        await this.createCanvas();

        // Create visualizer (implemented by subclass)
        await this.createVisualizer();

        // Setup interactions
        await this.setupInteractions();

        // Setup audio if available
        if (this.audioAnalyzer) {
            await this.setupAudio();
        }

        this.isInitialized = true;
        console.log(`✅ ${this.name} system initialized`);

        return this;
    }

    /**
     * Create canvas element
     * Subclasses can override for custom canvas setup
     */
    async createCanvas() {
        this.canvas = document.getElementById(this.canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas ${this.canvasId} not found`);
        }

        // Resize to container
        this.resizeCanvas();

        // Listen for resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    /**
     * Resize canvas to match container
     */
    resizeCanvas() {
        if (!this.canvas) return;

        const rect = this.canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        if (this.visualizer && this.visualizer.handleResize) {
            this.visualizer.handleResize(this.canvas.width, this.canvas.height);
        }
    }

    /**
     * Create visualizer
     * MUST be implemented by subclass
     */
    async createVisualizer() {
        throw new Error('createVisualizer() must be implemented by subclass');
    }

    /**
     * Setup interactions (mouse, touch, scroll)
     * Can be overridden by subclass for custom behavior
     */
    async setupInteractions() {
        // Default mouse tracking
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            if (this.visualizer && this.visualizer.setMousePosition) {
                this.visualizer.setMousePosition(x, y);
            }

            if (this.controlBus) {
                this.controlBus.recordGesture('pointerMove', { x, y });
            }
        });

        // Default click handling
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            if (this.visualizer && this.visualizer.triggerClick) {
                this.visualizer.triggerClick();
            }

            if (this.controlBus) {
                this.controlBus.recordGesture('pointerClick', { x, y });
            }
        });

        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            if (this.controlBus) {
                this.controlBus.recordGesture('pointerDown', { x, y });
            }
        });

        this._handleWindowMouseUp = (e) => {
            if (!this.canvas) {
                return;
            }
            const rect = this.canvas.getBoundingClientRect();
            const width = Math.max(rect.width, 1);
            const height = Math.max(rect.height, 1);
            const x = (e.clientX - rect.left) / width;
            const y = (e.clientY - rect.top) / height;

            if (this.controlBus) {
                this.controlBus.recordGesture('pointerUp', { x, y });
            }
        };

        window.addEventListener('mouseup', this._handleWindowMouseUp);
    }

    /**
     * Setup audio analysis
     */
    async setupAudio() {
        if (!this.audioAnalyzer) {
            console.warn('No audio analyzer provided');
            return;
        }

        console.log(`🎵 Audio analysis enabled for ${this.name}`);
    }

    /**
     * Update a single parameter
     */
    updateParameter(name, value) {
        if (!this.parameters) {
            console.warn('Parameters not initialized');
            return;
        }

        // Store user parameter
        this.userParameters[name] = value;

        // Update parameter manager
        this.parameters.setParameter(name, value);

        if (this.controlBus) {
            this.controlBus.setBaseValue(name, value);
        }

        // Update visualizer if it has the method
        if (this.visualizer && this.visualizer.updateParameter) {
            this.visualizer.updateParameter(name, value);
        }
    }

    /**
     * Update multiple parameters at once
     */
    updateParameters(params) {
        for (const [name, value] of Object.entries(params)) {
            this.updateParameter(name, value);
        }
    }

    /**
     * Get current parameter values
     */
    getParameters() {
        const base = this.parameters ? this.parameters.getAllParameters() : {};
        if (this.controlBus) {
            return this.controlBus.getSnapshot(base);
        }
        return base;
    }

    /**
     * Prepare a snapshot of parameters with control bus modulation applied.
     */
    prepareControlParameters(deltaTime, overrides = {}, audioData = null) {
        const base = this.parameters ? this.parameters.getAllParameters() : {};
        const merged = {
            ...base,
            ...this.userParameters,
            ...overrides
        };

        if (!this.controlBus) {
            return merged;
        }

        return this.controlBus.update(deltaTime, {
            baseParameters: merged,
            audioData
        });
    }

    /**
     * Macro recording helpers wired into the shared control bus.
     */
    startMacroRecording(name, options = {}) {
        if (!this.controlBus) {
            return;
        }
        this.controlBus.startMacroRecording(name, options);
    }

    stopMacroRecording() {
        if (!this.controlBus) {
            return null;
        }
        return this.controlBus.stopMacroRecording();
    }

    playMacro(name, options = {}) {
        if (!this.controlBus) {
            return null;
        }

        const mergedOptions = {
            onGesture: (event) => this.applyMacroGesture(event),
            ...options
        };

        const id = this.controlBus.playMacro(name, mergedOptions);
        if (id) {
            this.activeMacroIds.add(id);
        }
        return id;
    }

    stopMacro(idOrName) {
        if (!this.controlBus) {
            return;
        }
        this.controlBus.stopMacro(idOrName);
        if (idOrName && typeof idOrName !== 'string') {
            this.activeMacroIds.delete(idOrName);
        }
    }

    stopAllMacros() {
        if (!this.controlBus) {
            return;
        }
        this.activeMacroIds.forEach((id) => this.controlBus.stopMacro(id));
        this.activeMacroIds.clear();
    }

    exportMacro(name) {
        if (!this.controlBus) {
            return null;
        }
        return this.controlBus.exportMacro(name);
    }

    importMacro(macro) {
        if (!this.controlBus) {
            return null;
        }
        return this.controlBus.importMacro(macro);
    }

    applyMacroGesture(event) {
        if (!event || !this.visualizer) {
            return;
        }

        switch (event.type) {
            case 'pointerMove':
                if (this.visualizer.setPointer) {
                    this.visualizer.setPointer(event.payload?.x ?? 0.5, event.payload?.y ?? 0.5);
                }
                if (this.visualizer.setMousePosition) {
                    this.visualizer.setMousePosition(event.payload?.x ?? 0.5, event.payload?.y ?? 0.5);
                }
                break;
            case 'pointerDown':
                if (this.visualizer.setPointer) {
                    this.visualizer.setPointer(event.payload?.x ?? 0.5, event.payload?.y ?? 0.5);
                }
                if (this.visualizer.setMousePosition) {
                    this.visualizer.setMousePosition(event.payload?.x ?? 0.5, event.payload?.y ?? 0.5);
                }
                if (this.visualizer.triggerPointerDown) {
                    this.visualizer.triggerPointerDown(event.payload);
                }
                break;
            case 'pointerUp':
                if (this.visualizer.triggerPointerUp) {
                    this.visualizer.triggerPointerUp(event.payload);
                }
                break;
            case 'pointerClick':
                if (this.visualizer.triggerClick) {
                    this.visualizer.triggerClick(event.payload);
                }
                break;
            default:
                break;
        }
    }

    /**
     * Set audio analyzer
     */
    setAudioAnalyzer(analyzer) {
        this.audioAnalyzer = analyzer;
    }

    /**
     * Set audio reactivity amount (0-1)
     */
    setAudioReactivity(amount) {
        this.audioReactivity = Math.max(0, Math.min(1, amount));
        this.parameterMapper.setReactivity(amount);
    }

    /**
     * Enable/disable audio reactivity
     */
    setAudioEnabled(enabled) {
        this.audioEnabled = enabled;
    }

    /**
     * Main render loop
     */
    render() {
        if (!this.isInitialized) {
            console.error('System not initialized. Call initialize() first.');
            return;
        }

        console.log(`🎬 ${this.name}: Starting render loop`);
        this.isRunning = true;
        const loop = (timestamp) => {
            if (!this.isRunning) {
                console.log(`⏹️ ${this.name}: Render loop stopped`);
                return;
            }

            const deltaTime = timestamp - this.lastFrameTime;
            this.lastFrameTime = timestamp;

            // Get audio data if available
            let audioData = null;
            if (this.audioEnabled && this.audioAnalyzer) {
                audioData = this.audioAnalyzer.analyze();
            }

            const hasControlBusChannels = Boolean(this.controlBus?.channels?.size);
            const shouldApplyLegacyMapper = this.useLegacyParameterMapper || !hasControlBusChannels;

            // Map audio to parameters (legacy mapper only when explicitly enabled)
            let mappedParams = {};
            if (shouldApplyLegacyMapper && audioData && this.audioEnabled) {
                mappedParams = this.parameterMapper.map(audioData, this.userParameters);
            }

            // Merge user parameters with audio-mapped parameters
            const finalParams = { ...this.userParameters };

            if (shouldApplyLegacyMapper && this.audioEnabled && this.audioReactivity > 0) {
                for (const [key, value] of Object.entries(mappedParams)) {
                    if (finalParams[key] !== undefined) {
                        // Mix user value with audio value
                        const userValue = finalParams[key];
                        finalParams[key] = userValue + (value - userValue) * this.audioReactivity;
                    } else {
                        finalParams[key] = value;
                    }
                }
            }

            // Update color system with current audio context so palettes can react
            this.colorSystem.update(deltaTime, audioData);

            // Update visualizer (implemented by subclass)
            this.update(deltaTime, finalParams, audioData);

            this.animationId = requestAnimationFrame(loop);
        };

        this.animationId = requestAnimationFrame(loop);
    }

    /**
     * Update method - called every frame
     * MUST be implemented by subclass
     */
    update(deltaTime, parameters, audioData) {
        throw new Error('update() must be implemented by subclass');
    }

    /**
     * Stop rendering
     */
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        this.stop();

        // Cleanup visualizer
        if (this.visualizer && this.visualizer.destroy) {
            this.visualizer.destroy();
        }

        // Remove event listeners
        window.removeEventListener('resize', () => this.resizeCanvas());
        if (this._handleWindowMouseUp) {
            window.removeEventListener('mouseup', this._handleWindowMouseUp);
            this._handleWindowMouseUp = null;
        }

        this.stopAllMacros();

        this.isInitialized = false;
        console.log(`🗑️ ${this.name} system destroyed`);
    }

    /**
     * Randomize all parameters
     */
    randomize() {
        if (this.parameters) {
            this.parameters.randomizeAll();
            this.parameters.updateDisplayValues();
        }
    }

    /**
     * Reset to default parameters
     */
    reset() {
        if (this.parameters) {
            this.parameters.resetToDefaults();
            this.parameters.updateDisplayValues();
        }
    }

    /**
     * Export current state as JSON
     */
    exportState() {
        return {
            system: this.type,
            name: this.name,
            timestamp: new Date().toISOString(),
            parameters: this.getParameters(),
            colorMode: this.colorSystem.currentMode,
            colorPalette: this.colorSystem.currentPalette,
            audioReactivity: this.audioReactivity,
            audioEnabled: this.audioEnabled
        };
    }

    /**
     * Load state from JSON
     */
    loadState(state) {
        if (state.parameters) {
            this.updateParameters(state.parameters);
        }

        if (state.colorMode !== undefined) {
            this.colorSystem.setMode(state.colorMode);
        }

        if (state.colorPalette) {
            this.colorSystem.setPalette(state.colorPalette);
        }

        if (state.audioReactivity !== undefined) {
            this.setAudioReactivity(state.audioReactivity);
        }

        if (state.audioEnabled !== undefined) {
            this.setAudioEnabled(state.audioEnabled);
        }
    }

    /**
     * Get debug info
     */
    getDebugInfo() {
        return {
            system: this.type,
            name: this.name,
            initialized: this.isInitialized,
            running: this.isRunning,
            audioEnabled: this.audioEnabled,
            audioReactivity: this.audioReactivity,
            parameters: this.getParameters(),
            colorMode: this.colorSystem.currentMode,
            colorPalette: this.colorSystem.currentPalette
        };
    }
}
