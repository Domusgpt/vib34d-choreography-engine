# 🚀 Deployment Information

## GitHub Pages automation

GitHub Pages is deployed directly from this repository by `.github/workflows/pages.yml`. The workflow
runs on every push to `main`, on pull requests targeting `main`, and on manual dispatch so the live
site and preview environments always match the branch being reviewed.

**Key capabilities**

- ✅ **Branch-aware previews** – pull requests receive temporary preview URLs so reviewers can audit
  choreography, macros, and shader changes without cloning the branch.
- ✅ **Root deployment** – successful builds publish to
  `https://domusgpt.github.io/vib34d-choreography-engine/` with the repository root (including
  `/examples`) intact, guaranteeing that the Demo Atlas and every HTML entry point behave exactly as
  they do during local development.
- ✅ **Automated verification** – the workflow installs dependencies with `npm ci`, executes the Jest
  suite, builds via Vite for regression coverage, and then stages the static artifact that GitHub Pages
  serves.

The root `index.html` continues to redirect visitors to the Demo Atlas at `/examples/INDEX.html`.

## Triggering a deployment

1. Push to `main`, open a pull request into `main`, or run the workflow manually from **Actions →
   Deploy static site to GitHub Pages**.
2. Wait for the workflow to finish. The summary will include either the permanent production URL (for
   pushes) or a temporary preview URL (for pull requests).
3. Open the Demo Atlas and spot-check key canvases such as `final-ultimate.html`,
   `properly-reactive.html`, and diagnostic harnesses to confirm audio reactivity and visuals are
   rendering.

## Fallback manual publish

If GitHub Actions is unavailable (for example, in a fork), you can still deploy manually by pushing the
static assets to a `gh-pages` branch and selecting it as the Pages source:

```bash
git checkout -b gh-pages
rm -rf node_modules .gitignore
git add .
git commit -m "Publish site"
git push origin gh-pages --force
```

Then choose **Settings → Pages → Source → GitHub Actions** (recommended) or **Branch → gh-pages / root**.

## Local smoke testing

```bash
git clone https://github.com/Domusgpt/vib34d-choreography-engine.git
cd vib34d-choreography-engine

# Match the workflow checks
npm ci
npm run test
npm run build

# Serve the repository to mirror Pages
npx http-server .
# Open http://localhost:8080/examples/INDEX.html
```

## Live production URL

- **Primary root**: https://domusgpt.github.io/vib34d-choreography-engine/
- **Demo Atlas**: https://domusgpt.github.io/vib34d-choreography-engine/examples/INDEX.html

Each HTML entry point under `/examples` remains reachable at the same relative path once the workflow
completes.
