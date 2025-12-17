import { mkdir } from 'fs/promises';
import { dirname } from 'path';

import { chromium } from 'playwright';
import { build, preview } from 'vite';

const host = process.env.PREVIEW_HOST || '127.0.0.1';
const port = Number(process.env.PREVIEW_PORT || 4173);
const url = process.env.PREVIEW_URL || `http://${host}:${port}/examples/behavior-preview.html`;
const outPath = process.env.PREVIEW_OUT || 'docs/assets/behavior-preview.png';

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
