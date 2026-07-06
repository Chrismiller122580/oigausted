import { matchCityInText } from '@/lib/colombia-cities';

/** Client-safe playbook segment map (avoid importing marketing-playbooks on the client). */
const PLAYBOOK_SEGMENTS: Array<{ id: string; label: string; segment: string }> = [
  { id: 'buyers-new-signup', label: 'comprador nuevo', segment: 'playbook:buyers-new-signup' },
  { id: 'buyers-no-orders', label: 'comprador sin pedidos', segment: 'playbook:buyers-no-orders' },
  { id: 'buyers-abandoned-checkout', label: 'checkout abandonado', segment: 'playbook:buyers-abandoned-checkout' },
  { id: 'buyers-one-order-lapsed', label: 'comprador con 1 pedido inactivo', segment: 'playbook:buyers-one-order-lapsed' },
  { id: 'buyers-repeat-active', label: 'comprador repetidor activo', segment: 'playbook:buyers-repeat-active' },
  { id: 'buyers-no-active-orders', label: 'comprador sin pedidos activos', segment: 'playbook:buyers-no-active-orders' },
  { id: 'buyers-pending-review', label: 'reseña pendiente', segment: 'playbook:buyers-pending-review' },
  { id: 'sellers-no-gigs', label: 'vendedor sin gigs', segment: 'playbook:sellers-no-gigs' },
  { id: 'sellers-new-no-gig', label: 'vendedor nuevo sin gig', segment: 'playbook:sellers-new-no-gig' },
  { id: 'sellers-paused-gigs', label: 'gigs pausados', segment: 'playbook:sellers-paused-gigs' },
  { id: 'sellers-no-payout', label: 'vendedor sin datos de pago', segment: 'playbook:sellers-no-payout' },
];

const PLAYBOOK_SEGMENT_MAP = new Map(
  PLAYBOOK_SEGMENTS.map((p) => [p.id.toLowerCase(), p.segment]),
);

const PLAYBOOK_LABEL_MAP = new Map(
  PLAYBOOK_SEGMENTS.map((p) => [p.label.toLowerCase(), p.segment]),
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