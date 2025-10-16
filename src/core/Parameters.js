export class ParameterManager {
    constructor(initialParameters = {}) {
        this.defaults = new Map();
        this.values = new Map();

        this.define(initialParameters);
    }

    define(definition = {}) {
        if (!definition || typeof definition !== 'object') {
            return;
        }

        Object.entries(definition).forEach(([name, config]) => {
            if (config && typeof config === 'object' && Object.prototype.hasOwnProperty.call(config, 'value')) {
                this.defaults.set(name, config.value);
                this.values.set(name, config.value);
            } else {
                this.defaults.set(name, config);
                this.values.set(name, config);
            }
        });
    }

    setParameter(name, value) {
        if (!this.defaults.has(name)) {
            this.defaults.set(name, value);
        }
        this.values.set(name, value);
    }

    getParameter(name) {
        if (this.values.has(name)) {
            return this.values.get(name);
        }
        if (this.defaults.has(name)) {
            return this.defaults.get(name);
        }
        return undefined;
    }

    getAllParameters() {
        const parameters = {};

        for (const [name, value] of this.defaults.entries()) {
            parameters[name] = value;
        }

        for (const [name, value] of this.values.entries()) {
            parameters[name] = value;
        }

        return parameters;
    }

    resetToDefaults() {
        this.values = new Map(this.defaults);
    }

    load(parameters = {}) {
        Object.entries(parameters).forEach(([name, value]) => {
            this.setParameter(name, value);
        });
    }
}
