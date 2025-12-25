# Viewing and Capturing VIB34D Visuals

This guide explains how to see the current behavior preview locally, capture screenshots, and interpret the overlay controls that keep baselines as the source of truth.

## Prerequisites
- Node.js 18+
- npm
- One-time browser install for Playwright captures: `npm run setup-tools` (downloads Playwright browsers with system deps)
- Sanity check that Playwright binaries are present: `npm run verify-tools -- --auto-install` (auto-installs missing browsers)

If you see missing library errors while running Playwright, install headless dependencies (Ubuntu/Debian example):
```bash
sudo apt-get update && sudo apt-get install -y \
  libgtk-3-0 libgbm1 libasound2t64 libnss3 libxss1 libxkbcommon0 \
  libdrm2 libatk1.0-0 libatk-bridge2.0-0 libxcomposite1 libxrandr2 \
  libpangocairo-1.0-0 libpango-1.0-0 libcups2
```

## View the behavior preview
1. Install dependencies: `npm install`
2. Build the bundle: `npm run build`
3. Start the preview server (defaults to port 4173): `npm run preview -- --host --port 4173`
4. Open http://localhost:4173/examples/behavior-preview.html
   - Toggle systems (Quantum, Faceted, Holographic)
   - Inspect the overlay: baselines, reactive offsets, clamp warnings, driver mixes, and silence-floor gating

## Capture a screenshot
1. Ensure Playwright browsers are installed: `npm run setup-tools` (or pass `--install` to the capture helper)
2. Verify Playwright binaries exist: `npm run verify-tools -- --auto-install`
3. Run the capture helper: `npm run capture-preview`
4. The script builds the bundle, launches `vite preview`, drives the preview page, and saves a snapshot to `docs/assets/behavior-preview.png` (git-ignored)
5. Override defaults when needed (host/port/url/output) via flags:
   - `npm run capture-preview -- --host 0.0.0.0 --port 4174`
- `npm run capture-preview -- --out artifacts/behavior-preview.png`
- `npm run capture-preview -- --install` (runs `npx playwright install --with-deps` before capturing)
- `npm run capture-preview -- --fail-on-console --fail-on-request` (treat console warnings/errors or failed requests as fatal)

### GitHub Pages view
- Public URL (main branch): https://domusgpt.github.io/vib34d-choreography-engine/
- Builds use a base path derived from the repository name (e.g., `/vib34d-choreography-engine/`); for forks, swap that segment with your repo name in both the build command and the URL.
- Local GH-Pages-style preview:
  ```bash
  BASE_PATH=/$(basename $(pwd))/ npm run build -- --base=${BASE_PATH}
  npm run preview -- --host --port 4173
  # Open http://localhost:4173/examples/behavior-preview.html
  ```

## Troubleshooting
- **Port already in use**: Pass a different port to preview and capture scripts (e.g., `npm run preview -- --port 4174`); the capture script will respect `PREVIEW_PORT` env vars.
- **Black or blank output**: Verify the preview URL matches the port, and ensure the browser has WebGL enabled.
- **Missing warnings/overlays**: Check that reactivity is enabled in the tuning panel; when gating is off the overlay intentionally dims.

## Additional example pages
- http://localhost:4173/examples/INDEX.html (links to all demos)
- http://localhost:4173/examples/real-visualizers.html (legacy controls)
- http://localhost:4173/examples/debug-visualizer.html (debug overlays)

These pages use the same build output served by `vite preview` so you only need one server running.
