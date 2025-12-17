import {
  calibrateAudioFrame,
  computeSignalHealth,
  parseBehaviorPromptResponse,
} from '../src/visualizers/shared/BehaviorSweepEngine.js';

describe('BehaviorSweepEngine helpers', () => {
  test('calibrateAudioFrame applies gain and gating with metadata', () => {
    const frame = { bands: { bass: 0.1, mid: { value: 0.5 }, air: 0.02 }, rms: 0.2 };
    const calibrated = calibrateAudioFrame(frame, { gain: 2, gate: 0.15, floor: 0.1 });

    expect(calibrated.bands.bass.value).toBeCloseTo(0.2);
    expect(calibrated.bands.mid.value).toBeCloseTo(1.0);
    expect(calibrated.bands.air.value).toBeCloseTo(0);
    expect(calibrated.rms).toBeCloseTo(0.4);
    expect(calibrated.peak).toBeCloseTo(1.0);
    expect(calibrated.gateActive).toBe(false);
  });

  test('computeSignalHealth surfaces coverage and clipping state', () => {
    const calibrated = {
      bands: { bass: { value: 0.2 }, mid: { value: 1.0 } },
      rms: 0.4,
      peak: 1.0,
    };

    const health = computeSignalHealth(calibrated, { silenceFloor: 0.05, clipThreshold: 0.95 });

    expect(health.coverage).toBeCloseTo(1);
    expect(health.isSilent).toBe(false);
    expect(health.isClipping).toBe(true);
    expect(health.suggestedGain).toBeCloseTo(1);
  });

  test('parseBehaviorPromptResponse reads presets, intensity, and controls with warnings', () => {
    const parsed = parseBehaviorPromptResponse(
      'Preset: Hyper\nIntensity: 2.5\nAtmosphere: on amount 1.5\nLight: off amount 0\nUnknown: value',
    );

    expect(parsed.preset).toBe('hyper');
    expect(parsed.intensity).toBeCloseTo(2.5);
    expect(parsed.controls.atmosphere.enabled).toBe(true);
    expect(parsed.controls.atmosphere.amount).toBeCloseTo(1.5);
    expect(parsed.controls.light.enabled).toBe(false);
    expect(parsed.controls.light.amount).toBeCloseTo(0);
    expect(parsed.warnings.some((w) => w.includes('Ignored line'))).toBe(true);
  });

  test('parseBehaviorPromptResponse defaults intensity and warns when missing', () => {
    const parsed = parseBehaviorPromptResponse('Preset: mellow');

    expect(parsed.preset).toBe('mellow');
    expect(parsed.intensity).toBeCloseTo(1);
    expect(parsed.defaultedIntensity).toBe(true);
    expect(parsed.warnings.some((w) => w.includes('defaulting to 1'))).toBe(true);
  });
});
