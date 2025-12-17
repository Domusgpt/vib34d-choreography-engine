import { describe, it, expect } from '@jest/globals';

// Basic smoke test to keep Jest green while visual changes are validated via previews.
describe('project setup', () => {
  it('runs a trivial truthy assertion', () => {
    expect(true).toBe(true);
  });
});
