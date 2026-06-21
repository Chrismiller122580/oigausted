import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

function hasPlaywrightChromium() {
  const cacheDir = join(homedir(), '.cache', 'ms-playwright');
  if (!existsSync(cacheDir)) return false;

  return readdirSync(cacheDir).some((entry) => {
    if (!entry.startsWith('chromium-')) return false;
    const chromeLinux = join(cacheDir, entry, 'chrome-linux', 'chrome');
    const chromeLinux64 = join(cacheDir, entry, 'chrome-linux64', 'chrome');
    const chromeMac = join(cacheDir, entry, 'chrome-mac', 'Chromium.app');
    return existsSync(chromeLinux) || existsSync(chromeLinux64) || existsSync(chromeMac);
  });
}

function shouldInstallPlaywright() {
  if (process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === '1') return false;
  if (process.env.VERCEL === '1') return false;
  if (process.env.AWS_LAMBDA_FUNCTION_VERSION) return false;
  return true;
}

async function main() {
  if (!shouldInstallPlaywright()) return;

  if (hasPlaywrightChromium()) {
    console.log('✅ Playwright Chromium already installed');
    return;
  }

  try {
    console.log('🎭 Installing Playwright Chromium for UserLens local scans…');
    execSync('npx playwright install chromium', {
      stdio: 'inherit',
      env: {
        ...process.env,
        PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '0',
      },
    });
    console.log('✅ Playwright Chromium ready');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('⚠️  Playwright Chromium install failed:', message);
    console.log('   UserLens scans need: npx playwright install chromium');
    process.exit(0);
  }
}

main();