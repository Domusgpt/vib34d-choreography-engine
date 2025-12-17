import { access } from 'fs/promises';
import { execSync } from 'child_process';
import { chromium, firefox, webkit } from 'playwright';
import playwrightPackage from 'playwright/package.json' with { type: 'json' };
import process from 'process';

const autoInstall = process.argv.includes('--auto-install');

async function ensureExecutable(label, browser) {
  const executable = browser.executablePath();
  try {
    await access(executable);
    console.log(`${label} executable OK: ${executable}`);
  } catch (err) {
    console.error(`${label} executable missing: ${executable}`);
    if (!autoInstall) {
      console.error('Run "npm install" followed by "npm run setup-tools" to install Playwright browsers, or re-run with --auto-install.');
    }
    throw err;
  }
}

async function main() {
  console.log(`Playwright package version: ${playwrightPackage.version}`);
  try {
    await Promise.all([
      ensureExecutable('Chromium', chromium),
      ensureExecutable('Firefox', firefox),
      ensureExecutable('WebKit', webkit),
    ]);
  } catch (initialError) {
    if (!autoInstall) {
      process.exit(1);
    }
    console.log('Missing browsers detected; running playwright install --with-deps ...');
    execSync('npx playwright install --with-deps', { stdio: 'inherit' });
    await Promise.all([
      ensureExecutable('Chromium', chromium),
      ensureExecutable('Firefox', firefox),
      ensureExecutable('WebKit', webkit),
    ]);
  }
  console.log('All Playwright browser binaries are available.');
  console.log('You can now run "npm test" or "npm run capture-preview" with confidence.');
}

main().catch((err) => {
  console.error('Tool verification failed:', err);
  process.exit(1);
});
