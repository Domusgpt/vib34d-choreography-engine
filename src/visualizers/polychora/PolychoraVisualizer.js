const DEFAULT_PRIMARY = [0.35, 0.45, 0.95];
const DEFAULT_SECONDARY = [0.82, 0.32, 0.92];
const DEFAULT_ACCENT = [1.0, 0.88, 0.65];
const DEFAULT_SHADOW = [0.08, 0.04, 0.12];

const FRAGMENT_SHADER_SOURCE = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_colorPrimary;
uniform vec3 u_colorSecondary;
uniform vec3 u_colorAccent;
uniform vec3 u_colorShadow;
uniform vec4 u_audioLevels;      // bass, mid, high, energy
uniform vec4 u_audioDynamics;    // onset, swing, chaos, motion
uniform vec4 u_audioRhythm;      // beatPhase, measurePhase, accent, ribbon
uniform vec4 u_colorDynamics;    // saturation, orbit, accentLuma, downbeat
uniform float u_dimensionLift;
uniform float u_latticeDensity;
uniform float u_latticeWarp;
uniform float u_glowStrength;
uniform float u_lineThickness;
uniform vec2 u_pointer;
uniform vec3 u_rotPrimary;       // xw, yw, zw
uniform vec3 u_rotSecondary;     // xy, xz, yz
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

mat2 rotate2d(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
}

vec4 rotateXY(vec4 p, float angle) {
    mat2 r = rotate2d(angle);
    vec2 plane = r * vec2(p.x, p.y);
    return vec4(plane.x, plane.y, p.z, p.w);
}

vec4 rotateXZ(vec4 p, float angle) {
    mat2 r = rotate2d(angle);
    vec2 plane = r * vec2(p.x, p.z);
    return vec4(plane.x, p.y, plane.y, p.w);
}

vec4 rotateYZ(vec4 p, float angle) {
    mat2 r = rotate2d(angle);
    vec2 plane = r * vec2(p.y, p.z);
    return vec4(p.x, plane.x, plane.y, p.w);
}

vec4 rotateXW(vec4 p, float angle) {
    mat2 r = rotate2d(angle);
    vec2 plane = r * vec2(p.x, p.w);
    return vec4(plane.x, p.y, p.z, plane.y);
}

vec4 rotateYW(vec4 p, float angle) {
    mat2 r = rotate2d(angle);
    vec2 plane = r * vec2(p.y, p.w);
    return vec4(p.x, plane.x, p.z, plane.y);
}

vec4 rotateZW(vec4 p, float angle) {
    mat2 r = rotate2d(angle);
    vec2 plane = r * vec2(p.z, p.w);
    return vec4(p.x, p.y, plane.x, plane.y);
}

float hyperLattice(vec4 p, float density, float warp, float chaos, float saturation) {
    vec4 q = p;
    q = rotateXY(q, warp * 0.27);
    q = rotateXZ(q, warp * 0.19);
    q = rotateYZ(q, chaos * 0.33);
    q = rotateXW(q, warp * 0.21 + chaos * 0.35);
    q = rotateYW(q, chaos * 0.17 - warp * 0.14);
    q = rotateZW(q, warp * 0.11 + chaos * 0.22);

    vec4 s = sin(q * density);
    vec4 c = cos(q * (density * (0.65 + saturation * 0.45)));

    float lattice = dot(s, s) * 0.25 + dot(c, c) * 0.25;
    float shells = 0.5 + 0.5 * sin(length(q) * density * 0.38 + chaos * 5.0);
    float interference = sin(q.x * density * 0.6 + q.y * density * 0.7 + q.z * density * 0.8 + q.w * density * 0.9);

    float mixFactor = 0.35 + saturation * 0.25;
    float combined = mix(lattice, shells, mixFactor);
    combined = mix(combined, abs(interference), 0.28 + chaos * 0.22);

    return clamp(combined, 0.0, 1.2);
}

void main() {
    vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
    uv.x *= u_resolution.x / max(u_resolution.y, 1.0);

    float orbitAngle = u_cameraOrbit;
    mat2 orbitMat = mat2(cos(orbitAngle), -sin(orbitAngle), sin(orbitAngle), cos(orbitAngle));
    uv = orbitMat * uv;

    float rollAngle = u_cameraRoll;
    mat2 rollMat = mat2(cos(rollAngle), -sin(rollAngle), sin(rollAngle), cos(rollAngle));
    uv = rollMat * uv;

    float zoomFactor = exp(-u_cameraDolly);
    uv *= zoomFactor;

    float elevation = u_cameraElevation;
    uv.y += sin(elevation) * (0.3 + abs(u_cameraDolly) * 0.22);
    uv.x += sin(elevation * 0.55) * 0.12;

    float time = u_time;
    float beat = u_audioRhythm.x;
    float measure = u_audioRhythm.y;
    float accent = u_audioRhythm.z;
    float ribbon = u_audioRhythm.w;

    float saturation = u_colorDynamics.x;
    float orbit = u_colorDynamics.y;
    float accentLuma = u_colorDynamics.z;
    float downbeat = u_colorDynamics.w;

    float onset = u_audioDynamics.x;
    float swing = u_audioDynamics.y;
    float chaos = u_audioDynamics.z;
    float motion = u_audioDynamics.w;

    vec2 pointer = (u_pointer - 0.5) * 2.0;

    float pointerOrbit = atan(pointer.y, pointer.x);
    float pointerMag = length(pointer);

    vec2 scaledUV = uv * (1.0 + u_dimensionLift * 0.3 + pointerMag * 0.2);
    scaledUV += pointer * (0.25 + u_audioLevels.y * 0.1);

    vec4 point = vec4(
        scaledUV,
        sin(time * 0.31 + uv.x * 2.7 + orbit * 6.28318 + pointerOrbit * 0.8),
        cos(time * 0.27 + uv.y * 2.3 + orbit * 3.14159 + pointerMag * 0.6)
    );

    point = rotateXY(point, u_rotSecondary.x + time * 0.17 + beat * 6.28318 * 0.25);
    point = rotateXZ(point, u_rotSecondary.y + time * 0.13 + motion * 2.4);
    point = rotateYZ(point, u_rotSecondary.z + time * -0.11 + swing * 1.7);
    point = rotateXW(point, u_rotPrimary.x + motion * 1.2 + onset * 2.0);
    point = rotateYW(point, u_rotPrimary.y + measure * 6.28318 * 0.35);
    point = rotateZW(point, u_rotPrimary.z + chaos * 2.2 + ribbon * 3.1);

    float warp = u_latticeWarp + orbit * 0.6 + motion * 0.5 + swing * 0.35;
    float lattice = hyperLattice(
        point,
        u_latticeDensity * (1.0 + u_audioLevels.x * 0.4 + u_audioLevels.w * 0.25),
        warp,
        chaos,
        saturation
    );

    float layer1 = abs(sin(lattice * 6.28318 + time * 0.55 + ribbon * 3.14159));
    float layer2 = abs(cos(lattice * 4.28318 + time * 0.32 + onset * 2.4));
    float layer3 = abs(sin(lattice * 8.28318 + time * 0.17 + pointerMag * 1.7));

    float layerMix = mix(layer1, layer2, 0.5 + 0.5 * sin(time * 0.18 + orbit * 6.28318));
    layerMix = mix(layerMix, layer3, 0.38 + chaos * 0.25 + pointerMag * 0.2);

    float grid = smoothstep(1.0 - u_lineThickness, 1.0, layerMix);
    float glow = pow(layerMix, 4.0 + u_audioLevels.z * 2.7 + chaos * 1.9) * u_glowStrength;

    float paletteBlend = clamp(0.45 + saturation * 0.35 + motion * 0.2 + pointerMag * 0.18, 0.0, 1.0);
    vec3 paletteColor = mix(u_colorPrimary, u_colorSecondary, clamp(layerMix + orbit * 0.4 + beat * 0.2, 0.0, 1.0));
    vec3 baseColor = mix(u_colorShadow, paletteColor, paletteBlend);
    vec3 accentColor = mix(baseColor, u_colorAccent, clamp(accent * 0.7 + onset * 0.6 + downbeat * 0.5 + accentLuma * 0.35, 0.0, 1.0));

    vec3 finalColor = mix(baseColor, accentColor, grid);
    vec3 glowColor = mix(u_colorShadow, u_colorAccent, clamp(0.3 + accentLuma * 0.6 + pointerMag * 0.25, 0.0, 1.0));
    finalColor += glow * glowColor;

    float vignette = mix(1.0, smoothstep(1.3, 0.25, length(uv) * (1.0 + u_cameraDolly * 0.3)), clamp(u_vignette, 0.0, 1.0));
    finalColor = mix(u_colorShadow, finalColor, vignette);

    float parallaxWarp = clamp(u_cameraParallax, -1.2, 1.2);
    vec2 parallaxUv = uv + uv * parallaxWarp * 0.15;
    float lensDistortion = clamp(u_lensDistortion, -0.6, 1.0);
    float radiusSq = dot(parallaxUv, parallaxUv);
    parallaxUv *= 1.0 + lensDistortion * radiusSq;
    float focusSpread = max(0.05, u_focusSpread);
    float focusDistance = clamp(u_focusDistance, 0.0, 3.0);
    float focusFalloff = exp(-pow(length(parallaxUv) - focusDistance, 2.0) * (2.0 + focusSpread * 2.2));
    float fogFactor = exp(-pow(length(parallaxUv), 2.0) * (0.75 + clamp(u_fogDensity, 0.0, 1.6) * 1.6));

    vec3 fogBase = mix(vec3(0.1, 0.1, 0.14), vec3(0.22, 0.22, 0.28), clamp(u_lightTemperature, 0.0, 1.3));
    finalColor = mix(fogBase, finalColor, clamp(fogFactor + focusFalloff * 0.42, 0.0, 1.0));
    finalColor += vec3(0.2, 0.14, 0.28) * parallaxWarp * (0.55 + focusFalloff * 0.45);

    vec3 filmColor = finalColor;
    float exposure = max(0.1, u_exposure);
    vec3 toneMapped = vec3(1.0) - exp(-filmColor * exposure);
    float shutter = clamp(u_shutter, 0.2, 3.0);
    toneMapped = pow(clamp(toneMapped, 0.0, 7.0), vec3(1.0 / shutter));
    vec3 bloom = pow(clamp(filmColor, 0.0, 12.0), vec3(1.2)) * clamp(u_bloom, 0.0, 3.0);
    toneMapped += bloom;

    float rim = clamp(u_rimLight, 0.0, 1.5) * pow(clamp(layerMix, 0.0, 1.0), 2.0);
    toneMapped += rim * vec3(0.7, 0.85, 1.1);

    float key = clamp(u_keyLight, 0.0, 2.0);
    toneMapped *= (0.68 + key * 0.55);

    float ambient = clamp(u_ambientLight, 0.0, 1.0);
    toneMapped = mix(vec3(ambient), toneMapped, 0.9);

    vec3 coolGrade = vec3(0.7, 0.92, 1.12);
    vec3 warmGrade = vec3(1.15, 0.94, 0.72);
    toneMapped *= mix(coolGrade, warmGrade, clamp(u_lightTemperature, 0.0, 1.4));

    float shadowMix = clamp(0.52 + clamp(u_shadowContrast, 0.0, 2.2) * 0.36, 0.0, 1.0);
    float luminance = dot(toneMapped, vec3(0.299, 0.587, 0.114));
    toneMapped = mix(vec3(luminance * (0.78 + shadowMix * 0.5)), toneMapped, shadowMix);

    float lightWrap = clamp(u_lightWrap, 0.0, 1.8);
    vec3 wrapColor = mix(
        toneMapped,
        vec3(luminance),
        clamp(lightWrap * (0.32 + focusFalloff * 0.48), 0.0, 0.85)
    );
    toneMapped = mix(toneMapped, wrapColor, clamp(lightWrap, 0.0, 1.0));

    float aberration = clamp(u_chromaticAberration, 0.0, 1.2);
    toneMapped.r += sin(parallaxUv.y * 11.0 + u_time * 0.004) * aberration * 0.12;
    toneMapped.b += cos(parallaxUv.x * 8.5 - u_time * 0.0035) * aberration * 0.12;

    float godrayAngle = atan(parallaxUv.y, parallaxUv.x);
    float godrayWave = max(0.0, sin(godrayAngle * 7.0 + u_time * 0.0035));
    float godrayDistance = exp(-length(parallaxUv) * (1.6 - parallaxWarp * 0.7));
    float godray = godrayWave * godrayDistance * focusFalloff;
    toneMapped += vec3(0.34, 0.42, 0.64) * godray * clamp(u_godrayIntensity, 0.0, 2.0);

    float frameBlend = clamp(u_frameBlend, 0.0, 1.3);
    float streak = sin(u_time * 0.005 + radiusSq * 90.0) * 0.5 + 0.5;
    vec3 motionTint = mix(vec3(0.9, 0.74, 1.08), vec3(1.22, 0.88, 0.74), clamp(u_lightTemperature, 0.0, 1.3));
    toneMapped = mix(
        toneMapped,
        toneMapped * mix(vec3(1.0), motionTint, clamp(streak, 0.0, 1.0)),
        clamp(frameBlend * 0.34, 0.0, 0.85)
    );

    float colorBleed = clamp(u_colorBleed, 0.0, 1.8);
    vec3 bleedColor = vec3(
        toneMapped.r + toneMapped.g * 0.15,
        toneMapped.g + toneMapped.b * 0.15,
        toneMapped.b + toneMapped.r * 0.15
    );
    toneMapped = mix(toneMapped, bleedColor, clamp(colorBleed * 0.35, 0.0, 0.6));

    float filmGrain = clamp(u_filmGrain, 0.0, 1.8);
    float grain = fract(sin(dot(parallaxUv * 130.0, vec2(21.9898, 53.233))) * 43758.5453 + u_time * 0.006);
    grain = (grain - 0.5) * 2.0;
    toneMapped += grain * filmGrain * 0.06;
    toneMapped = clamp(toneMapped, 0.0, 5.0);

    gl_FragColor = vec4(toneMapped, clamp(0.75 + focusFalloff * 0.25, 0.0, 1.0));
}
`;

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

function hexToRgb(hex) {
    if (typeof hex !== 'string') {
        return null;
    }

    const normalized = hex.trim().replace('#', '');
    if (normalized.length !== 6 && normalized.length !== 3) {
        return null;
    }

    const expanded = normalized.length === 3
        ? normalized.split('').map((c) => c + c).join('')
        : normalized;

    const intVal = parseInt(expanded, 16);
    if (Number.isNaN(intVal)) {
        return null;
    }

    return [
        ((intVal >> 16) & 255) / 255,
        ((intVal >> 8) & 255) / 255,
        (intVal & 255) / 255
    ];
}

function normalizeColor(colorValue) {
    if (!colorValue) {
        return null;
    }

    if (Array.isArray(colorValue)) {
        if (colorValue.length >= 3) {
            return [
                Math.max(0, Math.min(1, colorValue[0])),
                Math.max(0, Math.min(1, colorValue[1])),
                Math.max(0, Math.min(1, colorValue[2]))
            ];
        }
        return null;
    }

    if (typeof colorValue === 'string') {
        return hexToRgb(colorValue);
    }

    if (typeof colorValue === 'object') {
        if (typeof colorValue.r === 'number' && typeof colorValue.g === 'number' && typeof colorValue.b === 'number') {
            const max = Object.prototype.hasOwnProperty.call(colorValue, 'max') ? colorValue.max : 255;
            const divisor = max === 1 ? 1 : 255;
            return [colorValue.r / divisor, colorValue.g / divisor, colorValue.b / divisor];
        }

        if (Array.isArray(colorValue.rgb) && colorValue.rgb.length >= 3) {
            return colorValue.rgb.slice(0, 3).map((c) => c / 255);
        }

        if (typeof colorValue.h === 'number' && typeof colorValue.s === 'number' && typeof colorValue.l === 'number') {
            const h = colorValue.h % 360 / 360;
            const s = Math.max(0, Math.min(1, colorValue.s));
            const l = Math.max(0, Math.min(1, colorValue.l));

            if (s === 0) {
                return [l, l, l];
            }

            const hueToRgb = (p, q, t) => {
                let tn = t;
                if (tn < 0) tn += 1;
                if (tn > 1) tn -= 1;
                if (tn < 1 / 6) return p + (q - p) * 6 * tn;
                if (tn < 1 / 2) return q;
                if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            return [
                hueToRgb(p, q, h + 1 / 3),
                hueToRgb(p, q, h),
                hueToRgb(p, q, h - 1 / 3)
            ];
        }
    }

    return null;
}

export class PolychoraVisualizer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.options = options;

        this.gl = null;
        this.program = null;
        this.quadBuffer = null;
        this.attributeLocations = {};
        this.uniformLocations = {};

        this.startTime = null;
        this.lastPointerUpdate = 0;

        this.pointer = { x: 0.5, y: 0.5, intensity: 0 };

        this.cameraLighting = {
            orbit: 0,
            elevation: 0.3,
            dolly: -0.3,
            roll: 0,
            exposure: 1.4,
            shutter: 0.55,
            bloom: 0.45,
            keyLight: 0.7,
            rimLight: 0.55,
            ambientLight: 0.2,
            vignette: 0.35,
            parallax: 0.0,
            focus: 0.75,
            focusSpread: 0.6,
            chromaticAberration: 0.14,
            lightTemperature: 0.52,
            shadowContrast: 0.48,
            fogDensity: 0.16,
            godrayIntensity: 0.3,
            filmGrain: 0.24,
            lensDistortion: 0.08,
            frameBlend: 0.3,
            lightWrap: 0.4,
            colorBleed: 0.34
        };

        this.parameterState = {
            latticeDensity: 14.5,
            latticeWarp: 0.2,
            glowStrength: 1.25,
            lineThickness: 0.35,
            dimension: 3.8
        };

        this.rotation = {
            xw: 0,
            yw: 0,
            zw: 0,
            xy: 0,
            xz: 0,
            yz: 0
        };

        this.colorState = {
            primary: DEFAULT_PRIMARY.slice(),
            secondary: DEFAULT_SECONDARY.slice(),
            accent: DEFAULT_ACCENT.slice(),
            shadow: DEFAULT_SHADOW.slice(),
            paletteKey: 'default'
        };

        this.audioTarget = {
            bass: 0,
            mid: 0,
            high: 0,
            energy: 0,
            onset: 0,
            swing: 0,
            chaos: 0,
            motion: 0,
            beatPhase: 0,
            measurePhase: 0,
            accent: 0,
            ribbon: 0.5,
            saturationPulse: 0.6,
            orbit: 0,
            accentLuma: 0.2,
            downbeat: 0,
            dimension: 0,
            intensityExponent: 1.0
        };

        this.audioSmooth = { ...this.audioTarget };
    }

    async initialize() {
        if (!this.canvas) {
            throw new Error('PolychoraVisualizer requires a canvas element');
        }

        const contextOptions = {
            alpha: true,
            depth: false,
            stencil: false,
            antialias: false,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance'
        };

        const gl = this.canvas.getContext('webgl2', contextOptions) ||
                   this.canvas.getContext('webgl', contextOptions);

        if (!gl) {
            throw new Error('WebGL not supported for Polychora visualizer');
        }

        this.gl = gl;

        this.program = this.createProgram(
            VERTEX_SHADER_SOURCE,
            FRAGMENT_SHADER_SOURCE
        );

        this.attributeLocations.position = gl.getAttribLocation(this.program, 'a_position');
        this.uniformLocations = {
            resolution: gl.getUniformLocation(this.program, 'u_resolution'),
            time: gl.getUniformLocation(this.program, 'u_time'),
            colorPrimary: gl.getUniformLocation(this.program, 'u_colorPrimary'),
            colorSecondary: gl.getUniformLocation(this.program, 'u_colorSecondary'),
            colorAccent: gl.getUniformLocation(this.program, 'u_colorAccent'),
            colorShadow: gl.getUniformLocation(this.program, 'u_colorShadow'),
            audioLevels: gl.getUniformLocation(this.program, 'u_audioLevels'),
            audioDynamics: gl.getUniformLocation(this.program, 'u_audioDynamics'),
            audioRhythm: gl.getUniformLocation(this.program, 'u_audioRhythm'),
            colorDynamics: gl.getUniformLocation(this.program, 'u_colorDynamics'),
            dimensionLift: gl.getUniformLocation(this.program, 'u_dimensionLift'),
            latticeDensity: gl.getUniformLocation(this.program, 'u_latticeDensity'),
            latticeWarp: gl.getUniformLocation(this.program, 'u_latticeWarp'),
            glowStrength: gl.getUniformLocation(this.program, 'u_glowStrength'),
            lineThickness: gl.getUniformLocation(this.program, 'u_lineThickness'),
            pointer: gl.getUniformLocation(this.program, 'u_pointer'),
            rotPrimary: gl.getUniformLocation(this.program, 'u_rotPrimary'),
            rotSecondary: gl.getUniformLocation(this.program, 'u_rotSecondary'),
            cameraOrbit: gl.getUniformLocation(this.program, 'u_cameraOrbit'),
            cameraElevation: gl.getUniformLocation(this.program, 'u_cameraElevation'),
            cameraDolly: gl.getUniformLocation(this.program, 'u_cameraDolly'),
            cameraRoll: gl.getUniformLocation(this.program, 'u_cameraRoll'),
            exposure: gl.getUniformLocation(this.program, 'u_exposure'),
            shutter: gl.getUniformLocation(this.program, 'u_shutter'),
            bloom: gl.getUniformLocation(this.program, 'u_bloom'),
            keyLight: gl.getUniformLocation(this.program, 'u_keyLight'),
            rimLight: gl.getUniformLocation(this.program, 'u_rimLight'),
            ambientLight: gl.getUniformLocation(this.program, 'u_ambientLight'),
            vignette: gl.getUniformLocation(this.program, 'u_vignette'),
            cameraParallax: gl.getUniformLocation(this.program, 'u_cameraParallax'),
            focusDistance: gl.getUniformLocation(this.program, 'u_focusDistance'),
            focusSpread: gl.getUniformLocation(this.program, 'u_focusSpread'),
            chromaticAberration: gl.getUniformLocation(this.program, 'u_chromaticAberration'),
            lightTemperature: gl.getUniformLocation(this.program, 'u_lightTemperature'),
            shadowContrast: gl.getUniformLocation(this.program, 'u_shadowContrast'),
            fogDensity: gl.getUniformLocation(this.program, 'u_fogDensity'),
            godrayIntensity: gl.getUniformLocation(this.program, 'u_godrayIntensity'),
            filmGrain: gl.getUniformLocation(this.program, 'u_filmGrain'),
            lensDistortion: gl.getUniformLocation(this.program, 'u_lensDistortion'),
            frameBlend: gl.getUniformLocation(this.program, 'u_frameBlend'),
            lightWrap: gl.getUniformLocation(this.program, 'u_lightWrap'),
            colorBleed: gl.getUniformLocation(this.program, 'u_colorBleed')
        };

        this.quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                -1, -1,
                 1, -1,
                -1,  1,
                 1,  1
            ]),
            gl.STATIC_DRAW
        );

        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        this.startTime = performance.now();
    }

    createProgram(vertexSource, fragmentSource) {
        const gl = this.gl;
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            gl.deleteProgram(program);
            throw new Error(`Failed to link Polychora shader program: ${info}`);
        }

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        return program;
    }

    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`Failed to compile Polychora shader: ${info}`);
        }

        return shader;
    }

    handleResize(width, height) {
        if (!this.gl) return;
        this.gl.viewport(0, 0, width, height);
    }

    setParameters(params = {}) {
        if (typeof params.latticeDensity === 'number') {
            this.parameterState.latticeDensity = params.latticeDensity;
        } else if (typeof params.gridDensity === 'number') {
            this.parameterState.latticeDensity = params.gridDensity;
        }

        if (typeof params.latticeWarp === 'number') {
            this.parameterState.latticeWarp = params.latticeWarp;
        } else if (typeof params.morphFactor === 'number') {
            this.parameterState.latticeWarp = params.morphFactor * 0.6;
        }

        if (typeof params.glowStrength === 'number') {
            this.parameterState.glowStrength = params.glowStrength;
        } else if (typeof params.intensity === 'number') {
            this.parameterState.glowStrength = 0.9 + params.intensity * 0.8;
        }

        if (typeof params.lineThickness === 'number') {
            this.parameterState.lineThickness = params.lineThickness;
        } else if (typeof params.edgeThickness === 'number') {
            this.parameterState.lineThickness = params.edgeThickness;
        }

        if (typeof params.dimension === 'number') {
            this.parameterState.dimension = params.dimension;
        }
    }

    updateParameter(name, value) {
        this.setParameters({ [name]: value });
    }

    setColor(color) {
        if (!color) return;

        const primary = normalizeColor(color.primary || color.base || color.main || color);
        const secondary = normalizeColor(color.secondary || color.alt || color.complementary);
        const accent = normalizeColor(color.accent || color.highlight || color.emphasis);
        const shadow = normalizeColor(color.shadow || color.shadowTone || color.depth || color.dark);

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

        if (color.paletteKey) {
            this.colorState.paletteKey = color.paletteKey;
        }

        if (!secondary && primary) {
            this.colorState.secondary = [
                Math.min(1, primary[0] * 0.8 + 0.1),
                Math.min(1, primary[1] * 0.6 + 0.25),
                Math.min(1, primary[2] * 0.9 + 0.05)
            ];
        }

        if (!accent) {
            const base = this.colorState.primary;
            this.colorState.accent = [
                Math.min(1, base[0] * 0.6 + 0.4),
                Math.min(1, base[1] * 0.8 + 0.2),
                Math.min(1, base[2] * 0.5 + 0.5)
            ];
        }

        if (!shadow) {
            const base = this.colorState.secondary;
            this.colorState.shadow = [
                Math.max(0, base[0] * 0.35),
                Math.max(0, base[1] * 0.32),
                Math.max(0, base[2] * 0.4)
            ];
        }
    }

    setMousePosition(x, y) {
        this.pointer.x = x;
        this.pointer.y = y;
        this.pointer.intensity = 1;
        this.lastPointerUpdate = performance.now();
    }

    setPointer(x, y) {
        this.setMousePosition(x, y);
    }

    triggerClick() {
        this.pointer.intensity = 1.5;
    }

    updateClickIntensity(deltaTime) {
        const decay = deltaTime ? Math.exp(-deltaTime * 4.2) : 0.92;
        this.pointer.intensity *= decay;
    }

    setAudioChoreography(audioData = {}) {
        const bands = audioData.bands || {};
        const details = audioData.bandDetails || {};

        const readBand = (name) => {
            if (typeof bands[name] === 'number') return bands[name];
            if (typeof bands[name]?.value === 'number') return bands[name].value;
            if (typeof details[name]?.value === 'number') return details[name].value;
            return 0;
        };

        const bass = Math.max(readBand('bass'), readBand('subBass') * 0.85);
        const mid = 0.6 * readBand('mid') + 0.4 * readBand('lowMid');
        const high = 0.5 * readBand('high') + 0.35 * readBand('highMid') + 0.15 * readBand('air');

        const rhythm = audioData.rhythmPhases || {};
        const dynamics = audioData.extremeDynamics || {};
        const colorMeta = audioData.colorChoreography || {};
        const onsetEvent = audioData.onsetEvent || {};

        const target = {
            bass,
            mid,
            high,
            energy: audioData.rms || 0,
            onset: typeof audioData.onset === 'number' ? audioData.onset : (onsetEvent.strength || 0),
            swing: dynamics.swingEnergy || 0,
            chaos: dynamics.chaosSurge || 0,
            motion: dynamics.motionVelocity || 0,
            beatPhase: rhythm.beatPhase || 0,
            measurePhase: rhythm.measurePhase || 0,
            accent: rhythm.accentPulse || 0,
            ribbon: colorMeta.ribbon ?? 0.5,
            saturationPulse: colorMeta.saturationPulse ?? 0.6,
            orbit: colorMeta.orbit ?? 0,
            accentLuma: colorMeta.accentLuma ?? 0.2,
            downbeat: colorMeta.downbeatColor ?? 0,
            dimension: dynamics.dimensionLift || 0,
            intensityExponent: dynamics.intensityExponent || 1.0
        };

        Object.assign(this.audioTarget, target);
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

    set4DRotation(rotation = {}) {
        this.rotation = {
            xw: rotation.xw ?? this.rotation.xw,
            yw: rotation.yw ?? this.rotation.yw,
            zw: rotation.zw ?? this.rotation.zw,
            xy: rotation.xy ?? this.rotation.xy,
            xz: rotation.xz ?? this.rotation.xz,
            yz: rotation.yz ?? this.rotation.yz
        };
    }

    getTime() {
        if (!this.startTime) return 0;
        return (performance.now() - this.startTime) / 1000;
    }

    render() {
        if (!this.gl || !this.program) {
            return;
        }

        const gl = this.gl;
        gl.useProgram(this.program);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.enableVertexAttribArray(this.attributeLocations.position);
        gl.vertexAttribPointer(this.attributeLocations.position, 2, gl.FLOAT, false, 0, 0);

        const now = performance.now();
        const elapsed = ((now - this.startTime) || 0) / 1000;

        // Audio smoothing
        const smoothing = 0.78;
        Object.keys(this.audioTarget).forEach((key) => {
            const target = this.audioTarget[key];
            const current = this.audioSmooth[key] ?? 0;
            this.audioSmooth[key] = current + (target - current) * (1 - smoothing);
        });

        const pointerCooldown = Math.max(0, (now - this.lastPointerUpdate) / 1000);
        if (pointerCooldown > 0.05) {
            this.pointer.intensity *= 0.94;
        }

        const width = this.canvas.width;
        const height = this.canvas.height;
        gl.viewport(0, 0, width, height);

        gl.uniform2f(this.uniformLocations.resolution, width, height);
        gl.uniform1f(this.uniformLocations.time, elapsed);

        const p = this.colorState.primary;
        const s = this.colorState.secondary;
        const a = this.colorState.accent;
        const sh = this.colorState.shadow;

        gl.uniform3f(this.uniformLocations.colorPrimary, p[0], p[1], p[2]);
        gl.uniform3f(this.uniformLocations.colorSecondary, s[0], s[1], s[2]);
        gl.uniform3f(this.uniformLocations.colorAccent, a[0], a[1], a[2]);
        gl.uniform3f(this.uniformLocations.colorShadow, sh[0], sh[1], sh[2]);

        gl.uniform4f(
            this.uniformLocations.audioLevels,
            this.audioSmooth.bass,
            this.audioSmooth.mid,
            this.audioSmooth.high,
            this.audioSmooth.energy
        );

        gl.uniform4f(
            this.uniformLocations.audioDynamics,
            this.audioSmooth.onset,
            this.audioSmooth.swing,
            this.audioSmooth.chaos,
            this.audioSmooth.motion
        );

        gl.uniform4f(
            this.uniformLocations.audioRhythm,
            this.audioSmooth.beatPhase,
            this.audioSmooth.measurePhase,
            this.audioSmooth.accent,
            this.audioSmooth.ribbon
        );

        gl.uniform4f(
            this.uniformLocations.colorDynamics,
            this.audioSmooth.saturationPulse,
            this.audioSmooth.orbit,
            this.audioSmooth.accentLuma,
            this.audioSmooth.downbeat
        );

        const dimensionLift = this.parameterState.dimension + this.audioSmooth.dimension * 0.9;
        gl.uniform1f(this.uniformLocations.dimensionLift, dimensionLift);
        gl.uniform1f(this.uniformLocations.latticeDensity, this.parameterState.latticeDensity);
        gl.uniform1f(this.uniformLocations.latticeWarp, this.parameterState.latticeWarp);

        const glow = this.parameterState.glowStrength * (0.85 + this.audioSmooth.intensityExponent * 0.35);
        gl.uniform1f(this.uniformLocations.glowStrength, glow);

        const dynamicLine = this.parameterState.lineThickness * (0.75 + this.audioSmooth.energy * 0.4 + this.audioSmooth.onset * 0.25);
        gl.uniform1f(this.uniformLocations.lineThickness, dynamicLine);

        const pointerX = this.pointer.x;
        const pointerY = this.pointer.y;
        gl.uniform2f(this.uniformLocations.pointer, pointerX, pointerY);

        gl.uniform3f(
            this.uniformLocations.rotPrimary,
            this.rotation.xw,
            this.rotation.yw,
            this.rotation.zw
        );
        gl.uniform3f(
            this.uniformLocations.rotSecondary,
            this.rotation.xy,
            this.rotation.xz,
            this.rotation.yz
        );

        const camera = this.cameraLighting || {};
        gl.uniform1f(this.uniformLocations.cameraOrbit, camera.orbit || 0);
        gl.uniform1f(this.uniformLocations.cameraElevation, camera.elevation || 0);
        gl.uniform1f(this.uniformLocations.cameraDolly, camera.dolly || 0);
        gl.uniform1f(this.uniformLocations.cameraRoll, camera.roll || 0);
        gl.uniform1f(this.uniformLocations.exposure, Math.max(0.1, camera.exposure || 0));
        gl.uniform1f(this.uniformLocations.shutter, Math.max(0.2, camera.shutter || 0.5));
        gl.uniform1f(this.uniformLocations.bloom, Math.max(0, camera.bloom || 0));
        gl.uniform1f(this.uniformLocations.keyLight, Math.max(0, camera.keyLight || 0));
        gl.uniform1f(this.uniformLocations.rimLight, Math.max(0, camera.rimLight || 0));
        gl.uniform1f(this.uniformLocations.ambientLight, Math.max(0, camera.ambientLight || 0));
        gl.uniform1f(this.uniformLocations.vignette, Math.max(0, camera.vignette || 0));
        gl.uniform1f(this.uniformLocations.cameraParallax, camera.parallax || 0);
        gl.uniform1f(this.uniformLocations.focusDistance, Math.max(0, camera.focus || 0));
        gl.uniform1f(this.uniformLocations.focusSpread, Math.max(0.01, camera.focusSpread || 0));
        gl.uniform1f(this.uniformLocations.chromaticAberration, Math.max(0, camera.chromaticAberration || 0));
        gl.uniform1f(this.uniformLocations.lightTemperature, Math.max(0, camera.lightTemperature || 0));
        gl.uniform1f(this.uniformLocations.shadowContrast, Math.max(0, camera.shadowContrast || 0));
        gl.uniform1f(this.uniformLocations.fogDensity, Math.max(0, camera.fogDensity || 0));
        gl.uniform1f(this.uniformLocations.godrayIntensity, Math.max(0, camera.godrayIntensity || 0));
        gl.uniform1f(this.uniformLocations.filmGrain, Math.max(0, camera.filmGrain || 0));
        gl.uniform1f(this.uniformLocations.lensDistortion, camera.lensDistortion || 0);
        gl.uniform1f(this.uniformLocations.frameBlend, Math.max(0, camera.frameBlend || 0));
        gl.uniform1f(this.uniformLocations.lightWrap, Math.max(0, camera.lightWrap || 0));
        gl.uniform1f(this.uniformLocations.colorBleed, Math.max(0, camera.colorBleed || 0));

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}
