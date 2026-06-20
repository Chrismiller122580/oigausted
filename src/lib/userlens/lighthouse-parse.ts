import type { LighthouseCategory, LighthouseCategoryScore } from '@/types/userlens';

const CATEGORY_TITLES: Record<LighthouseCategory, string> = {
  performance: 'Performance',
  accessibility: 'Accessibility',
  'best-practices': 'Best Practices',
  seo: 'SEO',
};

export function extractLighthouseCategories(
  lhr: Record<string, unknown>,
  categories: LighthouseCategory[],
): LighthouseCategoryScore[] {
  const lhCategories = (lhr.categories ?? {}) as Record<
    string,
    { id: string; title: string; score: number | null }
  >;
  const audits = (lhr.audits ?? {}) as Record<
    string,
    {
      id: string;
      title: string;
      description: string;
      score: number | null;
      scoreDisplayMode?: string;
      displayValue?: string;
    }
  >;

  return categories.map((id) => {
    const cat = lhCategories[id] as
      | { title?: string; score?: number | null; auditRefs?: Array<{ id: string }> }
      | undefined;
    const auditIds = new Set((cat?.auditRefs ?? []).map((ref) => ref.id));
    const failedAudits = Object.values(audits)
      .filter((audit) => {
        if (!auditIds.has(audit.id) || audit.score == null) return false;
        if (audit.scoreDisplayMode === 'notApplicable' || audit.scoreDisplayMode === 'manual') {
          return false;
        }
        if (audit.scoreDisplayMode === 'binary') return audit.score === 0;
        return audit.score < 0.9;
      })
      .slice(0, 8)
      .map((audit) => ({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        displayValue: audit.displayValue,
      }));

    return {
      id,
      title: CATEGORY_TITLES[id] ?? cat?.title ?? id,
      score: cat?.score != null ? Math.round(cat.score * 100) : null,
      failedAudits,
    };
  });
}

export function extractLighthouseMetrics(lhr: Record<string, unknown>) {
  const audits = (lhr.audits ?? {}) as Record<string, { displayValue?: string }>;
  return {
    firstContentfulPaint: audits['first-contentful-paint']?.displayValue,
    largestContentfulPaint: audits['largest-contentful-paint']?.displayValue,
    totalBlockingTime: audits['total-blocking-time']?.displayValue,
    cumulativeLayoutShift: audits['cumulative-layout-shift']?.displayValue,
    speedIndex: audits['speed-index']?.displayValue,
  };
}