import { matchCityInText } from '@/lib/colombia-geo';
import { MARKETING_PLAYBOOKS } from '@/lib/marketing-playbooks';

const PLAYBOOK_SEGMENT_MAP = new Map(
  MARKETING_PLAYBOOKS.map((p) => [p.id.toLowerCase(), p.segment]),
);

const PLAYBOOK_LABEL_MAP = new Map(
  MARKETING_PLAYBOOKS.map((p) => [p.label.toLowerCase(), p.segment]),
);

export function mapRecommendedSegment(text: string): { segment: string; city?: string } {
  const lower = text.toLowerCase().trim();

  if (lower.startsWith('playbook:')) {
    return { segment: lower };
  }

  for (const [id, segment] of PLAYBOOK_SEGMENT_MAP) {
    if (lower.includes(id) || lower.includes(segment)) {
      const city = matchCityInText(text);
      return { segment, city: city?.slug };
    }
  }

  for (const [label, segment] of PLAYBOOK_LABEL_MAP) {
    if (lower.includes(label)) {
      const city = matchCityInText(text);
      return { segment, city: city?.slug };
    }
  }

  let segment = 'all';
  if (/\b(inactiv|dormant|churn)\w*/.test(lower)) segment = 'inactive';
  else if (/\b(comprador|buyer)\w*/.test(lower)) segment = 'buyers';
  else if (/\b(vendedor|seller|freelanc)\w*/.test(lower)) segment = 'sellers';
  else if (/\b(admin)\w*/.test(lower)) segment = 'admins';
  else if (/\b(activ|recient|engag)\w*/.test(lower)) segment = 'active';

  const cityMatch = matchCityInText(text);
  return { segment, city: cityMatch?.slug };
}