import '@/lib/userlens/server-only';
import fs from 'fs';
import path from 'path';
import type { Browser } from 'playwright-core';

export const USERLENS_DEBUG_PORT = 9222;

const LOCAL_CHROMIUM_ARGS = [
  `--remote-debugging-port=${USERLENS_DEBUG_PORT}`,
  '--no-sandbox',
];

let cachedExecutablePath: string | null = null;
let executablePathPromise: Promise<string> | null = null;

function isServerlessRuntime(): boolean {
  return process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_VERSION;
}

function resolveChromiumPackUrl(): string {
  if (process.env.CHROMIUM_PACK_URL?.trim()) {
    return process.env.CHROMIUM_PACK_URL.trim();
  }

  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '').replace(/\/$/, '') ||
    process.env.VERCEL_URL?.trim();

  if (host) {
    return `https://${host}/chromium-pack.tar`;
  }

  throw new Error(
    'Cannot resolve chromium-pack.tar URL. Set CHROMIUM_PACK_URL or deploy with public/chromium-pack.tar.',
  );
}

async function resolveServerlessExecutablePath(): Promise<string> {
  if (cachedExecutablePath) return cachedExecutablePath;
  if (executablePathPromise) return executablePathPromise;

  executablePathPromise = (async () => {
    const chromiumMin = (await import('@sparticuz/chromium-min')).default;
    chromiumMin.setGraphicsMode = false;

    const packUrl = resolveChromiumPackUrl();
    const binCandidates = [
      path.join(process.cwd(), 'node_modules/@sparticuz/chromium/bin'),
      path.join(process.cwd(), 'node_modules/@sparticuz/chromium-min/bin'),
    ];

    for (const binPath of binCandidates) {
      if (fs.existsSync(binPath)) {
        try {
          cachedExecutablePath = await chromiumMin.executablePath(binPath);
          return cachedExecutablePath;
        } catch {
          // try next candidate
        }
      }
    }

    try {
      cachedExecutablePath = await chromiumMin.executablePath(packUrl);
      return cachedExecutablePath;
    } catch (err) {
      executablePathPromise = null;
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Failed to load Chromium from ${packUrl}. Ensure postinstall created public/chromium-pack.tar. ${message}`,
      );
    }
  })();

  return executablePathPromise;
}

/** Launch Chromium for UserLens — chromium-pack.tar on Vercel, local Playwright elsewhere. */
export async function launchUserLensBrowser(): Promise<Browser> {
  const { chromium } = await import('playwright-core');

  if (isServerlessRuntime()) {
    const chromiumMin = (await import('@sparticuz/chromium-min')).default;
    const executablePath = await resolveServerlessExecutablePath();

    return chromium.launch({
      args: [...chromiumMin.args, `--remote-debugging-port=${USERLENS_DEBUG_PORT}`, '--disable-dev-shm-usage'],
      executablePath,
      headless: true,
    });
  }

  try {
    return await chromium.launch({
      headless: true,
      args: LOCAL_CHROMIUM_ARGS,
    });
  } catch {
    const { chromium: bundledChromium } = await import('playwright');
    return bundledChromium.launch({
      headless: true,
      args: LOCAL_CHROMIUM_ARGS,
    });
  }
}