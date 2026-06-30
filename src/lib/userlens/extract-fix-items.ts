import type { FixItemSource, UserLensScanResult } from '@/types/userlens';

export interface NewFixItemInput {
  source: FixItemSource;
  category?: string;
  auditId?: string;
  severity?: string;
  title: string;
  description: string;
  targets: string[];
}

export function extractFixItemsFromScan(result: UserLensScanResult): NewFixItemInput[] {
  const items: NewFixItemInput[] = [];

  for (const violation of result.axe.violations) {
    items.push({
      source: 'axe',
      category: 'accessibility',
      auditId: violation.id,
      severity: violation.impact ?? 'moderate',
      title: violation.help || violation.id,
      description: violation.description,
      targets: violation.targets,
    });
  }

  if (result.lighthouse) {
    for (const cat of result.lighthouse.categories) {
      for (const audit of cat.failedAudits) {
        items.push({
          source: 'lighthouse',
          category: cat.id,
          auditId: audit.id,
          severity: cat.score != null && cat.score < 50 ? 'serious' : 'moderate',
          title: audit.title,
          description: audit.description,
          targets: audit.displayValue ? [audit.displayValue] : [],
        });
      }
    }
  }

  for (const warning of result.warnings) {
    if (/login|redirect|github\.com/i.test(warning)) continue;
    if (/Lighthouse scores via .+ on Vercel/i.test(warning)) continue;
    if (/^Tip: set PAGESPEED_INSIGHTS_API_KEY/i.test(warning)) continue;
    if (/quota exceeded — trying fallback/i.test(warning)) continue;
    items.push({
      source: 'warning',
      category: 'scan',
      severity: 'moderate',
      title: 'Scan warning',
      description: warning,
      targets: [],
    });
  }

  return items;
}