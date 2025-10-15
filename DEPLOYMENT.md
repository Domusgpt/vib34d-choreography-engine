# 🚀 Deployment Guide

## GitHub Pages Ready by Default

The repository root now renders the full Demo Atlas (`index.html`) so publishing any branch to GitHub Pages automatically exposes the latest catalog of experiences. All demo links are relative and resolve correctly whether the site is served from the repository root or the `examples/` directory.

- **Primary entry point:** `https://<username>.github.io/vib34d-choreography-engine/`
- **Atlas twin:** `https://<username>.github.io/vib34d-choreography-engine/examples/INDEX.html`
- **Audio verification harness:** `https://<username>.github.io/vib34d-choreography-engine/examples/properly-reactive.html`

## Quick Publish Checklist

1. Push the branch you want to showcase to GitHub.
2. Open **Settings → Pages** for the repository.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select your branch (or `main`) and the **`/ (root)`** folder, then click **Save**.
5. GitHub Pages will build and publish `index.html`, which mirrors the Demo Atlas that already lives at `examples/INDEX.html`.
6. Visit the live URL after the deployment completes (usually <60 seconds) to confirm the atlas, quick index, and curated cards load with audio-reactive demos.

> ℹ️ Because the atlas is data-driven, adding or removing demos only requires editing `examples/assets/demo-atlas-data.js`. Both `index.html` and `examples/INDEX.html` consume the same dataset, so the live site and local previews always stay in sync.

## Verifying the Deployment

- **Audio Reactivity:** Launch `properly-reactive.html` from the atlas to confirm the looping groove starts, the analyzer emits seven-band data, and onset markers register in real time.
- **Visualizer Coverage:** Use the quick index filters to open `final-ultimate.html`, `ultimate-controls.html`, or any other flagship experience. The canvases cover the full viewport and respond to audio, gesture macros, and the shared camera system.
- **Legacy & Diagnostics:** The atlas groups mobile, diagnostic, and archival demos so regression checks remain one click away.

## Local Smoke Test Before Publishing

```bash
npm install
npm run build
npm run test
npx http-server # or npx serve / python3 -m http.server
# open http://localhost:8080/
```

Running the build and test scripts locally catches linting and bundling issues before GitHub Pages attempts to serve the branch.

## Existing Live Deployment

- **GitHub Pages URL:** https://domusgpt.github.io/vib34d-choreography-engine/
- **Repository:** https://github.com/Domusgpt/vib34d-choreography-engine
- **Status:** 🟢 LIVE – serves the Demo Atlas with audio-reactive showcases, macro harnesses, and documentation links.

---

**A Paul Phillips Manifestation**  
Send Love, Hate, or Opportunity: Paul@clearseassolutions.com  
Join The Exoditical Moral Architecture Movement: Parserator.com

© 2025 Paul Phillips - Clear Seas Solutions LLC
