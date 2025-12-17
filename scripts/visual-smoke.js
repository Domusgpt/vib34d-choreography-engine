import { chromium } from 'playwright';
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACT_DIR = path.resolve(__dirname, '../artifacts');
const ARTIFACT_PATH = path.join(ARTIFACT_DIR, 'visual-smoke.png');
const PREVIEW_PORT = 4173;
const PREVIEW_URL = `http://127.0.0.1:${PREVIEW_PORT}/examples/mobile-smart.html`;
const LAUNCH_ARGS = ['--no-sandbox', '--disable-dev-shm-usage'];

function logEnvironment() {
    const cwd = process.cwd();
    const nodeVersion = process.version;
    let chromiumPath = 'unknown (not yet installed)';

    try {
        chromiumPath = chromium.executablePath();
    } catch (err) {
        const msg = err?.message || String(err);
        chromiumPath = `unavailable until install (${msg})`;
    }

    console.log('[visual:smoke] working directory:', cwd);
    console.log('[visual:smoke] node version:', nodeVersion);
    console.log('[visual:smoke] playwright chromium path:', chromiumPath);
}

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer(url, timeout = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        try {
            const res = await fetch(url, { method: 'GET' });
            if (res.ok) return true;
        } catch (err) {
            // keep retrying
        }
        await wait(300);
    }
    throw new Error('Preview server did not come online in time');
}

function spawnDevServer() {
    return spawn('npm', ['run', 'dev', '--', '--host', '0.0.0.0', '--port', String(PREVIEW_PORT), '--strictPort'], {
        stdio: 'inherit',
        env: process.env,
    });
}

async function launchChromium() {
    const launchOptions = { headless: true, args: LAUNCH_ARGS };
    try {
        return await chromium.launch(launchOptions);
    } catch (err) {
        const message = String(err?.message || err);
        const missingBinary = message.includes("executable doesn't exist") || message.includes('chromium_headless_shell');
        const missingDeps = message.includes('You can run "playwright install"') || message.includes('libatk');

        console.warn('[visual:smoke] chromium launch failed:', message);

        if (!missingBinary && !missingDeps) {
            throw err;
        }

        console.warn('[visual:smoke] installing Playwright Chromium + deps for this environment…');
        try {
            execSync('npx playwright install --with-deps chromium', { stdio: 'inherit' });
        } catch (installErr) {
            console.warn('[visual:smoke] Playwright install encountered an error; rethrowing original launch error for visibility.');
            throw err;
        }

        console.log('[visual:smoke] retrying Chromium launch after install…');
        return await chromium.launch(launchOptions);
    }
}

async function run() {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

    logEnvironment();

    const preview = spawnDevServer();
    try {
        await waitForServer(PREVIEW_URL);

        const browser = await launchChromium();
        const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

        console.log('Navigating to preview…');
        await page.goto(PREVIEW_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForSelector('#visualizerCanvas, canvas', { timeout: 12000 }).catch(() => {});
        await page.waitForTimeout(1500);
        console.log('Page ready, triggering controls…');

        const visualButton = page.locator('#runVisualTest');
        if (await visualButton.count()) {
            await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
            await visualButton.scrollIntoViewIfNeeded().catch(() => {});
            await visualButton.click({ delay: 50, timeout: 4000, force: true }).catch(err => console.warn('Visual test trigger skipped:', err.message));
            await page.waitForTimeout(900);
        }

        const stackButton = page.locator('#logStackState');
        if (await stackButton.count()) {
            await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
            await stackButton.scrollIntoViewIfNeeded().catch(() => {});
            await stackButton.click({ timeout: 2500, force: true }).catch(err => console.warn('Stack log trigger skipped:', err.message));
        }

        console.log('Capturing screenshot…');
        await page.screenshot({ path: ARTIFACT_PATH, fullPage: true });
        await browser.close();
        console.log(`Saved visual smoke artifact to ${ARTIFACT_PATH}`);
    } finally {
        preview.kill('SIGTERM');
    }
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
