/**
 * System Registry - Manages Multiple Visualization Systems
 * Handles system switching, lifecycle, and state management
 *
 * A Paul Phillips Manifestation
 * © 2025 Clear Seas Solutions LLC
 */

export class SystemRegistry {
    constructor() {
        this.systems = new Map();
        this.currentSystem = null;
        this.currentSystemName = null;

        // Shared resources
        this.sharedAudioAnalyzer = null;
        this.sharedCanvas = null;
    }

    async resetCanvas(canvasId, delayMs = 30) {
        const existing = document.getElementById(canvasId);
        if (!existing || !existing.parentElement) {
            return existing;
        }

        const replacement = existing.cloneNode(false);
        replacement.id = canvasId;

        existing.parentElement.replaceChild(replacement, existing);

        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return replacement;
    }

    /**
     * Register a system
     */
    register(name, SystemClass, config = {}) {
        if (this.systems.has(name)) {
            console.warn(`System ${name} already registered, overwriting`);
        }

        this.systems.set(name, {
            SystemClass,
            config,
            instance: null
        });

        console.log(`📝 Registered system: ${name}`);
    }

    /**
     * Set shared audio analyzer for all systems
     */
    setAudioAnalyzer(analyzer) {
        this.sharedAudioAnalyzer = analyzer;

        // Update current system if active
        if (this.currentSystem) {
            this.currentSystem.setAudioAnalyzer(analyzer);
        }
    }

    /**
     * Set shared canvas for all systems
     */
    setCanvas(canvas) {
        this.sharedCanvas = canvas;
    }

    /**
     * Switch to a different system
     */
    async switchTo(name) {
        if (!this.systems.has(name)) {
            throw new Error(`System ${name} not registered`);
        }

        console.log(`🔄 Switching to system: ${name}`);

        // Destroy current system
        if (this.currentSystem) {
            console.log(`🗑️ Destroying ${this.currentSystemName}...`);
            this.currentSystem.destroy();
            this.currentSystem = null;
        }

        // Get system info
        const systemInfo = this.systems.get(name);

        // Create new instance with a fresh canvas so we never stack WebGL contexts
        const targetCanvasId = this.sharedCanvas ? this.sharedCanvas.id : systemInfo.config.canvasId;
        const freshCanvas = await this.resetCanvas(targetCanvasId, 30);
        if (freshCanvas) {
            this.sharedCanvas = freshCanvas;
        }

        const config = {
            ...systemInfo.config,
            canvasId: (freshCanvas || this.sharedCanvas || {}).id || systemInfo.config.canvasId
        };

        console.log(`🎨 Creating ${name} instance...`);
        const instance = new systemInfo.SystemClass(config);

        // Set audio analyzer if available
        if (this.sharedAudioAnalyzer) {
            instance.setAudioAnalyzer(this.sharedAudioAnalyzer);
        }

        // Initialize
        await instance.initialize();

        // Start rendering
        instance.render();

        // Update current
        this.currentSystem = instance;
        this.currentSystemName = name;
        systemInfo.instance = instance;

        console.log(`✅ Switched to ${name}`);

        return instance;
    }

    /**
     * Get current active system
     */
    getCurrentSystem() {
        return this.currentSystem;
    }

    /**
     * Get current system name
     */
    getCurrentSystemName() {
        return this.currentSystemName;
    }

    /**
     * Get all registered system names
     */
    getSystemNames() {
        return Array.from(this.systems.keys());
    }

    /**
     * Check if a system is registered
     */
    hasSystem(name) {
        return this.systems.has(name);
    }

    /**
     * Update parameter on current system
     */
    updateParameter(name, value) {
        if (this.currentSystem) {
            this.currentSystem.updateParameter(name, value);
        }
    }

    /**
     * Update multiple parameters on current system
     */
    updateParameters(params) {
        if (this.currentSystem) {
            this.currentSystem.updateParameters(params);
        }
    }

    /**
     * Set audio reactivity on current system
     */
    setAudioReactivity(amount) {
        if (this.currentSystem) {
            this.currentSystem.setAudioReactivity(amount);
        }
    }

    /**
     * Set audio enabled on current system
     */
    setAudioEnabled(enabled) {
        if (this.currentSystem) {
            this.currentSystem.setAudioEnabled(enabled);
        }
    }

    /**
     * Randomize current system
     */
    randomize() {
        if (this.currentSystem) {
            this.currentSystem.randomize();
        }
    }

    /**
     * Reset current system
     */
    reset() {
        if (this.currentSystem) {
            this.currentSystem.reset();
        }
    }

    /**
     * Export current system state
     */
    exportState() {
        if (this.currentSystem) {
            return this.currentSystem.exportState();
        }
        return null;
    }

    /**
     * Load state into current system
     */
    loadState(state) {
        // If state specifies a different system, switch to it first
        if (state.system && state.system !== this.currentSystemName) {
            this.switchTo(state.system).then(() => {
                if (this.currentSystem) {
                    this.currentSystem.loadState(state);
                }
            });
        } else if (this.currentSystem) {
            this.currentSystem.loadState(state);
        }
    }

    /**
     * Get debug info
     */
    getDebugInfo() {
        return {
            currentSystem: this.currentSystemName,
            registeredSystems: this.getSystemNames(),
            currentSystemInfo: this.currentSystem ? this.currentSystem.getDebugInfo() : null
        };
    }

    /**
     * Cleanup all systems
     */
    destroy() {
        if (this.currentSystem) {
            this.currentSystem.destroy();
        }

        for (const [name, info] of this.systems.entries()) {
            if (info.instance) {
                info.instance.destroy();
            }
        }

        this.systems.clear();
        this.currentSystem = null;
        this.currentSystemName = null;

        console.log('🗑️ System registry destroyed');
    }
}
