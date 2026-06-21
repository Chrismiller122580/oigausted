import '@/lib/userlens/server-only';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
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

type SparticuzChromium = {
  setGraphicsMode: boolean;
  args: string[];
  executablePath: (location?: string) => Promise<string>;
};

let cachedExecutablePath: string | null = null;
let cachedSparticuzArgs: string[] | null = null;
let executablePathPromise: Promise<string> | null = null;

function isServerlessRuntime(): boolean {
  return process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_VERSION;
}

/** Playwright 1.60+ loads browsers.json via dynamic require; Vercel NFT often omits it. */
function ensurePlaywrightBrowsersJson(): void {
  if (!isServerlessRuntime()) return;

  const targets = [
    path.join(process.cwd(), 'node_modules/playwright-core/browsers.json'),
    '/var/task/node_modules/playwright-core/browsers.json',
  ];

  if (targets.some((target) => fs.existsSync(target))) return;

  try {
    const nodeRequire = createRequire(path.join(process.cwd(), 'package.json'));
    const pkgDir = path.dirname(nodeRequire.resolve('playwright-core/package.json'));
    const source = path.join(pkgDir, 'browsers.json');
    if (!fs.existsSync(source)) return;

    for (const target of targets) {
      try {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(source, target);
        console.log('[UserLens] Ensured browsers.json at', target);
        return;
      } catch {
        // try next target path
      }
    }
  } catch (err) {
    console.warn('[UserLens] Could not ensure browsers.json:', err);
  }
}

function getChromiumArchSuffix(): 'x64' | 'arm64' {
  return process.arch === 'arm64' ? 'arm64' : 'x64';
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
  const arch = getChromiumArchSuffix();
  const urls: string[] = [];

  if (process.env.CHROMIUM_PACK_URL?.trim()) {
    urls.push(process.env.CHROMIUM_PACK_URL.trim());
  }

  if (arch === 'x64') {
    const hosts = [
      process.env.VERCEL_URL?.trim(),
      process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim(),
      process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '').replace(/\/$/, ''),
    ].filter(Boolean);

    for (const host of hosts) {
      urls.push(`https://${host}/chromium-pack.tar`);
    }

    urls.push('https://oigagig.com/chromium-pack.tar');
  }

  urls.push(
    `https://github.com/Sparticuz/chromium/releases/download/v${SPARTICUZ_CHROMIUM_VERSION}/chromium-v${SPARTICUZ_CHROMIUM_VERSION}-pack.${arch}.tar`,
  );

  return [...new Set(urls)];
}

async function tryResolveExecutablePath(
  chromium: SparticuzChromium,
  location?: string,
): Promise<string | null> {
  try {
    return await chromium.executablePath(location);
  } catch (err) {
    const label = location ?? 'default';
    console.warn(`[UserLens] Chromium executablePath(${label}) failed:`, err);
    return null;
  }
}

async function resolveServerlessChromium(): Promise<{
  executablePath: string;
  args: string[];
}> {
  if (cachedExecutablePath && cachedSparticuzArgs) {
    return { executablePath: cachedExecutablePath, args: cachedSparticuzArgs };
  }

  if (!executablePathPromise) {
    executablePathPromise = (async () => {
      const arch = getChromiumArchSuffix();
      console.log('[UserLens] Resolving Chromium', {
        arch,
        cwd: process.cwd(),
        binCandidates: getServerlessBinCandidates().map((candidate) => ({
          path: candidate,
          exists: fs.existsSync(candidate),
        })),
      });

      if (arch === 'x64') {
        const chromium = (await import('@sparticuz/chromium')).default as SparticuzChromium;
        chromium.setGraphicsMode = false;

        let executablePath = await tryResolveExecutablePath(chromium);
        if (!executablePath) {
          for (const binPath of getServerlessBinCandidates()) {
            if (!fs.existsSync(binPath)) continue;
            executablePath = await tryResolveExecutablePath(chromium, binPath);
            if (executablePath) break;
          }
        }

        if (executablePath) {
          cachedSparticuzArgs = chromium.args;
          return executablePath;
        }
      }

      const chromiumMin = (await import('@sparticuz/chromium-min')).default as SparticuzChromium;
      chromiumMin.setGraphicsMode = false;

      if (arch === 'x64') {
        for (const binPath of getServerlessBinCandidates()) {
          if (!fs.existsSync(binPath)) continue;
          const executablePath = await tryResolveExecutablePath(chromiumMin, binPath);
          if (executablePath) {
            cachedSparticuzArgs = chromiumMin.args;
            return executablePath;
          }
        }
      }

      const packUrls = resolveChromiumPackUrls();
      let lastError: unknown;
      for (const packUrl of packUrls) {
        try {
          const executablePath = await chromiumMin.executablePath(packUrl);
          cachedSparticuzArgs = chromiumMin.args;
          return executablePath;
        } catch (err) {
          lastError = err;
          console.warn(`[UserLens] Chromium pack download failed (${packUrl}):`, err);
        }
      }

      executablePathPromise = null;
      const message = lastError instanceof Error ? lastError.message : String(lastError ?? 'unknown');
      throw new Error(
        `Failed to load Chromium (arch=${arch}, tried ${packUrls.join(', ')}). ${message}`,
      );
    })();
  }

  const executablePath = await executablePathPromise;
  if (!cachedSparticuzArgs) {
    const chromiumMin = (await import('@sparticuz/chromium-min')).default as SparticuzChromium;
    cachedSparticuzArgs = chromiumMin.args;
  }

  cachedExecutablePath = executablePath;
  return { executablePath, args: cachedSparticuzArgs };
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
  ensurePlaywrightBrowsersJson();
  const { chromium } = await import('playwright-core');

  if (isServerlessRuntime()) {
    const { executablePath, args } = await resolveServerlessChromium();
    const userDataDir = `/tmp/pw-${randomUUID()}`;

    try {
      const browser = await chromium.launch({
        args: [
          ...args,
          `--remote-debugging-port=${USERLENS_DEBUG_PORT}`,
          '--disable-dev-shm-usage',
          `--user-data-dir=${userDataDir}`,
        ],
        executablePath,
        headless: true,
        timeout: 30_000,
      });

      return attachUserDataCleanup(browser, userDataDir);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`browserType.launch: ${message} (executable: ${executablePath})`);
    }
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