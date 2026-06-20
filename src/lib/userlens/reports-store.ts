import '@/lib/userlens/server-only';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { toPrismaJson } from '@/lib/utils';
import type {
  ComposerQueueFile,
  FixItemStatus,
  UserLensFixItemRecord,
  UserLensReportSummary,
  UserLensScanResult,
} from '@/types/userlens';
import { extractFixItemsFromScan } from '@/lib/userlens/extract-fix-items';

const DATA_DIR = path.join(process.cwd(), 'data', 'userlens');
const COMPOSER_QUEUE_PATH = path.join(DATA_DIR, 'composer-queue.json');
const REPORTS_INDEX_PATH = path.join(DATA_DIR, 'reports-index.jsonl');

const COMPOSER_INSTRUCTIONS =
  'Cursor/Composer: read fixQueue. Fix items with status "approved" first, then "pending" if asked. Set status to "fixed" in the admin toolbox after shipping. Do not auto-fix "rejected" or "deferred" items.';

function stripScreenshot(result: UserLensScanResult): UserLensScanResult {
  return { ...result, screenshotBase64: null };
}

function buildSummary(
  report: {
    id: string;
    url: string;
    finalUrl: string;
    viewport: string;
    scannedAt: Date;
    loadTimeMs: number;
    summary: unknown;
    _count?: { fixItems: number };
  },
): UserLensReportSummary {
  const summary = (report.summary ?? {}) as {
    lighthouseScores?: Record<string, number | null>;
    axeViolationCount?: number;
  };

  return {
    id: report.id,
    url: report.url,
    finalUrl: report.finalUrl,
    viewport: report.viewport as UserLensReportSummary['viewport'],
    scannedAt: report.scannedAt.toISOString(),
    loadTimeMs: report.loadTimeMs,
    lighthouseScores: summary.lighthouseScores ?? {},
    axeViolationCount: summary.axeViolationCount ?? 0,
    fixItemCount: report._count?.fixItems ?? 0,
  };
}

function mapFixItem(
  row: {
    id: string;
    reportId: string;
    source: string;
    category: string | null;
    auditId: string | null;
    severity: string | null;
    title: string;
    description: string;
    targets: unknown;
    status: string;
    reviewedById: string | null;
    reviewedAt: Date | null;
    reviewNotes: string | null;
    createdAt: Date;
    updatedAt: Date;
    report?: { url: string; finalUrl: string; scannedAt: Date };
  },
): UserLensFixItemRecord {
  const targets = Array.isArray(row.targets) ? (row.targets as string[]) : [];

  return {
    id: row.id,
    reportId: row.reportId,
    source: row.source as UserLensFixItemRecord['source'],
    category: row.category,
    auditId: row.auditId,
    severity: row.severity,
    title: row.title,
    description: row.description,
    targets,
    status: row.status as FixItemStatus,
    reviewedById: row.reviewedById,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    reviewNotes: row.reviewNotes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    reportUrl: row.report?.url,
    reportFinalUrl: row.report?.finalUrl,
    scannedAt: row.report?.scannedAt.toISOString(),
  };
}

function isPsiScanResult(result: UserLensScanResult): boolean {
  return result.warnings.some(
    (warning) =>
      warning.includes('PageSpeed Insights') || warning.includes('Cloud scan via Google'),
  );
}

export async function findCachedPsiScan(
  url: string,
  viewport: string,
  maxAgeHours: number,
): Promise<{ reportId: string; fixItemCount: number; result: UserLensScanResult } | null> {
  const since = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

  const report = await prisma.userLensReport.findFirst({
    where: {
      url,
      viewport,
      scannedAt: { gte: since },
    },
    orderBy: { scannedAt: 'desc' },
    include: { _count: { select: { fixItems: true } } },
  });

  if (!report) return null;

  const result = report.result as UserLensScanResult;
  if (!isPsiScanResult(result)) return null;

  return {
    reportId: report.id,
    fixItemCount: report._count.fixItems,
    result,
  };
}

export async function saveUserLensReport(
  result: UserLensScanResult,
  scannedById?: string,
): Promise<{ reportId: string; fixItemCount: number }> {
  const fixInputs = extractFixItemsFromScan(result);
  const lighthouseScores = Object.fromEntries(
    (result.lighthouse?.categories ?? []).map((c) => [c.id, c.score]),
  );

  const summary = {
    lighthouseScores,
    axeViolationCount: result.axe.violationCount,
    axeIncompleteCount: result.axe.incompleteCount,
    warnings: result.warnings,
  };

  const storedResult = stripScreenshot(result);

  const report = await prisma.userLensReport.create({
    data: {
      scannedById,
      url: result.url,
      scanUrl: result.scanUrl,
      finalUrl: result.finalUrl,
      title: result.title,
      viewport: result.viewport,
      scannedAt: new Date(result.scannedAt),
      loadTimeMs: result.loadTimeMs,
      summary: toPrismaJson(summary),
      result: toPrismaJson(storedResult),
      fixItems: {
        create: fixInputs.map((item) => ({
          source: item.source,
          category: item.category,
          auditId: item.auditId,
          severity: item.severity,
          title: item.title,
          description: item.description,
          targets: toPrismaJson(item.targets),
        })),
      },
    },
    include: { _count: { select: { fixItems: true } } },
  });

  await appendReportIndex(buildSummary(report));
  await syncComposerQueueFile();

  return { reportId: report.id, fixItemCount: fixInputs.length };
}

async function appendReportIndex(summary: UserLensReportSummary): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.appendFile(REPORTS_INDEX_PATH, `${JSON.stringify(summary)}\n`, 'utf8');
  } catch (err) {
    console.warn('UserLens: could not append reports-index.jsonl', err);
  }
}

export async function listFixQueueItems(options?: {
  status?: FixItemStatus;
  limit?: number;
}): Promise<UserLensFixItemRecord[]> {
  const rows = await prisma.userLensFixItem.findMany({
    where: options?.status ? { status: options.status } : undefined,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: options?.limit ?? 200,
    include: {
      report: { select: { url: true, finalUrl: true, scannedAt: true } },
    },
  });

  return rows.map(mapFixItem);
}

export async function updateFixItemStatus(
  id: string,
  status: FixItemStatus,
  reviewedById: string,
  reviewNotes?: string,
): Promise<UserLensFixItemRecord> {
  const row = await prisma.userLensFixItem.update({
    where: { id },
    data: {
      status,
      reviewedById,
      reviewedAt: new Date(),
      reviewNotes: reviewNotes?.trim() || null,
    },
    include: {
      report: { select: { url: true, finalUrl: true, scannedAt: true } },
    },
  });

  await syncComposerQueueFile();
  return mapFixItem(row);
}

export async function buildComposerQueue(): Promise<ComposerQueueFile> {
  const [fixQueue, recentReports] = await Promise.all([
    listFixQueueItems({ limit: 500 }),
    prisma.userLensReport.findMany({
      orderBy: { scannedAt: 'desc' },
      take: 20,
      include: { _count: { select: { fixItems: true } } },
    }),
  ]);

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    instructions: COMPOSER_INSTRUCTIONS,
    fixQueue,
    recentReports: recentReports.map(buildSummary),
  };
}

export async function syncComposerQueueFile(): Promise<ComposerQueueFile> {
  const queue = await buildComposerQueue();

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(COMPOSER_QUEUE_PATH, `${JSON.stringify(queue, null, 2)}\n`, 'utf8');
  } catch (err) {
    console.warn('UserLens: could not write composer-queue.json', err);
  }

  return queue;
}

export function getComposerQueuePath(): string {
  return COMPOSER_QUEUE_PATH;
}