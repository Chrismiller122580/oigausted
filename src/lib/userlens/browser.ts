import '@/lib/userlens/server-only';
import type { Browser } from 'playwright-core';

export const USERLENS_DEBUG_PORT = 9222;

const SERVERLESS_CHROMIUM_ARGS = [
  `--remote-debugging-port=${USERLENS_DEBUG_PORT}`,
  '--disable-dev-shm-usage',
];

const LOCAL_CHROMIUM_ARGS = [
  `--remote-debugging-port=${USERLENS_DEBUG_PORT}`,
  '--no-sandbox',
];

function isServerlessRuntime(): boolean {
  return process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_VERSION;
}

/** Launch Chromium for UserLens — @sparticuz/chromium on Vercel, local Playwright elsewhere. */
export async function launchUserLensBrowser(): Promise<Browser> {
  const { chromium } = await import('playwright-core');

  if (isServerlessRuntime()) {
    const chromiumPack = (await import('@sparticuz/chromium')).default;
    chromiumPack.setGraphicsMode = false;

    const executablePath = await chromiumPack.executablePath();
    return chromium.launch({
      args: [...chromiumPack.args, ...SERVERLESS_CHROMIUM_ARGS],
      executablePath,
      headless: true,
    });
  }

  try {
    return await chromium.launch({
      headless: true,
      args: LOCAL_CHROMIUM_ARGS,
    });
  } catch (err) {
    const { chromium: bundledChromium } = await import('playwright');
    return bundledChromium.launch({
      headless: true,
      args: LOCAL_CHROMIUM_ARGS,
    });
  }
}