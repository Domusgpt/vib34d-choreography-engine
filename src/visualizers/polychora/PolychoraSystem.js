/**
 * Polychora System - Rebuilt full-screen 4D lattice renderer
 * Extends BaseSystem with a dedicated WebGL visualizer that mirrors
 * the coverage and lattice-driven roots of the other engines.
 */

import { BaseSystem } from '../shared/BaseSystem.js';
import { ParameterManager } from '../../core/Parameters.js';
import { PolychoraVisualizer } from './PolychoraVisualizer.js';

const clamp = (value, min, max) => {
    const numeric = typeof value === 'number' && Number.isFinite(value) ? value : min;
    return Math.min(Math.max(numeric, min), max);
};

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
        this._cameraPresetCooldownMs = 0;
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

        this.controlBus.attachParameterManager(this.parameters);
        this.controlBus.defineChannels({
            latticeDensity: {
                value: 14.5,
                range: [8, 36],
                smoothing: 0.82,
                audioMap: [
                    { path: 'bands.mid', scale: 4.0 },
                    { path: 'extremeDynamics.motionVelocity', scale: 6.0, clamp: [-3, 6] }
                ],
                tags: ['geometry']
            },
            latticeWarp: {
                value: 0.2,
                range: [0, 1.5],
                smoothing: 0.8,
                audioMap: [
                    { path: 'extremeDynamics.chaosSurge', scale: 0.6 },
                    { path: 'colorChoreography.orbit', scale: 0.35 }
                ],
                tags: ['geometry']
            },
            glowStrength: {
                value: 1.25,
                range: [0.4, 4],
                smoothing: 0.7,
                audioMap: [
                    { path: 'extremeDynamics.intensityExponent', scale: 0.8, bias: -0.2, clamp: [-0.4, 1.2] },
                    (audio) => (audio?.onsetEvent?.strength || audio?.onset || 0) * 0.9
                ],
                tags: ['lighting']
            },
            lineThickness: {
                value: 0.35,
                range: [0.05, 0.9],
                smoothing: 0.76,
                audioMap: [
                    { path: 'bands.bass', scale: -0.18, clamp: [-0.25, 0] },
                    { path: 'extremeDynamics.swingEnergy', scale: -0.12 }
                ],
                tags: ['geometry']
            },
            dimension: {
                value: 3.8,
                range: [2.4, 5.6],
                smoothing: 0.88,
                audioMap: [
                    { path: 'extremeDynamics.dimensionLift', scale: 1.35 },
                    { path: 'colorChoreography.downbeatColor', scale: 0.5 }
                ],
                tags: ['geometry']
            },
            hue: {
                value: 220,
                range: [0, 360],
                smoothing: 0.92,
                audioMap: [
                    { path: 'colorChoreography.orbit', scale: 95 },
                    { path: 'rhythmPhases.accentPulse', scale: 40 }
                ],
                tags: ['color']
            },
            saturation: {
                value: 0.85,
                range: [0.35, 1],
                smoothing: 0.85,
                audioMap: [
                    { path: 'colorChoreography.saturationPulse', scale: 0.25 },
                    { path: 'extremeDynamics.chaosSurge', scale: 0.12 }
                ],
                tags: ['color']
            },
            intensity: {
                value: 0.65,
                range: [0, 1.4],
                smoothing: 0.78,
                audioMap: [
                    { path: 'rms', scale: 0.7 },
                    { path: 'extremeDynamics.motionVelocity', scale: 0.35 }
                ],
                tags: ['lighting']
            }
        });

        this.controlBus.defineChannels({
            cameraOrbit: {
                value: 0,
                range: [-Math.PI, Math.PI],
                smoothing: 0.95,
                tags: ['camera']
            },
            cameraElevation: {
                value: 0,
                range: [-0.8, 1.3],
                smoothing: 0.9,
                tags: ['camera']
            },
            cameraDolly: {
                value: 0,
                range: [-1.4, 0.8],
                smoothing: 0.88,
                tags: ['camera']
            },
            cameraRoll: {
                value: 0,
                range: [-Math.PI, Math.PI],
                smoothing: 0.93,
                tags: ['camera']
            },
            exposure: {
                value: 0,
                range: [-1.6, 1.6],
                smoothing: 0.82,
                tags: ['lighting']
            },
            shutter: {
                value: 0,
                range: [-1.2, 1.2],
                smoothing: 0.82,
                tags: ['lighting']
            },
            bloom: {
                value: 0,
                range: [0, 1.6],
                smoothing: 0.8,
                tags: ['lighting']
            },
            keyLight: {
                value: 0,
                range: [-0.8, 1.4],
                smoothing: 0.84,
                tags: ['lighting']
            },
            rimLight: {
                value: 0,
                range: [-0.6, 1.4],
                smoothing: 0.84,
                tags: ['lighting']
            },
            ambientLight: {
                value: 0,
                range: [-0.6, 0.7],
                smoothing: 0.82,
                tags: ['lighting']
            },
            vignette: {
                value: 0,
                range: [0, 0.95],
                smoothing: 0.8,
                tags: ['lighting']
            },
            filmGrain: {
                value: 0,
                range: [0, 1.6],
                smoothing: 0.83,
                audioMap: [
                    { path: 'extremeDynamics.chaosSurge', scale: 0.4 },
                    { path: 'bands.high', scale: 0.24 }
                ],
                tags: ['lighting']
            },
            lensDistortion: {
                value: 0,
                range: [-0.6, 1.0],
                smoothing: 0.85,
                audioMap: [
                    { path: 'extremeDynamics.dimensionLift', scale: 0.28 },
                    { path: 'bands.mid', scale: 0.2 }
                ],
                tags: ['camera']
            },
            frameBlend: {
                value: 0,
                range: [0, 1.3],
                smoothing: 0.82,
                audioMap: [
                    { path: 'rhythmPhases.accentPulse', scale: 0.32 },
                    { path: 'extremeDynamics.motionVelocity', scale: 0.3 }
                ],
                tags: ['lighting']
            },
            lightWrap: {
                value: 0,
                range: [0, 1.6],
                smoothing: 0.84,
                audioMap: [
                    { path: 'bands.mid', scale: 0.28 },
                    { path: 'colorChoreography.accentLuma', scale: 0.26 }
                ],
                tags: ['lighting']
            },
            colorBleed: {
                value: 0,
                range: [0, 1.8],
                smoothing: 0.86,
                audioMap: [
                    { path: 'colorChoreography.orbit', scale: 0.25 },
                    { path: 'extremeDynamics.chaosSurge', scale: 0.3 }
                ],
                tags: ['lighting', 'color']
            }
        });

        this.visualizer = new PolychoraVisualizer(this.canvas);
        await this.visualizer.initialize();
        const initialParams = this.controlBus.getSnapshot(this.parameters.getAllParameters());
        this.visualizer.setParameters(initialParams);
        this.visualizer.set4DRotation(this.rotation4D);

        this.setCameraPreset('bassDropZoom');

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

            if (this.controlBus) {
                this.controlBus.recordGesture('pointerMove', { x, y });
            }

            if (this.controlBus) {
                const centeredX = (x - 0.5) * 2;
                const centeredY = (y - 0.5) * 2;
                const pointerMagnitude = Math.min(1, Math.sqrt(centeredX ** 2 + centeredY ** 2));

                this.controlBus.modulateChannel('hue', centeredX * 80, { decay: 2.6 });
                this.controlBus.modulateChannel('intensity', pointerMagnitude * 0.4, {
                    decay: 3.1,
                    polarity: 'positive'
                });
                this.controlBus.modulateChannel('latticeWarp', centeredY * 0.3, { decay: 2.2 });
            }
        };

        let dragging = false;
        let lastX = 0;
        let lastY = 0;

        this.canvas.addEventListener('mousedown', (event) => {
            dragging = true;
            lastX = event.clientX;
            lastY = event.clientY;
            handlePointer(event.clientX, event.clientY);

            if (this.controlBus) {
                const rect = this.canvas.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    const x = (event.clientX - rect.left) / rect.width;
                    const y = (event.clientY - rect.top) / rect.height;
                    this.controlBus.recordGesture('pointerDown', { x, y });
                }
            }

            if (this.controlBus) {
                this.controlBus.modulateChannel('glowStrength', 0.9, {
                    decay: 4.8,
                    polarity: 'positive'
                });
                this.controlBus.modulateChannel('lineThickness', -0.1, {
                    decay: 5.6,
                    polarity: 'negative'
                });
            }
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

        window.addEventListener('mouseup', (event) => {
            dragging = false;
            if (!this.canvas || !this.controlBus) {
                return;
            }
            const rect = this.canvas.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                const x = (event.clientX - rect.left) / rect.width;
                const y = (event.clientY - rect.top) / rect.height;
                if (Number.isFinite(x) && Number.isFinite(y)) {
                    this.controlBus.recordGesture('pointerUp', { x, y });
                }
            }
        });

        this.canvas.addEventListener('wheel', (event) => {
            if (!this.visualizer) return;
            const delta = Math.max(-1, Math.min(1, event.deltaY));
            const current = this.parameters.getParameter('dimension') ?? 3.8;
            const dimension = Math.max(2.6, Math.min(5.2, current + delta * -0.05));
            this.updateParameter('dimension', dimension);
            if (this.controlBus) {
                this.controlBus.setBaseValue('dimension', dimension, { immediate: true });
            }
        });

        this.canvas.addEventListener('click', () => {
            if (this.controlBus) {
                this.controlBus.modulateChannel('hue', 25, { decay: 3.4 });
                this.controlBus.modulateChannel('glowStrength', 1.1, {
                    decay: 5.2,
                    polarity: 'positive'
                });
            }
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

    updateCameraPresetFromAudio(deltaTime = 16, audioData = {}) {
        if (!this.cameraLighting) {
            return;
        }

        this._cameraPresetCooldownMs = Math.max(0, (this._cameraPresetCooldownMs || 0) - (deltaTime || 0));

        const energy = clamp(audioData.rms, 0, 1);
        const bands = audioData.bands || {};
        const bass = clamp(bands.bass, 0, 1);
        const rhythm = audioData.rhythmPhases || {};
        const accent = clamp(rhythm.accentPulse ?? rhythm.accent, 0, 1);
        const downbeat = clamp(rhythm.downbeatPulse ?? rhythm.downbeat, 0, 1);
        const extreme = audioData.extremeDynamics || {};
        const dimension = clamp(extreme.dimensionLift, 0, 1);
        const chaos = clamp(extreme.chaosSurge, 0, 1);

        const currentPreset = this.getActiveCameraPreset() || 'bassDropZoom';
        let targetPreset = currentPreset;

        if (energy > 0.75 || downbeat > 0.6 || bass > 0.7) {
            targetPreset = 'bassDropZoom';
        } else if (dimension > 0.55 || chaos > 0.5) {
            targetPreset = 'orbitSparkle';
        } else if (energy < 0.36 && accent < 0.32) {
            targetPreset = 'heartGlide';
        }

        if (targetPreset !== currentPreset && this._cameraPresetCooldownMs <= 0) {
            const options = {
                duration: targetPreset === 'bassDropZoom' ? 1050 : targetPreset === 'heartGlide' ? 1600 : 1300,
                easing: targetPreset === 'bassDropZoom' ? 'ease-out' : 'smoothstep'
            };

            if (targetPreset === 'bassDropZoom') {
                options.overrides = { dolly: -0.18, exposure: 0.24 };
            } else if (targetPreset === 'heartGlide') {
                options.overrides = { exposure: -0.1, ambientLight: 0.12 };
            } else if (targetPreset === 'orbitSparkle') {
                options.overrides = { roll: 0.05 };
            }

            this.transitionCameraPreset(targetPreset, options);
            this._cameraPresetCooldownMs = targetPreset === 'bassDropZoom' ? 1700 : 1400;
        }
    }

    update(deltaTime, parameters = {}, audioData, cameraStateOverride = null) {
        if (!this.visualizer) {
            return;
        }

        if (this.visualizer.updateClickIntensity) {
            this.visualizer.updateClickIntensity(deltaTime);
        }

        const controlParams = this.prepareControlParameters(
            deltaTime,
            parameters,
            this.audioEnabled ? audioData : null
        );

        if (this.audioEnabled && audioData) {
            this.updateCameraPresetFromAudio(deltaTime, audioData);
        }

        this.visualizer.setParameters(controlParams);

        const cameraChannels = this.controlBus
            ? this.controlBus.getTaggedSnapshot('camera', controlParams)
            : {};
        const lightingChannels = this.controlBus
            ? this.controlBus.getTaggedSnapshot('lighting', controlParams)
            : {};

        const cameraState = cameraStateOverride || this.cameraLighting.update(
            deltaTime,
            this.audioEnabled ? audioData : null,
            {
                pointer: this.visualizer?.pointer || { x: 0.5, y: 0.5 },
                cameraChannels,
                lightingChannels
            }
        );

        if (cameraState && this.visualizer && this.visualizer.setCameraLighting) {
            this.visualizer.setCameraLighting(cameraState);
        }

        const time = this.visualizer.getTime();
        const color = this.colorSystem.getColor(
            this.visualizer.pointer?.x ?? 0.5,
            this.visualizer.pointer?.y ?? 0.5,
            time,
            controlParams.hue || 220,
            audioData
        );
        this.visualizer.setColor(color);

        if (this.controlBus && color) {
            if (typeof color.energy === 'number') {
                this.controlBus.modulateChannel('glowStrength', color.energy * 0.45, {
                    decay: 3.8,
                    polarity: 'positive'
                });
                this.controlBus.modulateChannel('intensity', color.energy * 0.3, {
                    decay: 3.4,
                    polarity: 'positive'
                });
            }

            if (typeof color.pointerRadius === 'number') {
                this.controlBus.modulateChannel('latticeWarp', (color.pointerRadius - 0.5) * 0.6, {
                    decay: 2.6
                });
            }

            if (typeof color.orbit === 'number') {
                this.controlBus.modulateChannel('hue', (color.orbit - 0.5) * 180, {
                    decay: 4.2
                });
            }
        }

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

        if (this.controlBus) {
            this.controlBus.modulateChannel('latticeDensity', onset * 3.5, {
                decay: 3.8,
                polarity: 'positive'
            });
            this.controlBus.modulateChannel('glowStrength', onset * 1.6, {
                decay: 5.6,
                polarity: 'positive'
            });
            this.controlBus.modulateChannel('dimension', (high - mid) * 0.8, { decay: 2.4 });
        }
    }
}
