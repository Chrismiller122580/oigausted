import type { Prisma } from '@prisma/client';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';

function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

const BASE_REACHABLE: Prisma.UserWhereInput = {
  email: { not: null },
  isActive: true,
};

export type MarketingPlaybook = {
  id: string;
  label: string;
  description: string;
  roleFilter?: 'seller' | 'buyer';
  segment: string;
  buildWhere: () => Prisma.UserWhereInput;
  aiGoal: string;
  aiContext: string;
  defaultCta: string;
  defaultCtaUrl: string;
};

export const MARKETING_PLAYBOOKS: MarketingPlaybook[] = [
  {
    id: 'sellers-no-gigs',
    label: 'Vendedor sin gigs',
    description: 'Vendedores registrados que nunca publicaron un servicio',
    roleFilter: 'seller',
    segment: 'playbook:sellers-no-gigs',
    buildWhere: () => ({
      ...BASE_REACHABLE,
      role: 'seller',
      gigs: { none: { deletedAt: null } },
    }),
    aiGoal: 'Ayudar a vendedores a publicar su primer gig en OigaGIG',
    aiContext: `Audiencia: vendedores con cuenta activa pero CERO gigs publicados.
Problema: los compradores no pueden encontrarlos ni contratarlos.
El email debe: (1) diagnosticar ("notamos que aún no publicaste un servicio"), (2) explicar por qué importa, (3) dar 3 pasos concretos para publicar en menos de 5 minutos.
Pasos: ir a Crear gig → elegir categoría, título, precio y foto → publicar.
NO inventar descuentos ni promociones falsas.`,
    defaultCta: 'Publicar mi primer gig',
    defaultCtaUrl: `${APP_URL}/create-gig`,
  },
  {
    id: 'sellers-new-no-gig',
    label: 'Vendedor nuevo sin gig (3+ días)',
    description: 'Cuenta de vendedor con más de 3 días y aún sin publicar',
    roleFilter: 'seller',
    segment: 'playbook:sellers-new-no-gig',
    buildWhere: () => ({
      ...BASE_REACHABLE,
      role: 'seller',
      createdAt: { lte: subDays(new Date(), 3) },
      gigs: { none: { deletedAt: null } },
    }),
    aiGoal: 'Reactivar vendedores que se registraron hace días pero no publicaron su primer gig',
    aiContext: `Audiencia: vendedores con cuenta de al menos 3 días, sin ningún gig.
Tono: amable y de acompañamiento, como un mentor local.
Explicar que publicar es gratis, rápido, y que miles de compradores buscan servicios en su ciudad.
Incluir pasos numerados y ofrecer soporte si tienen dudas (support@oigagig.com).`,
    defaultCta: 'Crear mi primer servicio',
    defaultCtaUrl: `${APP_URL}/create-gig`,
  },
  {
    id: 'sellers-paused-gigs',
    label: 'Gigs pausados',
    description: 'Tienen servicios pero ninguno visible en el marketplace',
    roleFilter: 'seller',
    segment: 'playbook:sellers-paused-gigs',
    buildWhere: () => ({
      ...BASE_REACHABLE,
      role: 'seller',
      gigs: { some: { deletedAt: null } },
      NOT: {
        gigs: { some: { isActive: true, deletedAt: null } },
      },
    }),
    aiGoal: 'Motivar a vendedores a reactivar gigs pausados',
    aiContext: `Audiencia: vendedores con gigs creados pero TODOS están pausados (inactivos).
Problema: sus servicios no aparecen en búsquedas ni en el marketplace.
Pasos: entrar al panel de vendedor → Mis Servicios → activar el toggle de cada gig.
Explicar que sin activarlos pierden visibilidad y pedidos.`,
    defaultCta: 'Reactivar mis servicios',
    defaultCtaUrl: `${APP_URL}/seller`,
  },
  {
    id: 'buyers-no-orders',
    label: 'Comprador sin pedidos',
    description: 'Compradores que nunca han realizado un pedido',
    roleFilter: 'buyer',
    segment: 'playbook:buyers-no-orders',
    buildWhere: () => ({
      ...BASE_REACHABLE,
      role: 'buyer',
      ordersAsBuyer: { none: {} },
    }),
    aiGoal: 'Guiar a compradores nuevos a hacer su primer pedido en OigaGIG',
    aiContext: `Audiencia: compradores registrados que NUNCA han pedido un servicio.
Problema: quizás no saben cómo buscar, comparar o contratar.
Pasos: (1) explorar /gigs por categoría o ciudad, (2) elegir un servicio con reseñas, (3) hacer el pedido y pagar seguro con Wompi.
Mencionar categorías populares: plomería, electricidad, belleza, limpieza, mudanzas.
Tono educativo, no agresivo.`,
    defaultCta: 'Explorar servicios',
    defaultCtaUrl: `${APP_URL}/gigs`,
  },
  {
    id: 'buyers-no-active-orders',
    label: 'Comprador sin pedidos activos',
    description: 'Compradores activos sin pedidos en curso — oportunidad de re-contratar',
    roleFilter: 'buyer',
    segment: 'playbook:buyers-no-active-orders',
    buildWhere: () => ({
      ...BASE_REACHABLE,
      role: 'buyer',
      lastLoginAt: { gte: subDays(new Date(), 30) },
      NOT: {
        ordersAsBuyer: {
          some: { status: { in: ['Pending', 'Paid', 'In_Progress'] } },
        },
      },
    }),
    aiGoal: 'Invitar a compradores activos a contratar un nuevo servicio local',
    aiContext: `Audiencia: compradores que entraron en los últimos 30 días pero no tienen pedidos activos (pueden haber completado pedidos antes o nunca haber pedido).
Enfocarse en descubrir servicios útiles en su ciudad (usar {{city}} si aplica).
Sugerir buscar por categoría, filtrar por reseñas, y contactar al vendedor antes de pedir.`,
    defaultCta: 'Buscar servicios cerca',
    defaultCtaUrl: `${APP_URL}/gigs`,
  },
  {
    id: 'buyers-abandoned-checkout',
    label: 'Checkout abandonado',
    description: 'Iniciaron un pedido pero no completaron el pago',
    roleFilter: 'buyer',
    segment: 'playbook:buyers-abandoned-checkout',
    buildWhere: () => ({
      ...BASE_REACHABLE,
      role: 'buyer',
      ordersAsBuyer: { some: { status: 'Pending' } },
      NOT: {
        ordersAsBuyer: {
          some: { status: { in: ['Paid', 'In_Progress', 'Completed'] } },
        },
      },
    }),
    aiGoal: 'Recuperar compradores que abandonaron el pago de un pedido',
    aiContext: `Audiencia: compradores con al menos un pedido en estado Pending (sin pagar) y sin pedidos pagados o completados.
Problema: iniciaron la compra pero no terminaron el pago.
Explicar que su pedido puede estar esperando, que el pago es seguro con Wompi, y que pueden retomarlo desde Mis Pedidos.
NO presionar con urgencia falsa ni amenazas.`,
    defaultCta: 'Completar mi pedido',
    defaultCtaUrl: `${APP_URL}/buyer`,
  },
  {
    id: 'sellers-no-payout',
    label: 'Vendedor sin datos de pago',
    description: 'Tienen gigs activos pero no pueden recibir pagos',
    roleFilter: 'seller',
    segment: 'playbook:sellers-no-payout',
    buildWhere: () => ({
      ...BASE_REACHABLE,
      role: 'seller',
      gigs: { some: { isActive: true, deletedAt: null } },
      OR: [
        { payoutBankCode: null },
        { payoutAccountNumber: null },
      ],
    }),
    aiGoal: 'Ayudar a vendedores a configurar sus datos bancarios para recibir pagos',
    aiContext: `Audiencia: vendedores con gigs activos pero sin datos de pago completos (banco o número de cuenta).
Problema: no pueden recibir sus ganancias aunque vendan.
Pasos: ir a Configuración → Datos de pago → ingresar banco, tipo de cuenta y número.
Explicar que es necesario para cobrar pedidos completados.`,
    defaultCta: 'Configurar datos de pago',
    defaultCtaUrl: `${APP_URL}/settings`,
  },
  {
    id: 'buyers-pending-review',
    label: 'Reseña pendiente',
    description: 'Completaron un pedido pero no dejaron reseña',
    roleFilter: 'buyer',
    segment: 'playbook:buyers-pending-review',
    buildWhere: () => ({
      ...BASE_REACHABLE,
      role: 'buyer',
      ordersAsBuyer: {
        some: {
          status: 'Completed',
          reviews: { none: {} },
        },
      },
    }),
    aiGoal: 'Pedir amablemente a compradores que dejen una reseña tras un pedido completado',
    aiContext: `Audiencia: compradores con al menos un pedido completado sin reseña.
Explicar que las reseñas ayudan a otros compradores y a los vendedores locales a crecer.
Pasos: ir a Mis Pedidos → pedido completado → dejar calificación y comentario breve.
Tono de gratitud, no exigente.`,
    defaultCta: 'Dejar mi reseña',
    defaultCtaUrl: `${APP_URL}/buyer`,
  },
];

const PLAYBOOK_BY_ID = new Map(MARKETING_PLAYBOOKS.map((p) => [p.id, p]));
const PLAYBOOK_BY_SEGMENT = new Map(MARKETING_PLAYBOOKS.map((p) => [p.segment, p]));

export function playbookSegment(id: string): string {
  return `playbook:${id}`;
}

export function parsePlaybookId(segment: string): string | null {
  const seg = (segment || '').toLowerCase();
  if (!seg.startsWith('playbook:')) return null;
  return seg.replace('playbook:', '');
}

export function getPlaybookById(id: string): MarketingPlaybook | undefined {
  return PLAYBOOK_BY_ID.get(id);
}

export function getPlaybookBySegment(segment: string): MarketingPlaybook | undefined {
  return PLAYBOOK_BY_SEGMENT.get(segment.toLowerCase());
}

export function isPlaybookSegment(segment: string): boolean {
  return parsePlaybookId(segment) !== null;
}

export function buildPlaybookWhere(playbookId: string): Prisma.UserWhereInput | null {
  const playbook = getPlaybookById(playbookId);
  if (!playbook) return null;
  return playbook.buildWhere();
}

export function applyMergeFields(
  text: string,
  user: {
    name?: string | null;
    businessName?: string | null;
    city?: string | null;
  },
  opts?: { ctaUrl?: string },
): string {
  const displayName = user.name || user.businessName || 'Usuario';
  const ctaUrl = opts?.ctaUrl || `${APP_URL}/gigs`;
  return text
    .replace(/\{\{name\}\}/gi, displayName)
    .replace(/\{\{businessName\}\}/gi, user.businessName || user.name || 'Usuario')
    .replace(/\{\{city\}\}/gi, user.city || 'tu ciudad')
    .replace(/\{\{ctaUrl\}\}/gi, ctaUrl);
}

export function defaultPlaybookMessage(playbook: MarketingPlaybook): string {
  return `Hola {{name}},\n\n${playbook.description}.\n\n${playbook.aiContext.split('\n')[0]}\n\n👉 ${playbook.defaultCta}: {{ctaUrl}}\n\n— El equipo de OigaGIG`;
}