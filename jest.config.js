export default {
  // Default to jsdom so DOM-focused smoke tests (e.g., CanvasLayerManager) run
  // without needing per-file overrides. Tests that need Node semantics can set
  // `@jest-environment node` locally.
  testEnvironment: 'jsdom',
  transform: {},
};
