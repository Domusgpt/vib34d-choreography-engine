import { describe, expect, it } from '@jest/globals';
import { ChoreographyEngine } from '../src/core/ChoreographyEngine.js';

describe('ChoreographyEngine.evaluateTrigger', () => {
  it('evaluates safe arithmetic/boolean expressions', () => {
    const engine = new ChoreographyEngine();
    const audioData = { bands: { bass: 0.75, mid: 0.2, high: 0.1 }, rms: 0.5, onset: 0.3 };

    const result = engine.evaluateTrigger('bass > 0.5 && onset > 0.2', audioData);

    expect(result).toBe(true);
  });

  it('rejects expressions with unsafe characters', () => {
    const engine = new ChoreographyEngine();
    const audioData = { bands: { bass: 0.9 } };

    const result = engine.evaluateTrigger('bass > 0.2 && window.alert(1)', audioData);

    expect(result).toBe(false);
  });

  it('fails gracefully on malformed expressions', () => {
    const engine = new ChoreographyEngine();
    const audioData = { bands: { bass: 0.4 } };

    const result = engine.evaluateTrigger('bass >', audioData);

    expect(result).toBe(false);
  });
});
