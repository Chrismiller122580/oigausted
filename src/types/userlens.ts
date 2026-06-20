export type UserLensViewport = 'desktop' | 'mobile';

export type LighthouseCategory =
  | 'performance'
  | 'accessibility'
  | 'best-practices'
  | 'seo';

export interface UserLensScanRequest {
  url: string;
  viewport?: UserLensViewport;
  categories?: LighthouseCategory[];
}

export interface LighthouseCategoryScore {
  id: LighthouseCategory;
  title: string;
  score: number | null;
  failedAudits: Array<{
    id: string;
    title: string;
    description: string;
    displayValue?: string;
  }>;
}

export interface AxeViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical' | null;
  description: string;
  help: string;
  helpUrl: string;
  nodes: number;
  targets: string[];
}

export interface UserLensScanResult {
  /** URL submitted by the user (after validation). */
  url: string;
  /** URL Playwright navigated to; differs from `url` when Codespaces URLs are rewritten to localhost. */
  scanUrl?: string;
  finalUrl: string;
  title: string;
  viewport: UserLensViewport;
  scannedAt: string;
  loadTimeMs: number;
  screenshotBase64: string | null;
  lighthouse: {
    categories: LighthouseCategoryScore[];
    metrics: {
      firstContentfulPaint?: string;
      largestContentfulPaint?: string;
      totalBlockingTime?: string;
      cumulativeLayoutShift?: string;
      speedIndex?: string;
    };
  } | null;
  axe: {
    violationCount: number;
    incompleteCount: number;
    passes: number;
    violations: AxeViolation[];
  };
  warnings: string[];
}

export type FixItemStatus = 'pending' | 'approved' | 'rejected' | 'deferred' | 'fixed';

export type FixItemSource = 'axe' | 'lighthouse' | 'warning';

export interface UserLensFixItemRecord {
  id: string;
  reportId: string;
  source: FixItemSource;
  category?: string | null;
  auditId?: string | null;
  severity?: string | null;
  title: string;
  description: string;
  targets: string[];
  status: FixItemStatus;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  reportUrl?: string;
  reportFinalUrl?: string;
  scannedAt?: string;
}

export interface UserLensReportSummary {
  id: string;
  url: string;
  finalUrl: string;
  viewport: UserLensViewport;
  scannedAt: string;
  loadTimeMs: number;
  lighthouseScores: Record<string, number | null>;
  axeViolationCount: number;
  fixItemCount: number;
}

export interface ComposerQueueFile {
  version: 1;
  updatedAt: string;
  instructions: string;
  fixQueue: UserLensFixItemRecord[];
  recentReports: UserLensReportSummary[];
}