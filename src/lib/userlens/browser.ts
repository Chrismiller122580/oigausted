import '@/lib/userlens/server-only';
import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import fs from 'fs';
import path from 'path';
import type { Browser } from 'playwright-core';

export const USERLENS_DEBUG_PORT = 9222;

const LOCAL_CHROMIUM_ARGS = [
  `--remote-debugging-port=${USERLENS_DEBUG_PORT}`,
  '--no-sandbox',
];

const SPARTICUZ_CHROMIUM_VERSION = '149.0.0';

const CHROMIUM_PACK_FALLBACK_URLS = [
  'https://oigagig.com/chromium-pack.tar',
  `https://github.com/Sparticuz/chromium/releases/download/v${SPARTICUZ_CHROMIUM_VERSION}/chromium-v${SPARTICUZ_CHROMIUM_VERSION}-pack.x64.tar`,
];

let cachedExecutablePath: string | null = null;
let executablePathPromise: Promise<string> | null = null;

function isServerlessRuntime(): boolean {
  return process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_VERSION;
}

function getServerlessBinCandidates(): string[] {
  const cwd = process.cwd();
  return [
    path.join(cwd, 'node_modules/@sparticuz/chromium/bin'),
    path.join(cwd, 'node_modules/@sparticuz/chromium-min/bin'),
    '/var/task/node_modules/@sparticuz/chromium/bin',
    '/var/task/node_modules/@sparticuz/chromium-min/bin',
  ];
}

function resolveChromiumPackUrls(): string[] {
  const urls: string[] = [];

  if (process.env.CHROMIUM_PACK_URL?.trim()) {
    urls.push(process.env.CHROMIUM_PACK_URL.trim());
  }

  const hosts = [
    process.env.VERCEL_URL?.trim(),
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim(),
    process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '').replace(/\/$/, ''),
  ].filter(Boolean);

  for (const host of hosts) {
    urls.push(`https://${host}/chromium-pack.tar`);
  }

  urls.push(...CHROMIUM_PACK_FALLBACK_URLS);
  return [...new Set(urls)];
}

async function resolveServerlessExecutablePath(): Promise<string> {
  if (cachedExecutablePath) return cachedExecutablePath;
  if (executablePathPromise) return executablePathPromise;

  executablePathPromise = (async () => {
    const chromiumMin = (await import('@sparticuz/chromium-min')).default;
    chromiumMin.setGraphicsMode = false;

    for (const binPath of getServerlessBinCandidates()) {
      if (!fs.existsSync(binPath)) continue;
      try {
        cachedExecutablePath = await chromiumMin.executablePath(binPath);
        return cachedExecutablePath;
      } catch {
        // try next candidate
      }
    }

    const packUrls = resolveChromiumPackUrls();
    let lastError: unknown;
    for (const packUrl of packUrls) {
      try {
        cachedExecutablePath = await chromiumMin.executablePath(packUrl);
        return cachedExecutablePath;
      } catch (err) {
        lastError = err;
      }
    }

    executablePathPromise = null;
    const message = lastError instanceof Error ? lastError.message : String(lastError ?? 'unknown');
    throw new Error(
      `Failed to load Chromium (tried ${packUrls.join(', ')}). Ensure build runs node scripts/chromium-pack.mjs or set CHROMIUM_PACK_URL. ${message}`,
    );
  })();

  return executablePathPromise;
}

function attachUserDataCleanup(browser: Browser, userDataDir: string): Browser {
  const originalClose = browser.close.bind(browser);
  browser.close = async () => {
    await originalClose();
    await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
  };
  return browser;
}

/** Launch Chromium for UserLens — bundled bin or chromium-pack.tar on Vercel, local Playwright elsewhere. */
export async function launchUserLensBrowser(): Promise<Browser> {
  const { chromium } = await import('playwright-core');

  if (isServerlessRuntime()) {
    const chromiumMin = (await import('@sparticuz/chromium-min')).default;
    const executablePath = await resolveServerlessExecutablePath();
    const userDataDir = `/tmp/pw-${randomUUID()}`;

    const browser = await chromium.launch({
      args: [
        ...chromiumMin.args,
        `--remote-debugging-port=${USERLENS_DEBUG_PORT}`,
        '--disable-dev-shm-usage',
        `--user-data-dir=${userDataDir}`,
      ],
      executablePath,
      headless: true,
    });

    return attachUserDataCleanup(browser, userDataDir);
  }

  let primaryError: unknown;
  try {
    return await chromium.launch({
      headless: true,
      args: LOCAL_CHROMIUM_ARGS,
    });
  } catch (err) {
    primaryError = err;
  }

  try {
    const { chromium: bundledChromium } = await import('playwright');
    return await bundledChromium.launch({
      headless: true,
      args: LOCAL_CHROMIUM_ARGS,
    });
  } catch (fallbackErr) {
    const primary =
      primaryError instanceof Error ? primaryError.message : String(primaryError ?? 'unknown');
    const fallback =
      fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
    throw new Error(
      `Playwright browsers are not installed (${primary}; fallback: ${fallback}). Run: npx playwright install chromium`,
    );
  }
}