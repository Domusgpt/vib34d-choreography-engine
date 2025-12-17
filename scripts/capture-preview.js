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

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    console.log('Navigating to preview page', url);
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('Snapshot status', response?.status());
    await page.waitForTimeout(2000);
    await page.screenshot({ path: outPath, fullPage: false, timeout: 60000 });
    console.log(`Snapshot saved to ${outPath}`);
  } finally {
    await browser.close();
    await previewServer.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
