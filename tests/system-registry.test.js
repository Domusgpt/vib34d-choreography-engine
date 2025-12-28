/** @jest-environment jsdom */
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { SystemRegistry } from '../src/visualizers/shared/SystemRegistry.js';

describe('SystemRegistry canvas management', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="wrap"><canvas id="mainCanvas" data-test="1"></canvas></div>';
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.useRealTimers();
  });

  it('replaces the canvas and waits for the requested delay', async () => {
    const registry = new SystemRegistry();
    const originalCanvas = document.getElementById('mainCanvas');

    jest.useFakeTimers();

    const resetPromise = registry.resetCanvas('mainCanvas', 30);

    // Promise should not resolve before the delay has elapsed
    let resolved = false;
    resetPromise.then(() => {
      resolved = true;
    });

    jest.advanceTimersByTime(10);
    await Promise.resolve();
    expect(resolved).toBe(false);

    jest.advanceTimersByTime(30);
    const replacement = await resetPromise;

    expect(replacement).not.toBeNull();
    expect(replacement).not.toBe(originalCanvas);
    expect(replacement.id).toBe('mainCanvas');
    expect(document.getElementById('mainCanvas')).toBe(replacement);
    expect(replacement.dataset.test).toBe('1');
    expect(resolved).toBe(true);
  });
});
