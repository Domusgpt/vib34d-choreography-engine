import { ChoreographyEngine } from '../../src/core/ChoreographyEngine.js';
import { RotationChoreographer } from '../../src/choreographers/RotationChoreographer.js';
import { ShaderChoreographer } from '../../src/choreographers/ShaderChoreographer.js';
import { PaletteDirector } from '../../src/choreographers/PaletteDirector.js';
import { SceneDirector } from '../../src/choreographers/SceneDirector.js';
import { QuantumHolographicVisualizer } from '../../src/visualizers/quantum/QuantumVisualizer.js';
import { IntegratedHolographicVisualizer } from '../../src/visualizers/faceted/FacetedVisualizer.js';
import { HolographicVisualizer } from '../../src/visualizers/holographic/HolographicVisualizer.js';
import { AudioAnalyzer } from '../../src/audio/AudioAnalyzer.js';
import { GeometryLibrary } from '../../src/geometry/GeometryLibrary.js';

const CONSOLE_TEMPLATE = `
<button id="controlToggle" aria-expanded="true">
            <span class="dot" aria-hidden="true"></span>
            Controls
        </button>

        <div id="controlPanel">
            <div class="panel-header">
                <div class="title-row">
                    <h1>Ultimate Reactive Console</h1>
                    <span class="layout-pill" id="layoutBadge" aria-live="polite">Auto Layout</span>
                    <button class="panel-close" id="panelClose" aria-label="Hide controls">×</button>
                </div>
                <div class="status-grid">
                    <div class="status-card">
                        <span class="status-label">Visualizer</span>
                        <span class="status-value" id="visualizerStatus">Quantum</span>
                    </div>
                    <div class="status-card">
                        <span class="status-label">Track</span>
                        <span class="status-value" id="audioStatus">Idle</span>
                    </div>
                    <div class="status-card">
                        <span class="status-label">BPM</span>
                        <span class="status-value" id="tempoStatus">128</span>
                    </div>
                    <div class="status-card">
                        <span class="status-label">Timeline</span>
                        <span class="status-value" id="measureStatus">0:00</span>
                    </div>
                    <div class="status-card status-scene">
                        <span class="status-label">Scene</span>
                        <span class="status-value" id="sceneStatus">Aurora Orbit</span>
                        <span class="status-sub" id="nextSceneStatus">Next: —</span>
                        <span class="status-sub" id="sceneCountdown">In —</span>
                    </div>
                </div>
                <div class="status-row">
                    <div class="status-audio">
                        <span class="status-dot mock" id="statusDot" aria-hidden="true"></span>
                        <div class="status-audio-text">
                            <span class="status-mode" id="statusMode">Mock Audio</span>
                            <span class="status-track" id="statusTrack">No track loaded</span>
                        </div>
                    </div>
                    <div class="status-beat">
                        <span class="status-beat-value" id="statusBeat">Beat 1</span>
                        <span class="status-measure" id="statusCycle">Measure 1</span>
                    </div>
                </div>
            </div>

            <nav class="panel-tabs" id="panelTabs" aria-label="Control views" role="tablist">
                <button class="tab-button active" type="button" data-tab="overview" id="tab-button-overview" role="tab" aria-controls="tab-overview">Overview</button>
                <button class="tab-button" type="button" data-tab="directors" id="tab-button-directors" role="tab" aria-controls="tab-directors">Directors</button>
                <button class="tab-button" type="button" data-tab="parameters" id="tab-button-parameters" role="tab" aria-controls="tab-parameters">Parameters</button>
                <button class="tab-button" type="button" data-tab="automation" id="tab-button-automation" role="tab" aria-controls="tab-automation">Automation</button>
            </nav>

            <div class="panel-body" id="panelBody">
                <div class="tab-panel active" data-tab="overview" id="tab-overview" role="tabpanel" aria-labelledby="tab-button-overview">
                                    <section class="collapsible open" data-section="audio">
                                        <button class="collapsible-header" type="button" aria-expanded="true">
                                            <span>Audio &amp; Transport</span>
                                            <span class="chevron">▼</span>
                                        </button>
                                        <div class="collapsible-content">
                                            <div class="section-inner">
                                                <div class="transport-grid">
                                                    <div class="transport-column">
                                                        <label class="file-picker">
                                                            <span id="filePickerLabel">Load Audio Track</span>
                                                            <input type="file" id="audioFile" accept="audio/*">
                                                        </label>
                                                        <div class="transport-row">
                                                            <button id="playBtn" class="pill-button">Play</button>
                                                            <button id="pauseBtn" class="pill-button danger">Pause</button>
                                                        </div>
                                                        <div class="timeline">
                                                            <span id="timelineCurrent">00:00</span>
                                                            <div class="timeline-track">
                                                                <div class="timeline-progress" id="timelineProgress"></div>
                                                            </div>
                                                            <span id="timelineDuration">--:--</span>
                                                        </div>
                                                    </div>
                                                    <div class="reactivity-column">
                                                        <div class="reactivity-meter" aria-label="Average reactivity">
                                                            <div class="reactivity-meter-fill" id="reactivityMeter"></div>
                                                        </div>
                                                        <div class="control-row compact">
                                                            <div class="control-label">
                                                                <span>Reactivity</span>
                                                                <span id="reactivityValue">1.00</span>
                                                            </div>
                                                            <input type="range" id="reactivityAmount" min="0" max="2" step="0.05" value="1">
                                                        </div>
                                                        <div class="pill-row" id="reactivityToggles">
                                                            <button class="pill-button active" data-react="density">Density</button>
                                                            <button class="pill-button active" data-react="morph">Morph</button>
                                                            <button class="pill-button active" data-react="chaos">Chaos</button>
                                                            <button class="pill-button active" data-react="rotation">Rotation</button>
                                                            <button class="pill-button active" data-react="color">Color</button>
                                                            <button class="pill-button active" data-react="vibrance">Vibrance</button>
                                                            <button class="pill-button active" data-react="glitch">Glitch</button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="band-meter">
                                                    <div class="band-bar" data-band="sub">
                                                        <div class="fill" id="band-sub"></div>
                                                        <span>Sub</span>
                                                    </div>
                                                    <div class="band-bar" data-band="bass">
                                                        <div class="fill" id="band-bass"></div>
                                                        <span>Bass</span>
                                                    </div>
                                                    <div class="band-bar" data-band="low">
                                                        <div class="fill" id="band-low"></div>
                                                        <span>Low</span>
                                                    </div>
                                                    <div class="band-bar" data-band="mid">
                                                        <div class="fill" id="band-mid"></div>
                                                        <span>Mid</span>
                                                    </div>
                                                    <div class="band-bar" data-band="highMid">
                                                        <div class="fill" id="band-highMid"></div>
                                                        <span>High-M</span>
                                                    </div>
                                                    <div class="band-bar" data-band="high">
                                                        <div class="fill" id="band-high"></div>
                                                        <span>High</span>
                                                    </div>
                                                    <div class="band-bar" data-band="air">
                                                        <div class="fill" id="band-air"></div>
                                                        <span>Air</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section class="collapsible open" data-section="visualizer">
                                        <button class="collapsible-header" type="button" aria-expanded="true">
                                            <span>Visualizer Selector</span>
                                            <span class="chevron">▼</span>
                                        </button>
                                        <div class="collapsible-content">
                                            <div class="section-inner">
                                                <div class="button-group" id="systemSelector">
                                                    <button class="chip active system-btn" data-system="quantum">Quantum</button>
                                                    <button class="chip system-btn" data-system="faceted">Faceted</button>
                                                    <button class="chip system-btn" data-system="holographic">Holographic</button>
                                                </div>
                                                <div class="note-card">
                                                    Switch visual engines while keeping parameter curves, automation, and palettes in sync.
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section class="collapsible" data-section="palette-quick">
                                        <button class="collapsible-header" type="button" aria-expanded="false">
                                            <span>Palette Quick Picks</span>
                                            <span class="chevron">▼</span>
                                        </button>
                                        <div class="collapsible-content">
                                            <div class="section-inner">
                                                <div class="chip-grid" id="paletteQuickGrid"></div>
                                                <div class="pill-row" id="paletteQuickStyle">
                                                    <button class="pill-button active" data-style="0">Hypercolor</button>
                                                    <button class="pill-button" data-style="1">Uniform</button>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section class="collapsible open" data-section="geometry">
                                        <button class="collapsible-header" type="button" aria-expanded="true">
                                            <span>Geometry Library</span>
                                            <span class="chevron">▼</span>
                                        </button>
                                        <div class="collapsible-content">
                                            <div class="section-inner">
                                                <div class="button-group" id="geometryBtns"></div>
                                            </div>
                                        </div>
                                    </section>
                </div>

                <div class="tab-panel" data-tab="directors" id="tab-directors" role="tabpanel" aria-labelledby="tab-button-directors" hidden>
                                    <section class="collapsible open" data-section="scenes">
                                        <button class="collapsible-header" type="button" aria-expanded="true">
                                            <span>Scene Director</span>
                                            <span class="chevron">▼</span>
                                        </button>
                                        <div class="collapsible-content">
                                            <div class="section-inner">
                                                <div class="scene-controls">
                                                    <div class="mode-bar" id="sceneModeBar">
                                                        <button class="mode-button active" data-scene-mode="reactive">Reactive</button>
                                                        <button class="mode-button" data-scene-mode="interval">Interval</button>
                                                        <button class="mode-button" data-scene-mode="tempo">Tempo</button>
                                                        <button class="mode-button" data-scene-mode="energy">Energy</button>
                                                        <button class="mode-button" data-scene-mode="off">Manual</button>
                                                    </div>
                                                    <div class="mode-bar compact" id="sceneOrderBar">
                                                        <button class="mode-button active" data-scene-order="forward">In Order</button>
                                                        <button class="mode-button" data-scene-order="shuffle">Shuffle</button>
                                                    </div>
                                                    <div class="scene-transport">
                                                        <button class="pill-button secondary" type="button" id="scenePrev">Prev Scene</button>
                                                        <button class="pill-button" type="button" id="sceneNext">Next Scene</button>
                                                    </div>
                                                    <div class="control-row compact scene-control hidden" data-scene-mode="interval">
                                                        <div class="control-label"><span>Interval (s)</span><span id="value-sceneInterval">48s</span></div>
                                                        <input type="range" id="sceneInterval" min="12" max="240" step="1" value="48">
                                                    </div>
                                                    <div class="control-row compact scene-control hidden" data-scene-mode="tempo">
                                                        <div class="control-label"><span>Beats per Scene</span><span id="value-sceneTempo">32</span></div>
                                                        <input type="range" id="sceneTempo" min="4" max="128" step="1" value="32">
                                                    </div>
                                                    <div class="control-row compact scene-control hidden" data-scene-mode="energy">
                                                        <div class="control-label"><span>Energy Trigger</span><span id="value-sceneEnergy">0.78</span></div>
                                                        <input type="range" id="sceneEnergy" min="0.4" max="0.95" step="0.01" value="0.78">
                                                    </div>
                                                </div>
                                                <div class="scene-layout">
                                                    <div class="scene-deck-wrapper">
                                                        <div class="scene-grid" id="sceneDeck"></div>
                                                        <div class="cycle-grid" id="sceneRotationGrid"></div>
                                                    </div>
                                                    <aside class="scene-sidebar">
                                                        <div class="mini-panel" id="sceneQueuePanel">
                                                            <div class="mini-panel-header">
                                                                <span>Manual Queue</span>
                                                                <button class="pill-button secondary" type="button" id="clearSceneQueue">Clear</button>
                                                            </div>
                                                            <div class="mini-panel-subtitle">Scenes fire in order before automation resumes.</div>
                                                            <ul class="mini-list" id="sceneQueueList"></ul>
                                                        </div>
                                                        <div class="mini-panel" id="sceneFavoritePanel">
                                                            <div class="mini-panel-header">
                                                                <span>Favorites</span>
                                                            </div>
                                                            <div class="mini-panel-subtitle">Tap to jump instantly to featured looks.</div>
                                                            <div class="mini-chip-grid" id="sceneFavoriteGrid"></div>
                                                        </div>
                                                        <div class="mini-panel" id="sceneHistoryPanel">
                                                            <div class="mini-panel-header">
                                                                <span>Recent Scenes</span>
                                                            </div>
                                                            <div class="mini-panel-subtitle">Live log of manual and automatic triggers.</div>
                                                            <ul class="mini-list" id="sceneHistoryList"></ul>
                                                        </div>
                                                    </aside>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                </div>

                <div class="tab-panel" data-tab="parameters" id="tab-parameters" role="tabpanel" aria-labelledby="tab-button-parameters" hidden>
                                    <section class="collapsible open" data-section="core-parameters">
                                        <button class="collapsible-header" type="button" aria-expanded="true">
                                            <span>Core Motion</span>
                                            <span class="chevron">▼</span>
                                        </button>
                                        <div class="collapsible-content">
                                            <div class="section-inner" id="coreParameterStack"></div>
                                        </div>
                                    </section>

                                    <section class="collapsible" data-section="color">
                                        <button class="collapsible-header" type="button" aria-expanded="false">
                                            <span>Color &amp; Atmosphere</span>
                                            <span class="chevron">▼</span>
                                        </button>
                                        <div class="collapsible-content">
                                            <div class="section-inner" id="colorParameterStack">
                                                <div class="button-group" id="paletteStyleGroup" role="group" aria-label="Palette style">
                                                    <button class="chip active" data-style="0" type="button">Hypercolor</button>
                                                    <button class="chip" data-style="1" type="button">Uniform</button>
                                                </div>
                                                <div class="button-group" id="paletteChipGroup"></div>
                                                <div class="mode-bar" id="paletteModeBar">
                                                    <button class="mode-button active" data-palette-mode="reactive">Reactive</button>
                                                    <button class="mode-button" data-palette-mode="interval">Interval</button>
                                                    <button class="mode-button" data-palette-mode="tempo">Tempo</button>
                                                    <button class="mode-button" data-palette-mode="energy">Energy</button>
                                                    <button class="mode-button" data-palette-mode="off">Manual</button>
                                                </div>
                                                <div class="cycle-grid" id="paletteCycleGrid"></div>
                                                <div class="control-row compact hidden" data-mode="interval">
                                                    <div class="control-label"><span>Interval (s)</span><span id="value-paletteInterval">32s</span></div>
                                                    <input type="range" id="paletteInterval" min="6" max="160" step="1" value="32">
                                                </div>
                                                <div class="control-row compact hidden" data-mode="tempo">
                                                    <div class="control-label"><span>Beats per Shift</span><span id="value-paletteTempo">8</span></div>
                                                    <input type="range" id="paletteTempo" min="2" max="48" step="1" value="8">
                                                </div>
                                                <div class="control-row compact hidden" data-mode="energy">
                                                    <div class="control-label"><span>Energy Threshold</span><span id="value-paletteEnergy">0.72</span></div>
                                                    <input type="range" id="paletteEnergy" min="0.3" max="0.95" step="0.01" value="0.72">
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section class="collapsible" data-section="rotation">
                                        <button class="collapsible-header" type="button" aria-expanded="false">
                                            <span>4D Rotation Control</span>
                                            <span class="chevron">▼</span>
                                        </button>
                                        <div class="collapsible-content">
                                            <div class="section-inner" id="rotationParameterStack"></div>
                                        </div>
                                    </section>
                </div>

                <div class="tab-panel" data-tab="automation" id="tab-automation" role="tabpanel" aria-labelledby="tab-button-automation" hidden>
                                    <section class="collapsible" data-section="patterns">
                                        <button class="collapsible-header" type="button" aria-expanded="false">
                                            <span>Rotation Patterns</span>
                                            <span class="chevron">▼</span>
                                        </button>
                                        <div class="collapsible-content">
                                            <div class="section-inner">
                                                <div class="button-group" id="rotationBtns"></div>
                                            </div>
                                        </div>
                                    </section>

                                    <section class="collapsible" data-section="sequences">
                                        <button class="collapsible-header" type="button" aria-expanded="false">
                                            <span>Sequence Launchers</span>
                                            <span class="chevron">▼</span>
                                        </button>
                                        <div class="collapsible-content">
                                            <div class="section-inner">
                                                <div class="button-group" id="sequenceBtns"></div>
                                            </div>
                                        </div>
                                    </section>

                                    <section class="collapsible" data-section="thresholds">
                                        <button class="collapsible-header" type="button" aria-expanded="false">
                                            <span>Reactivity Thresholds</span>
                                            <span class="chevron">▼</span>
                                        </button>
                                        <div class="collapsible-content">
                                            <div class="section-inner" id="thresholdStack"></div>
                                        </div>
                                    </section>
                </div>
            </div>
        </div>
    </div>
`;

export async function launchUltimateConsole(options = {}) {
    const { canvasId = 'mainCanvas', hostId = 'consoleHost', layout = 'auto' } = options;
    const host = document.getElementById(hostId);
    if (!host) {
        throw new Error(`Ultimate console host "${hostId}" not found`);
    }
    host.innerHTML = CONSOLE_TEMPLATE;

    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        throw new Error(`Canvas element "${canvasId}" not found`);
    }

    const appShell = document.getElementById('appShell');
    const rendererNotice = document.createElement('div');
    rendererNotice.id = 'rendererNotice';
    rendererNotice.innerHTML = `
        <div class="renderer-notice-card">
            <div class="renderer-notice-text">
                <span class="renderer-label">Visualizer</span>
                <span class="renderer-state" id="rendererState">Starting…</span>
                <span class="renderer-detail" id="rendererDetail">Preparing WebGL</span>
            </div>
            <button id="rendererRetry" class="pill-button">Retry</button>
        </div>
    `;
    appShell?.appendChild(rendererNotice);
    const rendererState = document.getElementById('rendererState');
    const rendererDetail = document.getElementById('rendererDetail');
    const rendererRetry = document.getElementById('rendererRetry');

    const resizeCanvas = () => {
        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        const height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

const controlPanel = document.getElementById('controlPanel');
const panelBody = document.getElementById('panelBody');
const controlToggle = document.getElementById('controlToggle');
const panelClose = document.getElementById('panelClose');
const tabButtons = Array.from(document.querySelectorAll('.tab-button'));
const tabPanels = Array.from(document.querySelectorAll('.tab-panel'));
const visualizerStatus = document.getElementById('visualizerStatus');
const audioStatus = document.getElementById('audioStatus');
const filePickerLabel = document.getElementById('filePickerLabel');
const tempoStatus = document.getElementById('tempoStatus');
const measureStatus = document.getElementById('measureStatus');
const sceneStatus = document.getElementById('sceneStatus');
const nextSceneStatus = document.getElementById('nextSceneStatus');
const sceneCountdown = document.getElementById('sceneCountdown');
const statusDot = document.getElementById('statusDot');
const statusMode = document.getElementById('statusMode');
const statusTrack = document.getElementById('statusTrack');
const statusBeat = document.getElementById('statusBeat');
const statusCycle = document.getElementById('statusCycle');
const timelineCurrent = document.getElementById('timelineCurrent');
    const timelineDuration = document.getElementById('timelineDuration');
    const timelineProgress = document.getElementById('timelineProgress');
    const reactivityMeter = document.getElementById('reactivityMeter');
    const reactivityValue = document.getElementById('reactivityValue');
    const layoutBadge = document.getElementById('layoutBadge');
const paletteQuickGrid = document.getElementById('paletteQuickGrid');
const paletteQuickStyle = document.getElementById('paletteQuickStyle');
const paletteChipGroup = document.getElementById('paletteChipGroup');
const paletteModeBar = document.getElementById('paletteModeBar');
const paletteCycleGrid = document.getElementById('paletteCycleGrid');
const paletteIntervalSlider = document.getElementById('paletteInterval');
const paletteTempoSlider = document.getElementById('paletteTempo');
const paletteEnergySlider = document.getElementById('paletteEnergy');
const paletteIntervalValue = document.getElementById('value-paletteInterval');
const paletteTempoValue = document.getElementById('value-paletteTempo');
const paletteEnergyValue = document.getElementById('value-paletteEnergy');
const reactivityAmountSlider = document.getElementById('reactivityAmount');
const reactivityToggleRow = document.getElementById('reactivityToggles');
const sceneDeck = document.getElementById('sceneDeck');
const sceneModeBar = document.getElementById('sceneModeBar');
const sceneOrderBar = document.getElementById('sceneOrderBar');
const scenePrevButton = document.getElementById('scenePrev');
const sceneNextButton = document.getElementById('sceneNext');
const sceneRotationGrid = document.getElementById('sceneRotationGrid');
const sceneQueueList = document.getElementById('sceneQueueList');
const sceneHistoryList = document.getElementById('sceneHistoryList');
const sceneFavoriteGrid = document.getElementById('sceneFavoriteGrid');
const clearSceneQueueButton = document.getElementById('clearSceneQueue');
const sceneIntervalSlider = document.getElementById('sceneInterval');
const sceneTempoSlider = document.getElementById('sceneTempo');
const sceneEnergySlider = document.getElementById('sceneEnergy');
const sceneIntervalValue = document.getElementById('value-sceneInterval');
const sceneTempoValue = document.getElementById('value-sceneTempo');
const sceneEnergyValue = document.getElementById('value-sceneEnergy');

let currentTrackName = 'No track loaded';
if (statusTrack) {
    statusTrack.textContent = currentTrackName;
}

let currentSystem = 'quantum';
const paletteState = { profile: 0, style: 0 };
let currentGeometryIndex = 0;
const baseParams = {
    intensity: 1.0,
    gridDensity: 25,
    morphFactor: 1.0,
    chaos: 0.2,
    speed: 1.0,
    dimension: 3.5,
    hue: 180,
    saturation: 1.0,
    rot4dXW: 0,
    rot4dYW: 0,
    rot4dZW: 0
};
const colorState = {
    vibrance: 1.2,
    moire: 0,
    style: paletteState.style
};
const reactivity = {
    amount: 1.0,
    enabled: {
        density: true,
        morph: true,
        chaos: true,
        rotation: true,
        color: true,
        vibrance: true,
        glitch: true
    }
};

const setRendererNotice = ({ state = 'Starting…', detail = 'Preparing WebGL', error = false } = {}) => {
    if (rendererState) {
        rendererState.textContent = state;
        rendererState.dataset.error = error ? 'true' : 'false';
    }
    if (rendererDetail) {
        rendererDetail.textContent = detail;
    }
    rendererNotice?.classList.toggle('visible', error);
};

const visualizerFactories = {
    quantum: () => new QuantumHolographicVisualizer(canvasId, 'content', 1.0, 0),
    faceted: () => new IntegratedHolographicVisualizer(canvasId, 'content', 1.0, 0),
    holographic: () => new HolographicVisualizer(canvasId, 'content', 1.0, 0)
};

const buildVisualizer = (system) => {
    try {
        const instance = visualizerFactories[system]();
        setRendererNotice({ state: 'Online', detail: `${system} renderer active`, error: false });
        return instance;
    } catch (error) {
        console.error(`Failed to start ${system} visualizer`, error);
        setRendererNotice({ state: 'Offline', detail: 'Renderer failed to start', error: true });
        return null;
    }
};

let currentVisualizer = buildVisualizer(currentSystem) || buildVisualizer('quantum');

if (!currentVisualizer) {
    throw new Error('Unable to start any visualizer renderer');
}

const hydrateVisualizerState = () => {
    sliderDefinitions.filter(def => def.param).forEach(def => {
        const slider = sliderElements.get(def.id);
        if (slider) {
            const value = parseFloat(slider.value);
            currentVisualizer.updateParameter(def.id, value);
        }
    });
    currentVisualizer.updateParameter('colorProfile', paletteState.profile);
    currentVisualizer.updateParameter('colorStyle', paletteState.style);
    currentVisualizer.updateParameter('colorVibrance', colorState.vibrance);
    currentVisualizer.updateParameter('glitchMoire', colorState.moire);
    currentVisualizer.updateParameter('geometry', currentGeometryIndex);
};

let audioAnalyzer = null;
let audioContext = null;
let audioElement = null;
let audioObjectUrl = null;
let onsetThreshold = 0.85;
let bassThreshold = 0.83;
let lastBeatUpdate = 0;

const releaseVisualizer = (visualizer) => {
    if (!visualizer) return;
    if (visualizer.destroy) {
        visualizer.destroy();
    }
    if (visualizer.gl) {
        const lose = visualizer.gl.getExtension('WEBGL_lose_context');
        if (lose) {
            lose.loseContext();
        }
    }
};

const swapVisualizer = (system) => {
    if (!visualizerFactories[system]) return;
    if (system === currentSystem && currentVisualizer) return;

    releaseVisualizer(currentVisualizer);

    const nextVisualizer = buildVisualizer(system);
    if (!nextVisualizer) {
        currentSystem = 'quantum';
        currentVisualizer = buildVisualizer('quantum');
        if (currentVisualizer) {
            hydrateVisualizerState();
            resizeCanvas();
            engine.visualizers = [currentVisualizer];
            shaderChoreographer.visualizer = currentVisualizer;
            shaderChoreographer.gl = currentVisualizer.gl;
            shaderChoreographer.program = currentVisualizer.program;
        }
        return;
    }

    currentSystem = system;
    currentVisualizer = nextVisualizer;
    hydrateVisualizerState();
    resizeCanvas();

    engine.visualizers = [currentVisualizer];
    shaderChoreographer.visualizer = currentVisualizer;
    shaderChoreographer.gl = currentVisualizer.gl;
    shaderChoreographer.program = currentVisualizer.program;

    if (visualizerStatus) {
        visualizerStatus.textContent = system.charAt(0).toUpperCase() + system.slice(1);
    }
};

const engine = new ChoreographyEngine({
    visualizers: [currentVisualizer],
    audioAnalyzer: null,
    bpm: 128
});

tempoStatus.textContent = engine.bpm;

const rotationChoreographer = new RotationChoreographer();
const shaderChoreographer = new ShaderChoreographer(currentVisualizer);

await engine.loadSequenceLibrary('../src/sequences/presets/bass-drops.json');

// Responsive control surface
const layoutParams = new URLSearchParams(window.location.search);
const layoutOption = typeof layout === 'string' ? layout.toLowerCase() : 'auto';
const searchLayoutRaw = layoutParams.get('layout');
const searchLayout = searchLayoutRaw ? searchLayoutRaw.toLowerCase() : null;
let forcedLayout = null;
if (layoutOption && layoutOption !== 'auto') {
    forcedLayout = layoutOption;
} else if (searchLayout && searchLayout !== 'auto') {
    forcedLayout = searchLayout;
}
const forceMobileLayout = forcedLayout === 'mobile';
const forceDesktopLayout = forcedLayout === 'desktop';
document.body.dataset.consoleLayout = forceMobileLayout ? 'mobile' : forceDesktopLayout ? 'desktop' : 'auto';

const mobileQuery = window.matchMedia('(max-width: 900px)');
const describeLayout = (isMobile) => {
    if (!layoutBadge) return;
    const label = forceMobileLayout
        ? 'Mobile preset'
        : forceDesktopLayout
            ? 'Desktop preset'
            : isMobile
                ? 'Auto · Mobile'
                : 'Auto · Desktop';
    layoutBadge.textContent = label;
    layoutBadge.dataset.mode = isMobile ? 'mobile' : 'desktop';
};

function setPanelOpen(open) {
    const isMobile = forceMobileLayout || (!forceDesktopLayout && mobileQuery.matches);
    if (isMobile) {
        controlPanel.classList.toggle('open-mobile', open);
        controlPanel.classList.toggle('collapsed', !open);
    } else {
        controlPanel.classList.toggle('collapsed', !open);
    }
    controlToggle.setAttribute('aria-expanded', open);
    controlToggle.classList.toggle('collapsed', !open);
    describeLayout(isMobile);
}

function syncPanelToViewport() {
    const isMobile = forceMobileLayout || (!forceDesktopLayout && mobileQuery.matches);
    if (forceMobileLayout) {
        controlPanel.classList.add('open-mobile');
        controlPanel.classList.remove('collapsed');
        controlToggle.setAttribute('aria-expanded', 'true');
        controlToggle.classList.remove('collapsed');
        describeLayout(true);
        return;
    }
    if (forceDesktopLayout) {
        describeLayout(false);
        setPanelOpen(true);
        return;
    }
    describeLayout(isMobile);
    setPanelOpen(!isMobile);
}

if (!forceMobileLayout && !forceDesktopLayout) {
    mobileQuery.addEventListener('change', () => {
        syncPanelToViewport();
        syncSectionLayout();
    });
}
syncPanelToViewport();

controlToggle.addEventListener('click', () => {
    const isCollapsed = controlPanel.classList.contains('collapsed') && !controlPanel.classList.contains('open-mobile');
    setPanelOpen(isCollapsed);
});

panelClose.addEventListener('click', () => setPanelOpen(false));

function activateTab(targetTab) {
    tabButtons.forEach(button => {
        const active = button.dataset.tab === targetTab;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
        button.setAttribute('aria-selected', active ? 'true' : 'false');
        button.setAttribute('tabindex', active ? '0' : '-1');
    });

    tabPanels.forEach(panel => {
        const active = panel.dataset.tab === targetTab;
        panel.classList.toggle('active', active);
        if (active) {
            panel.removeAttribute('hidden');
            panel.setAttribute('aria-hidden', 'false');
            panel.setAttribute('tabindex', '0');
            panel.querySelectorAll('.collapsible.open .collapsible-content').forEach(content => {
                content.style.maxHeight = content.scrollHeight + 'px';
            });
        } else {
            panel.setAttribute('hidden', '');
            panel.setAttribute('aria-hidden', 'true');
            panel.setAttribute('tabindex', '-1');
        }
    });

    if (panelBody) {
        panelBody.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

tabButtons.forEach(button => {
    button.addEventListener('click', () => activateTab(button.dataset.tab));
});

activateTab('overview');

function focusTabByOffset(currentIndex, delta) {
    const total = tabButtons.length;
    if (!total) return;
    const nextIndex = (currentIndex + delta + total) % total;
    const nextButton = tabButtons[nextIndex];
    activateTab(nextButton.dataset.tab);
    nextButton.focus();
}

tabButtons.forEach((button, index) => {
    button.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            focusTabByOffset(index, 1);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            focusTabByOffset(index, -1);
        }
    });
});

// Collapsible sections
const collapsibleSections = Array.from(document.querySelectorAll('.collapsible'));
const defaultOpenMobile = new Set(['audio', 'visualizer', 'palette-quick']);
const defaultOpenDesktop = new Set(['audio', 'visualizer', 'palette-quick', 'geometry']);

function setCollapsibleOpen(section, open) {
    const header = section.querySelector('.collapsible-header');
    const content = section.querySelector('.collapsible-content');
    section.classList.toggle('open', open);
    header?.setAttribute('aria-expanded', open);
    if (content) {
        content.style.maxHeight = open ? `${content.scrollHeight}px` : null;
    }
}

function syncSectionLayout() {
    const isMobile = forceMobileLayout || (!forceDesktopLayout && mobileQuery.matches);
    const defaults = isMobile ? defaultOpenMobile : defaultOpenDesktop;
    collapsibleSections.forEach((section) => {
        if (section.dataset.userToggled === 'true') return;
        const key = section.dataset.section;
        setCollapsibleOpen(section, defaults.has(key));
    });
}

collapsibleSections.forEach(section => {
    const header = section.querySelector('.collapsible-header');
    const content = section.querySelector('.collapsible-content');
    header.addEventListener('click', () => {
        const open = section.classList.toggle('open');
        section.dataset.userToggled = 'true';
        header.setAttribute('aria-expanded', open);
        if (open) {
            content.style.maxHeight = content.scrollHeight + 'px';
        } else {
            content.style.maxHeight = null;
        }
    });
    if (section.classList.contains('open')) {
        requestAnimationFrame(() => {
            content.style.maxHeight = content.scrollHeight + 'px';
        });
    }
});

window.addEventListener('resize', () => {
    document.querySelectorAll('.collapsible.open .collapsible-content').forEach(content => {
        content.style.maxHeight = content.scrollHeight + 'px';
    });
});
syncSectionLayout();

// Slider creation helpers
const sliderContainers = {
    core: document.getElementById('coreParameterStack'),
    color: document.getElementById('colorParameterStack'),
    rotation: document.getElementById('rotationParameterStack'),
    thresholds: document.getElementById('thresholdStack')
};

const sliderDefinitions = [
    { id: 'intensity', label: 'Intensity', min: 0.1, max: 2.0, step: 0.05, value: 1.0, section: 'core', param: true, format: v => v.toFixed(2) },
    { id: 'gridDensity', label: 'Grid Density', min: 5, max: 80, step: 1, value: 25, section: 'core', param: true, format: v => Math.round(v) },
    { id: 'morphFactor', label: 'Morph Factor', min: 0.1, max: 3.0, step: 0.05, value: 1.0, section: 'core', param: true, format: v => v.toFixed(2) },
    { id: 'chaos', label: 'Chaos', min: 0, max: 1, step: 0.02, value: 0.2, section: 'core', param: true, format: v => v.toFixed(2) },
    { id: 'speed', label: 'Speed', min: 0.1, max: 3.0, step: 0.05, value: 1.0, section: 'core', param: true, format: v => v.toFixed(2) },
    { id: 'dimension', label: 'Dimension', min: 2.0, max: 5.0, step: 0.05, value: 3.5, section: 'core', param: true, format: v => v.toFixed(2) },
    { id: 'hue', label: 'Hue', min: 0, max: 360, step: 1, value: 180, section: 'color', param: true, format: v => Math.round(v) },
    { id: 'saturation', label: 'Saturation', min: 0, max: 1, step: 0.02, value: 1.0, section: 'color', param: true, format: v => v.toFixed(2) },
    { id: 'colorVibrance', label: 'Color Vibrance', min: 0.3, max: 2.5, step: 0.05, value: 1.2, section: 'color', param: true, format: v => v.toFixed(2) },
    { id: 'glitchMoire', label: 'Moiré RGB Offset', min: 0, max: 1, step: 0.02, value: 0.0, section: 'color', param: true, format: v => v.toFixed(2) },
    { id: 'rot4dXW', label: 'Rotation XW', min: -6.28, max: 6.28, step: 0.05, value: 0, section: 'rotation', param: true, format: v => v.toFixed(2) },
    { id: 'rot4dYW', label: 'Rotation YW', min: -6.28, max: 6.28, step: 0.05, value: 0, section: 'rotation', param: true, format: v => v.toFixed(2) },
    { id: 'rot4dZW', label: 'Rotation ZW', min: -6.28, max: 6.28, step: 0.05, value: 0, section: 'rotation', param: true, format: v => v.toFixed(2) },
    { id: 'onsetThresh', label: 'Onset Threshold', min: 0.5, max: 0.99, step: 0.01, value: onsetThreshold, section: 'thresholds', format: v => v.toFixed(2), onInput: v => { onsetThreshold = v; } },
    { id: 'bassThresh', label: 'Bass Threshold', min: 0.5, max: 0.99, step: 0.01, value: bassThreshold, section: 'thresholds', format: v => v.toFixed(2), onInput: v => { bassThreshold = v; } }
];

const sliderElements = new Map();
const sliderLabels = new Map();
const sliderDefinitionMap = new Map();
const bandKeys = ['sub', 'bass', 'low', 'mid', 'highMid', 'high', 'air'];
const bandElements = bandKeys.map((key) => document.getElementById(`band-${key}`));

function createSlider(def) {
    const container = sliderContainers[def.section];
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'control-row';

    const label = document.createElement('label');
    label.className = 'control-label';
    const labelSpan = document.createElement('span');
    labelSpan.textContent = def.label;
    const valueSpan = document.createElement('span');
    valueSpan.textContent = typeof def.format === 'function' ? def.format(def.value) : def.value;
    label.append(labelSpan, valueSpan);

    const input = document.createElement('input');
    input.type = 'range';
    input.id = def.id;
    input.min = def.min;
    input.max = def.max;
    input.step = def.step;
    input.value = def.value;

    input.addEventListener('input', () => {
        const rawValue = parseFloat(input.value);
        valueSpan.textContent = typeof def.format === 'function' ? def.format(rawValue) : rawValue;
        if (def.param) {
            currentVisualizer.updateParameter(def.id, rawValue);
        }
        if (Object.prototype.hasOwnProperty.call(baseParams, def.id)) {
            baseParams[def.id] = rawValue;
        }
        if (def.id === 'colorVibrance') {
            colorState.vibrance = rawValue;
        }
        if (def.id === 'glitchMoire') {
            colorState.moire = rawValue;
        }
        if (def.onInput) def.onInput(rawValue);
    });

    row.append(label, input);
    container.appendChild(row);
    sliderElements.set(def.id, input);
    sliderLabels.set(def.id, valueSpan);
    sliderDefinitionMap.set(def.id, def);

    if (def.param) {
        currentVisualizer.updateParameter(def.id, def.value);
    }
}

sliderDefinitions.forEach(createSlider);

function setSliderValue(id, value) {
    const slider = sliderElements.get(id);
    const def = sliderDefinitionMap.get(id);
    if (!slider || !def) {
        return;
    }

    slider.value = value;
    const label = sliderLabels.get(id);
    if (label) {
        label.textContent = typeof def.format === 'function' ? def.format(value) : value;
    }

    if (def.param) {
        currentVisualizer.updateParameter(id, value);
    }
    if (Object.prototype.hasOwnProperty.call(baseParams, id)) {
        baseParams[id] = value;
    }
    if (id === 'colorVibrance') {
        colorState.vibrance = value;
    }
    if (id === 'glitchMoire') {
        colorState.moire = value;
    }

    if (typeof def.onInput === 'function') {
        def.onInput(value);
    }
}

const palettes = [
    { id: 0, name: 'Legacy Hypercolor', description: 'Classic multi-spectrum energy' },
    { id: 1, name: 'Aurora Bloom', description: 'Glacial blues with aurora flares' },
    { id: 2, name: 'Solar Inferno', description: 'Molten oranges and eclipse reds' },
    { id: 3, name: 'Midnight Prism', description: 'Nocturnal violets and cobalt' },
    { id: 4, name: 'Neon Mirage', description: 'Cyan magenta nightclub haze' },
    { id: 5, name: 'Monochrome Bloom', description: 'Greyscale bloom for filmic mood' },
    { id: 6, name: 'Luxe Ember', description: 'Gold embers with teal shadows' },
    { id: 7, name: 'Biolumens', description: 'Deep sea greens with electric blue' },
    { id: 8, name: 'Cyber Noir', description: 'Violet storms with neon cyan' },
    { id: 9, name: 'Aurora Cascade', description: 'Prismatic teal and lilac' }
];

const paletteDirector = new PaletteDirector({
    palettes,
    intervalSeconds: parseInt(paletteIntervalSlider.value, 10) || 32,
    tempoDivision: parseInt(paletteTempoSlider.value, 10) || 8,
    energyThreshold: parseFloat(paletteEnergySlider.value) || 0.72,
    mode: 'reactive'
});

const paletteStyleGroup = document.getElementById('paletteStyleGroup');
const paletteChips = new Map();
const cycleChips = new Map();
const paletteQuickChips = new Map();

const updatePaletteStyleUI = () => {
    if (paletteStyleGroup) {
        paletteStyleGroup.querySelectorAll('button').forEach((button) => {
            const style = Number.parseInt(button.dataset.style, 10);
            button.classList.toggle('active', style === paletteState.style);
        });
    }
    if (paletteQuickStyle) {
        paletteQuickStyle.querySelectorAll('button').forEach((button) => {
            const style = Number.parseInt(button.dataset.style, 10);
            button.classList.toggle('active', style === paletteState.style);
        });
    }
};

const setPaletteStyle = (style, { notify = false } = {}) => {
    const numeric = Number.isFinite(style) ? Math.max(0, Math.floor(style)) : 0;
    if (paletteState.style === numeric) {
        updatePaletteStyleUI();
        return;
    }
    paletteState.style = numeric;
    colorState.style = numeric;
    updatePaletteStyleUI();
    currentVisualizer.updateParameter('colorStyle', paletteState.style);
    if (notify) {
        const elapsedSeconds = (Date.now() - engine.startTime) / 1000;
        paletteDirector.acknowledgeManualSelection(elapsedSeconds);
    }
};

const updatePaletteSelectionUI = () => {
    paletteChips.forEach((chip, id) => {
        chip.classList.toggle('active', id === paletteState.profile);
    });
    paletteQuickChips.forEach((chip, id) => {
        chip.classList.toggle('active', id === paletteState.profile);
    });
};

const refreshCycleState = () => {
    const playlist = new Set(paletteDirector.getState().playlist);
    cycleChips.forEach((chip, id) => {
        chip.classList.toggle('active', playlist.has(id));
    });
};

const setPaletteMode = (mode) => {
    paletteDirector.setMode(mode);
    paletteModeBar.querySelectorAll('.mode-button').forEach(button => {
        button.classList.toggle('active', button.dataset.paletteMode === mode);
    });
    document.querySelectorAll('.control-row.compact').forEach(row => {
        const targetMode = row.dataset.mode;
        row.classList.toggle('hidden', targetMode !== mode);
    });
};

const selectPalette = (paletteId, { notify = true } = {}) => {
    if (!Number.isFinite(paletteId)) return;
    const numeric = Math.max(0, Math.floor(paletteId));
    if (paletteState.profile === numeric) {
        updatePaletteSelectionUI();
        return;
    }
    paletteState.profile = numeric;
    updatePaletteSelectionUI();
    currentVisualizer.updateParameter('colorProfile', paletteState.profile);
    if (notify) {
        const elapsedSeconds = (Date.now() - engine.startTime) / 1000;
        paletteDirector.acknowledgeManualSelection(elapsedSeconds);
    }
};

if (reactivityAmountSlider) {
    reactivityAmountSlider.value = reactivity.amount.toString();
    if (reactivityValue) {
        reactivityValue.textContent = reactivity.amount.toFixed(2);
    }
    reactivityAmountSlider.addEventListener('input', (event) => {
        const raw = parseFloat(event.target.value);
        if (Number.isNaN(raw)) return;
        reactivity.amount = raw;
        if (reactivityValue) {
            reactivityValue.textContent = reactivity.amount.toFixed(2);
        }
    });
}

if (reactivityToggleRow) {
    reactivityToggleRow.querySelectorAll('button').forEach((button) => {
        const key = button.dataset.react;
        if (!key) return;
        button.classList.toggle('active', !!reactivity.enabled[key]);
        button.addEventListener('click', () => {
            reactivity.enabled[key] = !reactivity.enabled[key];
            button.classList.toggle('active', reactivity.enabled[key]);
        });
    });
}

if (paletteStyleGroup) {
    paletteStyleGroup.querySelectorAll('button').forEach((button) => {
        button.addEventListener('click', () => {
            const style = Number.parseInt(button.dataset.style, 10);
            if (Number.isNaN(style)) return;
            setPaletteStyle(style, { notify: true });
        });
    });
}

if (paletteQuickStyle) {
    paletteQuickStyle.querySelectorAll('button').forEach((button) => {
        button.addEventListener('click', () => {
            const style = Number.parseInt(button.dataset.style, 10);
            if (Number.isNaN(style)) return;
            setPaletteStyle(style, { notify: true });
        });
    });
}

updatePaletteStyleUI();

palettes.forEach((palette) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = palette.name;
    chip.title = palette.description;
    if (palette.id === paletteState.profile) {
        chip.classList.add('active');
    }
    chip.addEventListener('click', () => selectPalette(palette.id, { notify: true }));
    paletteChipGroup.appendChild(chip);
    paletteChips.set(palette.id, chip);

    const cycleChip = document.createElement('button');
    cycleChip.className = 'cycle-chip';
    cycleChip.textContent = palette.name;
    cycleChip.title = `Include ${palette.name} in auto rotation`;
    if (paletteDirector.playlist.has(palette.id)) {
        cycleChip.classList.add('active');
    }
    cycleChip.addEventListener('click', () => {
        paletteDirector.togglePlaylist(palette.id);
        refreshCycleState();
    });
    paletteCycleGrid.appendChild(cycleChip);
    cycleChips.set(palette.id, cycleChip);

    if (paletteQuickGrid) {
        const quickChip = document.createElement('button');
        quickChip.className = 'pill-button';
        quickChip.textContent = palette.name;
        quickChip.title = palette.description;
        quickChip.classList.toggle('active', palette.id === paletteState.profile);
        quickChip.addEventListener('click', () => selectPalette(palette.id, { notify: true }));
        paletteQuickGrid.appendChild(quickChip);
        paletteQuickChips.set(palette.id, quickChip);
    }
});

paletteModeBar.querySelectorAll('.mode-button').forEach(button => {
    button.addEventListener('click', () => {
        setPaletteMode(button.dataset.paletteMode);
    });
});

paletteIntervalSlider.addEventListener('input', () => {
    const seconds = parseInt(paletteIntervalSlider.value, 10);
    paletteIntervalValue.textContent = `${seconds}s`;
    paletteDirector.setInterval(seconds);
});

paletteTempoSlider.addEventListener('input', () => {
    const beats = parseInt(paletteTempoSlider.value, 10);
    paletteTempoValue.textContent = beats;
    paletteDirector.setTempoDivision(beats);
});

paletteEnergySlider.addEventListener('input', () => {
    const threshold = parseFloat(paletteEnergySlider.value);
    paletteEnergyValue.textContent = threshold.toFixed(2);
    paletteDirector.setEnergyThreshold(threshold);
});

paletteIntervalValue.textContent = `${paletteIntervalSlider.value}s`;
paletteTempoValue.textContent = paletteTempoSlider.value;
paletteEnergyValue.textContent = parseFloat(paletteEnergySlider.value).toFixed(2);
setPaletteMode('reactive');
setPaletteStyle(paletteState.style);
updatePaletteSelectionUI();
refreshCycleState();


// Geometry buttons
const geoNames = GeometryLibrary.getGeometryNames();
const geometryContainer = document.getElementById('geometryBtns');
const geometryButtons = new Map();

const setGeometry = (index) => {
    currentGeometryIndex = index;
    currentVisualizer.updateParameter('geometry', index);
    geometryButtons.forEach((button, buttonIndex) => {
        button.classList.toggle('active', buttonIndex === index);
    });
};

geoNames.forEach((name, index) => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.textContent = name;
    btn.addEventListener('click', () => setGeometry(index));
    geometryContainer.appendChild(btn);
    geometryButtons.set(index, btn);
});

setGeometry(currentGeometryIndex);

const sceneLibrary = [
    {
        id: 'aurora-orbit',
        name: 'Aurora Orbit',
        description: 'Teal and lilac ribbons spiral across the hypersphere.',
        tags: ['Glide', 'Aurora'],
        paletteId: 9,
        geometry: 2,
        parameters: {
            gridDensity: 36,
            morphFactor: 1.35,
            chaos: 0.26,
            speed: 1.18,
            dimension: 3.9,
            intensity: 1.15,
            hue: 210,
            saturation: 1.08,
            rot4dXW: 1.2,
            rot4dYW: 0.68,
            rot4dZW: 0.92
        },
        color: {
            vibrance: 1.45,
            moire: 0.32
        }
    },
    {
        id: 'ember-throttle',
        name: 'Ember Throttle',
        description: 'Molten gold fractals pulse with percussive hits.',
        tags: ['Fractal', 'Heat'],
        paletteId: 6,
        geometry: 5,
        parameters: {
            gridDensity: 48,
            morphFactor: 1.6,
            chaos: 0.54,
            speed: 1.45,
            dimension: 3.4,
            intensity: 1.35,
            hue: 34,
            saturation: 1.22,
            rot4dXW: 0.48,
            rot4dYW: 0.86,
            rot4dZW: 1.38
        },
        color: {
            vibrance: 1.82,
            moire: 0.18
        }
    },
    {
        id: 'cyber-veil',
        name: 'Cyber Veil',
        description: 'Chromatic hypercube orbits with neon vapor trails.',
        tags: ['Glitch', 'Vapor'],
        paletteId: 8,
        geometry: 1,
        parameters: {
            gridDensity: 28,
            morphFactor: 0.92,
            chaos: 0.24,
            speed: 1.05,
            dimension: 3.6,
            intensity: 1.05,
            hue: 288,
            saturation: 1.18,
            rot4dXW: 0.94,
            rot4dYW: 1.28,
            rot4dZW: 0.74
        },
        color: {
            vibrance: 1.38,
            moire: 0.46
        }
    },
    {
        id: 'mono-lens',
        name: 'Mono Lens',
        description: 'Film grain bloom with monochrome focus pulls.',
        tags: ['Filmic', 'Calm'],
        paletteId: 5,
        geometry: 3,
        parameters: {
            gridDensity: 22,
            morphFactor: 0.82,
            chaos: 0.18,
            speed: 0.95,
            dimension: 3.2,
            intensity: 0.95,
            hue: 8,
            saturation: 0.3,
            rot4dXW: 0.22,
            rot4dYW: 0.42,
            rot4dZW: 0.58
        },
        color: {
            vibrance: 0.62,
            moire: 0.06,
            style: 1
        }
    },
    {
        id: 'neon-surge',
        name: 'Neon Surge',
        description: 'Sonic waveforms ignite magenta and cyan turbulence.',
        tags: ['Hype', 'Wave'],
        paletteId: 4,
        geometry: 6,
        parameters: {
            gridDensity: 40,
            morphFactor: 1.12,
            chaos: 0.36,
            speed: 1.72,
            dimension: 3.7,
            intensity: 1.28,
            hue: 332,
            saturation: 1.24,
            rot4dXW: 1.58,
            rot4dYW: 1.12,
            rot4dZW: 1.78
        },
        color: {
            vibrance: 1.6,
            moire: 0.55
        }
    }
];

const sceneDirector = new SceneDirector({
    scenes: sceneLibrary,
    intervalSeconds: parseInt(sceneIntervalSlider.value, 10) || 48,
    tempoDivision: parseInt(sceneTempoSlider.value, 10) || 32,
    energyThreshold: parseFloat(sceneEnergySlider.value) || 0.78,
    cooldownSeconds: 8,
    mode: 'reactive'
});

const sceneCards = new Map();
const sceneCycleChips = new Map();
const sceneFavoriteButtons = new Map();
const sceneQueueButtons = new Map();
let activeSceneId = sceneLibrary.length ? sceneLibrary[0].id : null;
let latestAudioData = null;
let latestElapsedSeconds = 0;

const updateSceneSelectionUI = (status = null) => {
    const queueIds = status?.queue
        ? new Set(status.queue.map((entry) => entry.id))
        : new Set(sceneDirector.getState().queue || []);

    sceneCards.forEach((card, id) => {
        const isActive = id === activeSceneId;
        const isFavorite = sceneDirector.isFavorite(id);
        const isQueued = queueIds.has(id);

        card.classList.toggle('active', isActive);
        card.classList.toggle('favorite', isFavorite);

        const favoriteButton = sceneFavoriteButtons.get(id);
        if (favoriteButton) {
            favoriteButton.classList.toggle('active', isFavorite);
            favoriteButton.setAttribute('aria-pressed', isFavorite ? 'true' : 'false');
        }

        const queueButton = sceneQueueButtons.get(id);
        if (queueButton) {
            queueButton.classList.toggle('active', isQueued);
            queueButton.setAttribute('aria-pressed', isQueued ? 'true' : 'false');
        }
    });

    if (sceneStatus) {
        if (activeSceneId) {
            const activeScene = sceneDirector.getSceneById(activeSceneId);
            sceneStatus.textContent = activeScene ? activeScene.name : '—';
        } else {
            sceneStatus.textContent = '—';
        }
    }
};

const formatCountdownValue = (seconds) => {
    if (seconds == null || !Number.isFinite(seconds)) {
        return '—';
    }
    const safe = Math.max(0, seconds);
    if (safe >= 90) {
        const minutes = Math.floor(safe / 60);
        const secs = Math.floor(safe % 60).toString().padStart(2, '0');
        return `${minutes}:${secs}`;
    }
    if (safe >= 10) {
        return `${Math.round(safe)}s`;
    }
    return `${safe.toFixed(1)}s`;
};

const formatReasonLabel = (reason, manual = false) => {
    if (manual) {
        return 'Manual';
    }
    switch (reason) {
        case 'interval':
            return 'Interval';
        case 'tempo':
            return 'Tempo';
        case 'energy':
            return 'Energy';
        case 'reactive':
            return 'Reactive';
        case 'manual':
            return 'Manual';
        default:
            if (typeof reason === 'string' && reason.length) {
                return reason.charAt(0).toUpperCase() + reason.slice(1);
            }
            return 'Auto';
    }
};

const formatTimeAgo = (timestamp) => {
    if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
        return '—';
    }
    const delta = Math.max(0, Date.now() - timestamp);
    if (delta < 1000) {
        return 'Just now';
    }
    if (delta < 60_000) {
        return `${Math.floor(delta / 1000)}s ago`;
    }
    if (delta < 3_600_000) {
        return `${Math.floor(delta / 60_000)}m ago`;
    }
    if (delta < 86_400_000) {
        return `${Math.floor(delta / 3_600_000)}h ago`;
    }
    return `${Math.floor(delta / 86_400_000)}d ago`;
};

const renderSceneQueue = (status = null) => {
    if (!sceneQueueList) return;
    sceneQueueList.innerHTML = '';

    const queue = status?.queue || [];
    if (clearSceneQueueButton) {
        clearSceneQueueButton.disabled = queue.length === 0;
    }

    if (queue.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'empty-state';
        empty.textContent = 'Queue empty';
        empty.setAttribute('aria-live', 'polite');
        sceneQueueList.appendChild(empty);
        return;
    }

    queue.forEach((entry, index) => {
        const item = document.createElement('li');

        const descriptor = document.createElement('div');
        descriptor.className = 'descriptor';

        const title = document.createElement('span');
        title.className = 'title';
        title.textContent = `${index + 1}. ${entry.name}`;
        descriptor.appendChild(title);

        if (entry.description) {
            const meta = document.createElement('span');
            meta.className = 'meta';
            meta.textContent = entry.description;
            descriptor.appendChild(meta);
        }

        item.appendChild(descriptor);

        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'scene-card-actions';

        const launchButton = document.createElement('button');
        launchButton.type = 'button';
        launchButton.className = 'scene-card-action';
        launchButton.textContent = 'Launch';
        launchButton.addEventListener('click', (event) => {
            event.stopPropagation();
            const queuedScene = sceneDirector.getSceneById(entry.id);
            if (queuedScene) {
                applyScene(queuedScene);
            }
        });

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'scene-card-action';
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', (event) => {
            event.stopPropagation();
            sceneDirector.removeFromQueue(entry.id);
            updateSceneStatusDisplays(sceneDirector.getStatus(latestAudioData, latestElapsedSeconds, activeSceneId));
        });

        buttonGroup.appendChild(launchButton);
        buttonGroup.appendChild(removeButton);
        item.appendChild(buttonGroup);

        sceneQueueList.appendChild(item);
    });
};

const renderSceneFavorites = (status = null) => {
    if (!sceneFavoriteGrid) return;
    sceneFavoriteGrid.innerHTML = '';

    const favorites = status?.favorites || [];
    if (favorites.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'No favorites yet';
        sceneFavoriteGrid.appendChild(empty);
        return;
    }

    favorites.forEach((entry) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'mini-chip';
        chip.textContent = entry.name;
        chip.addEventListener('click', () => {
            const favScene = sceneDirector.getSceneById(entry.id);
            if (favScene) {
                applyScene(favScene);
            }
        });
        chip.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            sceneDirector.toggleFavorite(entry.id);
            updateSceneStatusDisplays(sceneDirector.getStatus(latestAudioData, latestElapsedSeconds, activeSceneId));
        });
        sceneFavoriteGrid.appendChild(chip);
    });
};

const renderSceneHistory = (status = null) => {
    if (!sceneHistoryList) return;
    sceneHistoryList.innerHTML = '';

    const history = status?.history || [];
    if (history.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'empty-state';
        empty.textContent = 'No recent events';
        sceneHistoryList.appendChild(empty);
        return;
    }

    history.forEach((entry) => {
        const item = document.createElement('li');

        const descriptor = document.createElement('div');
        descriptor.className = 'descriptor';

        const title = document.createElement('span');
        title.className = 'title';
        title.textContent = entry.name || 'Scene';
        descriptor.appendChild(title);

        const meta = document.createElement('span');
        meta.className = 'meta';
        meta.textContent = `${formatReasonLabel(entry.reason, entry.manual)} · ${formatTimeAgo(entry.timestamp)}`;
        descriptor.appendChild(meta);

        item.appendChild(descriptor);

        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'scene-card-actions';

        const replayButton = document.createElement('button');
        replayButton.type = 'button';
        replayButton.className = 'scene-card-action';
        replayButton.textContent = 'Replay';
        replayButton.addEventListener('click', (event) => {
            event.stopPropagation();
            const historyScene = sceneDirector.getSceneById(entry.id);
            if (historyScene) {
                applyScene(historyScene);
            }
        });

        buttonGroup.appendChild(replayButton);
        item.appendChild(buttonGroup);

        sceneHistoryList.appendChild(item);
    });
};

const updateSceneStatusDisplays = (status = null) => {
    if (nextSceneStatus) {
        nextSceneStatus.textContent = status?.nextSceneName
            ? `Next: ${status.nextSceneName}`
            : 'Next: —';
    }

    if (sceneCountdown) {
        const countdownText = status?.countdownSeconds != null && Number.isFinite(status.countdownSeconds)
            ? `In ${formatCountdownValue(status.countdownSeconds)}`
            : 'In —';
        sceneCountdown.textContent = countdownText;
    }

    renderSceneQueue(status);
    renderSceneFavorites(status);
    renderSceneHistory(status);
    updateSceneSelectionUI(status);
};

const updateSceneOrderUI = () => {
    if (!sceneOrderBar) return;
    const ordering = sceneDirector.getState().ordering || 'forward';
    sceneOrderBar.querySelectorAll('.mode-button').forEach((button) => {
        button.classList.toggle('active', button.dataset.sceneOrder === ordering);
    });
};

const handleSceneShift = (direction) => {
    if (direction === 'previous') {
        const previousId = sceneDirector.getPreviousSceneId(activeSceneId);
        const previousScene = sceneDirector.getSceneById(previousId);
        if (previousScene) {
            applyScene(previousScene);
        }
        return;
    }

    const nextId = sceneDirector.getNextSceneId(activeSceneId, { preview: false });
    const nextScene = sceneDirector.getSceneById(nextId);
    if (nextScene) {
        applyScene(nextScene);
    }
};

const refreshSceneRotationState = () => {
    const rotationSet = new Set(sceneDirector.getState().rotationSet);
    sceneCycleChips.forEach((chip, id) => {
        chip.classList.toggle('active', rotationSet.has(id));
    });
    updateSceneStatusDisplays(sceneDirector.getStatus(latestAudioData, latestElapsedSeconds, activeSceneId));
};

const applyScene = (scene, options = {}) => {
    if (!scene) return;

    activeSceneId = scene.id;

    if (typeof scene.geometry === 'number') {
        setGeometry(scene.geometry);
    }

    if (scene.parameters) {
        Object.entries(scene.parameters).forEach(([key, value]) => setSliderValue(key, value));
    }

    if (scene.color) {
        if (typeof scene.color.hue === 'number') setSliderValue('hue', scene.color.hue);
        if (typeof scene.color.saturation === 'number') setSliderValue('saturation', scene.color.saturation);
        if (typeof scene.color.vibrance === 'number') setSliderValue('colorVibrance', scene.color.vibrance);
        if (typeof scene.color.moire === 'number') setSliderValue('glitchMoire', scene.color.moire);
        if (typeof scene.color.style === 'number') setPaletteStyle(scene.color.style, { notify: !options.auto });
    }

    if (typeof scene.paletteId === 'number') {
        selectPalette(scene.paletteId, { notify: !options.auto });
    }

    if (!options.auto) {
        const elapsedSeconds = Number.isFinite(latestElapsedSeconds)
            ? latestElapsedSeconds
            : (Date.now() - engine.startTime) / 1000;
        const elapsedBeats = latestAudioData?.rhythmPhases?.elapsedBeats;
        sceneDirector.acknowledgeManualSelection(elapsedSeconds, elapsedBeats, scene.id, { manual: true });
    }

    const status = sceneDirector.getStatus(latestAudioData, latestElapsedSeconds, activeSceneId);
    updateSceneStatusDisplays(status);
};

sceneLibrary.forEach((scene) => {
    const card = document.createElement('div');
    card.className = 'scene-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', `Activate scene ${scene.name}`);

    const nameEl = document.createElement('span');
    nameEl.className = 'scene-name';
    nameEl.textContent = scene.name;
    card.appendChild(nameEl);

    const metaEl = document.createElement('span');
    metaEl.className = 'scene-meta';
    metaEl.textContent = scene.description;
    card.appendChild(metaEl);

    if (Array.isArray(scene.tags) && scene.tags.length) {
        const tagsEl = document.createElement('div');
        tagsEl.className = 'scene-tags';
        scene.tags.forEach((tag) => {
            const tagEl = document.createElement('span');
            tagEl.className = 'scene-tag';
            tagEl.textContent = tag;
            tagsEl.appendChild(tagEl);
        });
        card.appendChild(tagsEl);
    }

    const actionRow = document.createElement('div');
    actionRow.className = 'scene-card-actions';

    const favoriteButton = document.createElement('button');
    favoriteButton.type = 'button';
    favoriteButton.className = 'scene-card-action';
    favoriteButton.dataset.action = 'favorite';
    favoriteButton.textContent = 'Favorite';
    favoriteButton.setAttribute('aria-pressed', 'false');
    favoriteButton.title = `Toggle ${scene.name} as a favorite`;
    favoriteButton.addEventListener('click', (event) => {
        event.stopPropagation();
        sceneDirector.toggleFavorite(scene.id);
        updateSceneStatusDisplays(sceneDirector.getStatus(latestAudioData, latestElapsedSeconds, activeSceneId));
    });

    const queueButton = document.createElement('button');
    queueButton.type = 'button';
    queueButton.className = 'scene-card-action';
    queueButton.dataset.action = 'queue';
    queueButton.textContent = 'Queue Next';
    queueButton.setAttribute('aria-pressed', 'false');
    queueButton.title = `Queue ${scene.name} to run before automation`;
    queueButton.addEventListener('click', (event) => {
        event.stopPropagation();
        sceneDirector.queueScene(scene.id);
        updateSceneStatusDisplays(sceneDirector.getStatus(latestAudioData, latestElapsedSeconds, activeSceneId));
    });

    actionRow.appendChild(favoriteButton);
    actionRow.appendChild(queueButton);
    card.appendChild(actionRow);

    card.addEventListener('click', (event) => {
        if (event.target instanceof HTMLElement && event.target.closest('.scene-card-action')) {
            return;
        }
        applyScene(scene);
    });

    card.addEventListener('keydown', (event) => {
        if ((event.key === 'Enter' || event.key === ' ') && event.target === card) {
            event.preventDefault();
            applyScene(scene);
        }
    });

    sceneDeck.appendChild(card);
    sceneCards.set(scene.id, card);
    sceneFavoriteButtons.set(scene.id, favoriteButton);
    sceneQueueButtons.set(scene.id, queueButton);

    const cycleChip = document.createElement('button');
    cycleChip.type = 'button';
    cycleChip.className = 'cycle-chip';
    cycleChip.textContent = scene.name;
    cycleChip.title = `Include ${scene.name} in scene rotation`;
    cycleChip.addEventListener('click', () => {
        sceneDirector.toggleScene(scene.id);
        refreshSceneRotationState();
    });
    sceneRotationGrid.appendChild(cycleChip);
    sceneCycleChips.set(scene.id, cycleChip);
});

if (clearSceneQueueButton) {
    clearSceneQueueButton.addEventListener('click', () => {
        sceneDirector.clearQueue();
        updateSceneStatusDisplays(sceneDirector.getStatus(latestAudioData, latestElapsedSeconds, activeSceneId));
    });
}

const setSceneMode = (mode) => {
    sceneDirector.setMode(mode);
    sceneModeBar.querySelectorAll('.mode-button').forEach((button) => {
        button.classList.toggle('active', button.dataset.sceneMode === mode);
    });
    document.querySelectorAll('.scene-control').forEach((control) => {
        const target = control.dataset.sceneMode;
        control.classList.toggle('hidden', target !== mode);
    });
    updateSceneStatusDisplays(sceneDirector.getStatus(latestAudioData, latestElapsedSeconds, activeSceneId));
};

sceneModeBar.querySelectorAll('.mode-button').forEach((button) => {
    button.addEventListener('click', () => setSceneMode(button.dataset.sceneMode));
});

if (sceneOrderBar) {
    sceneOrderBar.querySelectorAll('.mode-button').forEach((button) => {
        button.addEventListener('click', () => {
            const ordering = button.dataset.sceneOrder;
            sceneDirector.setOrdering(ordering);
            updateSceneOrderUI();
            updateSceneStatusDisplays(sceneDirector.getStatus(latestAudioData, latestElapsedSeconds, activeSceneId));
        });
    });
}

if (scenePrevButton) {
    scenePrevButton.addEventListener('click', () => handleSceneShift('previous'));
}

if (sceneNextButton) {
    sceneNextButton.addEventListener('click', () => handleSceneShift('next'));
}

sceneIntervalSlider.addEventListener('input', () => {
    const seconds = parseInt(sceneIntervalSlider.value, 10);
    sceneIntervalValue.textContent = `${seconds}s`;
    sceneDirector.setInterval(seconds);
    updateSceneStatusDisplays(sceneDirector.getStatus(latestAudioData, latestElapsedSeconds, activeSceneId));
});

sceneTempoSlider.addEventListener('input', () => {
    const beats = parseInt(sceneTempoSlider.value, 10);
    sceneTempoValue.textContent = beats;
    sceneDirector.setTempoDivision(beats);
    updateSceneStatusDisplays(sceneDirector.getStatus(latestAudioData, latestElapsedSeconds, activeSceneId));
});

sceneEnergySlider.addEventListener('input', () => {
    const threshold = parseFloat(sceneEnergySlider.value);
    sceneEnergyValue.textContent = threshold.toFixed(2);
    sceneDirector.setEnergyThreshold(threshold);
    updateSceneStatusDisplays(sceneDirector.getStatus(latestAudioData, latestElapsedSeconds, activeSceneId));
});

sceneIntervalValue.textContent = `${sceneIntervalSlider.value}s`;
sceneTempoValue.textContent = sceneTempoSlider.value;
sceneEnergyValue.textContent = parseFloat(sceneEnergySlider.value).toFixed(2);
setSceneMode('reactive');
updateSceneOrderUI();
refreshSceneRotationState();

if (sceneLibrary.length > 0) {
    applyScene(sceneLibrary[0], { auto: true });
    sceneDirector.acknowledgeManualSelection(0, latestAudioData?.rhythmPhases?.elapsedBeats, sceneLibrary[0].id, {
        manual: false,
        reason: 'init'
    });
    updateSceneStatusDisplays(sceneDirector.getStatus(latestAudioData, latestElapsedSeconds, activeSceneId));
} else {
    sceneStatus.textContent = '—';
    updateSceneStatusDisplays();
}

// System switching
document.querySelectorAll('.system-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const system = btn.dataset.system;
        swapVisualizer(system);

        document.querySelectorAll('.system-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

if (rendererRetry) {
    rendererRetry.addEventListener('click', () => {
        const restarted = buildVisualizer(currentSystem) || buildVisualizer('quantum');
        if (restarted) {
            releaseVisualizer(currentVisualizer);
            currentVisualizer = restarted;
            hydrateVisualizerState();
            resizeCanvas();
            engine.visualizers = [currentVisualizer];
            shaderChoreographer.visualizer = currentVisualizer;
            shaderChoreographer.gl = currentVisualizer.gl;
            shaderChoreographer.program = currentVisualizer.program;
        }
    });
}

// Rotation patterns
const rotationContainer = document.getElementById('rotationBtns');
rotationChoreographer.getPatternNames().forEach(name => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.textContent = name.replace(/_/g, ' ');
    btn.addEventListener('click', () => {
        rotationChoreographer.setPattern(name);
        rotationContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
    rotationContainer.appendChild(btn);
});

// Sequences
const sequenceContainer = document.getElementById('sequenceBtns');
engine.sequences.forEach((seq, name) => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.textContent = name.replace(/_/g, ' ').replace(/^sequence\s*/i, '').trim();
    btn.addEventListener('click', () => engine.startSequence(name, Date.now()));
    sequenceContainer.appendChild(btn);
});

// Audio handling
function updateAudioStatus(state, detail = '') {
    audioStatus.textContent = detail ? `${state} · ${detail}` : state;
    if (detail) {
        currentTrackName = detail;
        if (statusTrack) statusTrack.textContent = detail;
    } else if (!audioAnalyzer) {
        currentTrackName = 'No track loaded';
        if (statusTrack) statusTrack.textContent = currentTrackName;
    }
}

updateAudioStatus('Idle');

document.getElementById('audioFile').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
        if (audioElement) {
            audioElement.pause();
            audioElement.src = '';
            if (audioElement.parentNode) {
                audioElement.parentNode.removeChild(audioElement);
            }
        }
        if (audioObjectUrl) {
            URL.revokeObjectURL(audioObjectUrl);
            audioObjectUrl = null;
        }

        const url = URL.createObjectURL(file);
        audioObjectUrl = url;
        audioElement = new Audio();
        audioElement.src = url;
        audioElement.loop = false;
        audioElement.preload = 'auto';
        audioElement.crossOrigin = 'anonymous';
        audioElement.style.display = 'none';
        document.body.appendChild(audioElement);

        if (timelineDuration) {
            timelineDuration.textContent = '--:--';
        }
        if (timelineProgress) {
            timelineProgress.style.width = '0%';
        }

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioAnalyzer = new AudioAnalyzer(audioContext);
        const source = audioContext.createMediaElementSource(audioElement);
        source.connect(audioAnalyzer.analyser);
        audioAnalyzer.analyser.connect(audioContext.destination);
        engine.audioAnalyzer = audioAnalyzer;

        const trackName = file.name.replace(/\.[^/.]+$/, '');
        filePickerLabel.textContent = `Loaded: ${file.name}`;
        updateAudioStatus('Loaded', trackName);

        audioElement.addEventListener('ended', () => updateAudioStatus('Finished'));
        audioElement.addEventListener('pause', () => updateAudioStatus('Paused'));
        audioElement.addEventListener('play', () => updateAudioStatus('Playing'));
        audioElement.addEventListener('loadedmetadata', () => {
            updateAudioStatus('Ready', trackName);
            if (timelineDuration && Number.isFinite(audioElement.duration)) {
                const durMinutes = Math.floor(audioElement.duration / 60);
                const durSeconds = Math.floor(audioElement.duration % 60).toString().padStart(2, '0');
                timelineDuration.textContent = `${durMinutes}:${durSeconds}`;
            }
        });
    } catch (err) {
        console.error(err);
        updateAudioStatus('Error');
    }
});

document.getElementById('playBtn').addEventListener('click', async () => {
    if (!audioElement) return;
    try {
        if (audioContext && audioContext.state === 'suspended') await audioContext.resume();
        await audioElement.play();
    } catch (err) {
        console.error(err);
        updateAudioStatus('Error');
    }
});

document.getElementById('pauseBtn').addEventListener('click', () => {
    if (audioElement) audioElement.pause();
});

// Render loop
engine.start();
function render() {
    const now = Date.now();
    const audioPlaying = !!(audioAnalyzer && audioElement && !audioElement.paused);
    let audioData = audioAnalyzer ? audioAnalyzer.analyze() : engine.getMockAudioData();

    if (!audioData || !audioData.bands) {
        audioData = engine.getMockAudioData();
    }

    latestAudioData = audioData;

    const bands = audioData.bands || {};

    window.audioEnabled = true;
    window.audioReactive = {
        bass: bands.bass || 0.3,
        mid: bands.mid || 0.3,
        high: bands.high || 0.3,
        energy: audioData.rms || 0.3,
        thresholds: {
            onset: onsetThreshold,
            bass: bassThreshold
        },
        bands
    };

    if (statusDot) {
        statusDot.classList.remove('mock', 'real', 'paused');
        if (audioPlaying) {
            statusDot.classList.add('real');
            if (statusMode) statusMode.textContent = 'Real Audio';
        } else if (audioAnalyzer) {
            statusDot.classList.add('paused');
            if (statusMode) statusMode.textContent = 'Paused';
        } else {
            statusDot.classList.add('mock');
            if (statusMode) statusMode.textContent = 'Mock Audio';
        }
    }

    if (statusTrack) {
        statusTrack.textContent = currentTrackName;
    }

    const beat = engine.currentBeat || 0;
    const beatsPerMeasure = Math.max(1, engine.beatsPerMeasure || 4);
    const measureIndex = Number.isFinite(engine.currentMeasure)
        ? engine.currentMeasure
        : Math.floor(beat / beatsPerMeasure);
    if (statusBeat && statusCycle && now - lastBeatUpdate > 120) {
        const beatNumber = (beat % beatsPerMeasure) + 1;
        statusBeat.textContent = `Beat ${Math.round(beatNumber)}`;
        statusCycle.textContent = `Measure ${measureIndex + 1}`;
        lastBeatUpdate = now;
    }

    const seconds = audioElement?.currentTime ?? ((now - engine.startTime) / 1000);
    latestElapsedSeconds = seconds;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    const timelineLabel = `${minutes}:${secs}`;
    if (timelineCurrent) timelineCurrent.textContent = timelineLabel;
    if (measureStatus) measureStatus.textContent = timelineLabel;

    if (timelineProgress) {
        const duration = audioElement?.duration;
        if (Number.isFinite(duration) && duration > 0) {
            const ratio = Math.min(1, Math.max(0, seconds / duration));
            timelineProgress.style.width = `${(ratio * 100).toFixed(1)}%`;
        } else {
            timelineProgress.style.width = '0%';
        }
    }

    const bandValues = bandKeys.map((key, index) => {
        const value = Math.max(0, Math.min(1, bands[key] ?? 0));
        const element = bandElements[index];
        if (element) {
            element.style.height = `${(value * 100).toFixed(1)}%`;
        }
        return value;
    });

    if (reactivityMeter) {
        const avgEnergy = bandValues.reduce((acc, val) => acc + val, 0) / Math.max(1, bandValues.length);
        reactivityMeter.style.width = `${Math.min(100, avgEnergy * reactivity.amount * 100).toFixed(1)}%`;
    }

    const rotationValues = rotationChoreographer.update(
        audioData,
        seconds,
        beat,
        engine.deltaTime || 16
    );
    shaderChoreographer.update(
        audioData,
        (beat % beatsPerMeasure) / beatsPerMeasure,
        beat,
        measureIndex,
        now
    );

    const bass = bands.bass ?? 0;
    const mid = bands.mid ?? 0;
    const high = bands.high ?? 0;
    const air = bands.air ?? 0;
    const rms = audioData.rms ?? 0;
    const onset = audioData.onset ?? 0;
    const beatPhase = audioData.rhythmPhases?.beatPhase ?? 0;

    if (reactivity.enabled.density) {
        const density = Math.min(120, baseParams.gridDensity + bass * 50 * reactivity.amount);
        currentVisualizer.updateParameter('gridDensity', density);
    } else {
        currentVisualizer.updateParameter('gridDensity', baseParams.gridDensity);
    }

    if (reactivity.enabled.morph) {
        const morph = Math.min(2.5, baseParams.morphFactor + mid * 1.6 * reactivity.amount);
        currentVisualizer.updateParameter('morphFactor', morph);
    } else {
        currentVisualizer.updateParameter('morphFactor', baseParams.morphFactor);
    }

    if (reactivity.enabled.chaos) {
        const chaos = Math.min(1.6, baseParams.chaos + rms * 0.7 * reactivity.amount + onset * 0.4);
        currentVisualizer.updateParameter('chaos', chaos);
    } else {
        currentVisualizer.updateParameter('chaos', baseParams.chaos);
    }

    const speed = Math.min(3.0, baseParams.speed + (bass + rms) * 0.7 * reactivity.amount);
    currentVisualizer.updateParameter('speed', speed);
    currentVisualizer.updateParameter('intensity', Math.min(2.5, baseParams.intensity + rms * 0.3));
    currentVisualizer.updateParameter('dimension', baseParams.dimension + (audioData.extremeDynamics?.dimensionLift ?? 0));

    if (reactivity.enabled.rotation) {
        currentVisualizer.updateParameter('rot4dXW', baseParams.rot4dXW + rotationValues.rot4dXW * 0.18);
        currentVisualizer.updateParameter('rot4dYW', baseParams.rot4dYW + rotationValues.rot4dYW * 0.18);
        currentVisualizer.updateParameter('rot4dZW', baseParams.rot4dZW + rotationValues.rot4dZW * 0.22);
    } else {
        currentVisualizer.updateParameter('rot4dXW', baseParams.rot4dXW);
        currentVisualizer.updateParameter('rot4dYW', baseParams.rot4dYW);
        currentVisualizer.updateParameter('rot4dZW', baseParams.rot4dZW);
    }

    if (reactivity.enabled.color) {
        const hue = (baseParams.hue + (high * 260 + beatPhase * 140) * reactivity.amount) % 360;
        const saturation = Math.min(1.4, baseParams.saturation + mid * 0.4 * reactivity.amount);
        currentVisualizer.updateParameter('hue', hue);
        currentVisualizer.updateParameter('saturation', saturation);
    } else {
        currentVisualizer.updateParameter('hue', baseParams.hue);
    }

    if (reactivity.enabled.vibrance) {
        const vibrance = Math.min(2.5, colorState.vibrance + (high * 0.8 + onset * 0.6) * reactivity.amount);
        currentVisualizer.updateParameter('colorVibrance', vibrance);
    } else {
        currentVisualizer.updateParameter('colorVibrance', colorState.vibrance);
    }

    if (reactivity.enabled.glitch) {
        const glitch = Math.min(1, colorState.moire + (onset * 0.7 + air * 0.5) * reactivity.amount);
        currentVisualizer.updateParameter('glitchMoire', glitch);
    } else {
        currentVisualizer.updateParameter('glitchMoire', colorState.moire);
    }

    const suggestedScene = sceneDirector.update(audioData, seconds, activeSceneId);
    if (suggestedScene && suggestedScene.id !== activeSceneId) {
        applyScene(suggestedScene, { auto: true });
    }

    const suggestedPalette = paletteDirector.update(audioData, seconds, paletteState.profile);
    if (suggestedPalette !== null && suggestedPalette !== paletteState.profile) {
        selectPalette(suggestedPalette, { notify: false });
    }

    updateSceneStatusDisplays(sceneDirector.getStatus(audioData, seconds, activeSceneId));

    currentVisualizer.render();
    requestAnimationFrame(render);
}
render();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
    canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
});

return {
    engine,
    getVisualizer: () => currentVisualizer,
    setLayout: (nextLayout = 'auto') => {
        const lowered = typeof nextLayout === 'string' ? nextLayout.toLowerCase() : 'auto';
        const layoutValue = lowered === 'mobile' ? 'mobile' : lowered === 'desktop' ? 'desktop' : 'auto';
        document.body.dataset.consoleLayout = layoutValue;
        if (layoutValue === 'mobile') {
            controlPanel.classList.add('open-mobile');
            controlPanel.classList.remove('collapsed');
            controlToggle.setAttribute('aria-expanded', 'true');
            controlToggle.classList.remove('collapsed');
        } else if (layoutValue === 'desktop') {
            controlPanel.classList.remove('open-mobile');
            setPanelOpen(true);
        } else {
            syncPanelToViewport();
        }
    }
};
}

export default launchUltimateConsole;
