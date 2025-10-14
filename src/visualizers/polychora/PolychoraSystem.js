/**
 * Polychora System - Rebuilt full-screen 4D lattice renderer
 * Extends BaseSystem with a dedicated WebGL visualizer that mirrors
 * the coverage and lattice-driven roots of the other engines.
 */

import { BaseSystem } from '../shared/BaseSystem.js';
import { ParameterManager } from '../../core/Parameters.js';
import { PolychoraVisualizer } from './PolychoraVisualizer.js';

export class PolychoraSystem extends BaseSystem {
    constructor(config = {}) {
        super({
            ...config,
            name: config.name || 'Polychora',
            type: 'polychora'
        });

        this.rotation4D = {
            xy: 0,
            xz: 0,
            xw: 0,
            yz: 0,
            yw: 0,
            zw: 0
        };
    }

    async createVisualizer() {
        console.log('🔮 Creating rebuilt Polychora visualizer...');

        this.parameters = new ParameterManager({
            latticeDensity: 14.5,
            latticeWarp: 0.2,
            glowStrength: 1.25,
            lineThickness: 0.35,
            dimension: 3.8,
            hue: 220,
            saturation: 0.85,
            intensity: 0.65
        });

        this.visualizer = new PolychoraVisualizer(this.canvas);
        await this.visualizer.initialize();
        this.visualizer.setParameters(this.parameters.getAllParameters());
        this.visualizer.set4DRotation(this.rotation4D);

        console.log('✅ Polychora visualizer created');
    }

    async setupInteractions() {
        await super.setupInteractions();

        const handlePointer = (clientX, clientY) => {
            if (!this.canvas || !this.visualizer) return;
            const rect = this.canvas.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            const x = (clientX - rect.left) / rect.width;
            const y = (clientY - rect.top) / rect.height;
            this.visualizer.setPointer(x, y);
        };

        let dragging = false;
        let lastX = 0;
        let lastY = 0;

        this.canvas.addEventListener('mousedown', (event) => {
            dragging = true;
            lastX = event.clientX;
            lastY = event.clientY;
            handlePointer(event.clientX, event.clientY);
        });

        window.addEventListener('mousemove', (event) => {
            if (!dragging) {
                handlePointer(event.clientX, event.clientY);
                return;
            }

            const deltaX = event.clientX - lastX;
            const deltaY = event.clientY - lastY;

            this.rotation4D.xw += deltaX * 0.004;
            this.rotation4D.yw += deltaY * 0.004;
            this.rotation4D.xy += deltaX * 0.002;
            this.visualizer.set4DRotation(this.rotation4D);

            lastX = event.clientX;
            lastY = event.clientY;
            handlePointer(event.clientX, event.clientY);
        });

        window.addEventListener('mouseup', () => {
            dragging = false;
        });

        this.canvas.addEventListener('wheel', (event) => {
            if (!this.visualizer) return;
            const delta = Math.max(-1, Math.min(1, event.deltaY));
            const params = this.visualizer.parameterState || {};
            const dimension = (params.dimension ?? 3.8) + delta * -0.05;
            this.visualizer.setParameters({ dimension: Math.max(2.6, Math.min(5.2, dimension)) });
        });

        window.addEventListener('keydown', (event) => {
            const speed = 0.05;
            switch (event.key.toLowerCase()) {
                case 'q':
                    this.rotation4D.xw += speed;
                    break;
                case 'w':
                    this.rotation4D.xw -= speed;
                    break;
                case 'a':
                    this.rotation4D.yw += speed;
                    break;
                case 's':
                    this.rotation4D.yw -= speed;
                    break;
                case 'z':
                    this.rotation4D.zw += speed;
                    break;
                case 'x':
                    this.rotation4D.zw -= speed;
                    break;
                case 'e':
                    this.rotation4D.xy += speed * 0.6;
                    break;
                case 'r':
                    this.rotation4D.xz += speed * 0.6;
                    break;
                case 'd':
                    this.rotation4D.yz += speed * 0.6;
                    break;
                default:
                    return;
            }

            this.visualizer.set4DRotation(this.rotation4D);
        });
    }

    update(deltaTime, parameters = {}, audioData) {
        if (!this.visualizer) {
            return;
        }

        if (this.visualizer.updateClickIntensity) {
            this.visualizer.updateClickIntensity(deltaTime);
        }

        const mergedParams = {
            ...this.parameters.getAllParameters(),
            ...parameters
        };
        this.visualizer.setParameters(mergedParams);

        const time = this.visualizer.getTime();
        const color = this.colorSystem.getColor(
            this.visualizer.pointer?.x ?? 0.5,
            this.visualizer.pointer?.y ?? 0.5,
            time,
            mergedParams.hue || 220,
            audioData
        );
        this.visualizer.setColor(color);

        if (audioData && this.audioEnabled) {
            this.visualizer.setAudioChoreography(audioData);
            this.applyAudioRotation(audioData);
            this.visualizer.set4DRotation(this.rotation4D);
        }

        this.visualizer.render();
    }

    applyAudioRotation(audioData) {
        const getBandLevel = (name) => {
            const bands = audioData?.bands || {};
            const details = audioData?.bandDetails || {};
            if (typeof bands[name] === 'number') return bands[name];
            if (typeof bands[name]?.value === 'number') return bands[name].value;
            if (typeof details[name]?.value === 'number') return details[name].value;
            return 0;
        };

        const extreme = audioData?.extremeDynamics || {};
        const onset = audioData?.onsetEvent?.strength || audioData?.onset || 0;

        const bass = Math.max(getBandLevel('bass'), getBandLevel('subBass') * 0.85);
        const mid = 0.6 * getBandLevel('mid') + 0.4 * getBandLevel('lowMid');
        const high = 0.5 * getBandLevel('high') + 0.3 * getBandLevel('highMid');

        this.rotation4D.xw += (bass + extreme.motionVelocity * 1.3) * this.audioReactivity * 0.03;
        this.rotation4D.yw += (mid + Math.abs(extreme.swingEnergy || 0) * 0.8) * this.audioReactivity * 0.03;
        this.rotation4D.zw += (high + (extreme.chaosSurge || 0) * 0.9) * this.audioReactivity * 0.025;

        this.rotation4D.xy += onset * this.audioReactivity * 0.015;
        this.rotation4D.xz += (extreme.dimensionLift || 0) * this.audioReactivity * 0.01;
        this.rotation4D.yz += (audioData?.spectralFlux || 0) * this.audioReactivity * 0.008;
    }
}
