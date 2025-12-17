import { describe, expect, it } from '@jest/globals';
import { ParameterManager } from '../src/core/Parameters.js';

describe('ParameterManager', () => {
  it('sanitizes reactive profiles with safe limits and ordered bounds', () => {
    const pm = new ParameterManager();
    pm.registerParameters({ depth: { baseline: 2 } });

    pm.setProfiles({
      depth: {
        limit: -3,
        min: 5,
        max: 1,
        range: Number.NaN,
        mode: 'multiply',
        attack: -0.5,
        release: -1
      }
    });

    const profile = pm.getProfile('depth');

    expect(profile.limit).toBe(3);
    expect(profile.min).toBe(1);
    expect(profile.max).toBe(5);
    expect(profile.mode).toBe('multiply');
    expect(profile.attack).toBe(0);
    expect(profile.release).toBe(0);
    expect(profile.range).toBe(0);
  });

  it('clamps offsets to profile limits and reports limit hits', () => {
    const pm = new ParameterManager();
    pm.registerParameters({ hue: { baseline: 1 } });
    pm.setProfiles({ hue: { range: 2, limit: 0.3 } });

    const resolved = pm.resolve({ beatEnvelope: 1, onsetEnvelope: 0, audioLevel: 0 });

    expect(resolved.hue).toBeCloseTo(1.3, 5);
    const diagnostics = pm.getDiagnostics().parameters.hue;
    expect(diagnostics.flags.hitLimit).toBe(true);
    expect(diagnostics.offset).toBe(0.3);
  });

  it('resets offsets and disables reactivity when gating is off', () => {
    const pm = new ParameterManager();
    pm.registerParameters({ density: { baseline: 0.5 } });
    pm.setProfiles({ density: { range: 1, limit: 0.5 } });

    pm.resolve({ beatEnvelope: 1, onsetEnvelope: 0, audioLevel: 0 });
    expect(pm.getDiagnostics().parameters.density.offset).toBeGreaterThan(0);

    pm.setReactiveEnabled({ density: false });
    pm.resolve({ beatEnvelope: 1, onsetEnvelope: 1, audioLevel: 1 });

    const diagnostics = pm.getDiagnostics().parameters.density;
    expect(diagnostics.offset).toBe(0);
    expect(diagnostics.flags.reactiveDisabled).toBe(true);
    expect(diagnostics.resolved).toBeCloseTo(0.5, 5);
  });
});
