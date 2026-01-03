# Visualizer Capabilities & Operational Needs

This guide summarizes what the current visualizer stack can do right now and what it needs to run smoothly across local previews and GitHub Pages deployments.

## What the stack does today

- **Baseline-first parameter model** powered by the `ParameterManager`, with per-parameter baselines, optional reactive gating, driver-weight normalization, silence-floor resets, and limit-aware diagnostics so every visualizer returns to a known state when audio is silent.
- **Behavior-aware visualizers** (Quantum, Holographic, Faceted) that consume journey phases, palette bands, hue spans, volumetric density, camera drift, and beat/onset envelopes while honoring the baseline/reactive rules.
- **Single-canvas lifecycle** for the preview harness: visualizer swaps tear down listeners, clear contexts, and rebuild a fresh canvas after a short delay to avoid stacked WebGL layers or recycled uniforms.
- **Preview/QA harness** at `examples/behavior-preview.html` that exposes tuning sliders, reactive gating, driver-mix controls, and diagnostics chips for clamp/floor/gate states, plus optional Playwright snapshotting for offline review.
- **GitHub Pages–ready build** using multipage Vite output with an automatic base path derived from the repository name, a demo catalog redirect under `examples/`, and a CI workflow that builds and publishes on pushes to `main` or `work`.

## What it needs for best functionality

1. **WebGL 2.0 + GPU acceleration** enabled in the browser (mobile devices sometimes disable this—use the debug overlay to confirm context creation).
2. **Single active visualizer** at a time in the preview UI; let the harness reset the canvas between system switches (30 ms delay) to prevent layered contexts on resource-constrained devices.
3. **Fresh dependency setup**:
   ```bash
   npm install
   npm run verify-tools -- --auto-install   # fetch Playwright browsers if missing
   npm test -- --runInBand --verbose        # quick sanity suite for ParameterManager + system registry
   npm run build                            # multipage Vite build with repo-derived base path
   ```
4. **Optional screenshot capture** for validation or bug reports:
   ```bash
   npm run capture-preview -- --fail-on-console --fail-on-request --out artifacts/behavior-preview.png
   ```
   Use `--host/--port/--url` when previewing custom servers; console noise from headless WebGL is auto-filtered but actionable errors fail the run when `--fail-on-console` is set.
5. **Pages deployment checks**: confirm the repo name matches the expected base path and that Pages is set to **GitHub Actions**; the workflow in `.github/workflows/deploy-pages.yml` builds with the derived base and uploads the multipage site.
6. **Parameter tuning discipline**: keep baselines within the profile limits, enable/disable reactive gating per parameter as needed, and rely on the preview overlay’s limit markers and warning chips to spot clamp or floor hits before pushing to production.

## Quick triage tips

- If the debug overlay shows `No visualizer to test`, reload after verifying WebGL context creation; the harness won’t render unless a program compiles and passes validation.
- When captures fail, re-run `npm run verify-tools -- --auto-install` to ensure Playwright browsers are present and re-run with `--fail-on-request` to catch network/base-path errors.
- For forked deployments, set `BASE_PATH=/<your-repo-name>/` when running `npm run build` locally to mirror the Pages environment and avoid missing asset URLs.
