import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import { execSync } from 'child_process';

import { chromium } from 'playwright';
import { build, preview } from 'vite';

function readArg(flag, defaultValue) {
  const argIndex = process.argv.findIndex((entry) => entry === `--${flag}` || entry.startsWith(`--${flag}=`));
  if (argIndex === -1) return defaultValue;

  const entry = process.argv[argIndex];
  if (entry.includes('=')) {
    return entry.split('=')[1];
  }

  const next = process.argv[argIndex + 1];
  return next && !next.startsWith('--') ? next : defaultValue;
}

const host = readArg('host', process.env.PREVIEW_HOST || '127.0.0.1');
const port = Number(readArg('port', process.env.PREVIEW_PORT || 4173));
const url = readArg('url', process.env.PREVIEW_URL || `http://${host}:${port}/examples/behavior-preview.html`);
const outPath = readArg('out', process.env.PREVIEW_OUT || 'docs/assets/behavior-preview.png');
const installTools = process.argv.includes('--install');
const failOnConsole = process.argv.includes('--fail-on-console');
const failOnRequest = process.argv.includes('--fail-on-request');
const ignoreConsolePatterns = [
  /GroupMarkerNotSet/,
  /GL Driver Message .*GPU stall due to ReadPixels/,
  /Automatic fallback to software WebGL/, // headless WebGL warning is expected in CI
];

function shouldIgnoreConsole(entry) {
  return ignoreConsolePatterns.some((pattern) => pattern.test(entry));
}

async function installBrowsers() {
  console.log('Ensuring Playwright browsers are installed (--install flag detected)...');
  execSync('npx playwright install --with-deps', { stdio: 'inherit' });
}

async function startPreviewServer() {
  console.log(`Starting Vite preview on http://${host}:${port} ...`);
  const server = await preview({ preview: { host, port } });
  const { httpServer } = server;

  if (!httpServer.listening) {
    await new Promise((resolve, reject) => {
      httpServer.once('listening', resolve);
      httpServer.once('error', reject);
    });
  }

  return server;
}

async function main() {
  if (installTools) {
    await installBrowsers();
  }

  console.log('Building preview bundle...');
  await build();

  const previewServer = await startPreviewServer();
  const browser = await chromium.launch({ headless: true });

  try {
    await mkdir(dirname(outPath), { recursive: true });

    const consoleErrors = [];
    const requestErrors = [];

    const page = await browser.newPage();
    page.on('console', (msg) => {
      const entry = `[console:${msg.type()}] ${msg.text()}`;
      console.log(entry);
      if ((msg.type() === 'error' || msg.type() === 'warning') && !shouldIgnoreConsole(entry)) {
        consoleErrors.push(entry);
      }
    });

    page.on('pageerror', (err) => {
      const entry = `[pageerror] ${err.message}`;
      console.error(entry);
      consoleErrors.push(entry);
    });

    page.on('requestfailed', (req) => {
      const entry = `[requestfailed:${req.failure()?.errorText}] ${req.url()}`;
      console.warn(entry);
      requestErrors.push(entry);
    });

    page.on('response', (resp) => {
      if (resp.status() >= 400) {
        const entry = `[response:${resp.status()}] ${resp.url()}`;
        console.warn(entry);
        requestErrors.push(entry);
      }
    });

    await page.setViewportSize({ width: 1280, height: 720 });
    console.log('Navigating to preview page', url);
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('Snapshot status', response?.status());
    await page.waitForTimeout(2000);
    await page.screenshot({ path: outPath, fullPage: false, timeout: 60000 });
    console.log(`Snapshot saved to ${outPath}`);

    // Give deferred fetches a moment to fail before evaluating flags so late errors are caught.
    await page.waitForTimeout(500);

    if (consoleErrors.length) {
      console.warn(`Captured ${consoleErrors.length} console warnings/errors during snapshot.`);
    }

    if (failOnConsole && consoleErrors.length) {
      throw new Error(`Console emitted ${consoleErrors.length} warnings/errors during capture`);
    }

    if (requestErrors.length) {
      console.warn(`Captured ${requestErrors.length} failed/errored requests during snapshot.`);
    }

    if (failOnRequest && requestErrors.length) {
      throw new Error(`Encountered ${requestErrors.length} failed/errored requests during capture`);
    }
  } finally {
    await browser.close();
    await previewServer.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
