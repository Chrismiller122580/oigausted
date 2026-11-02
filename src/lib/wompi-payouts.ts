import { devLog } from './utils';

const PROD_BASE = 'https://api.payouts.wompi.co/v1';
const SANDBOX_BASE = 'https://api.sandbox.payouts.wompi.co/v1';

export interface WompiPayoutsConfig {
  apiKey: string;
  userPrincipalId: string;
  accountId: string;
  baseUrl: string;
}

export function getWompiPayoutsConfig(): WompiPayoutsConfig | null {
  const apiKey = process.env.WOMPI_PAYOUTS_API_KEY?.trim();
  const userPrincipalId = process.env.WOMPI_PAYOUTS_USER_ID?.trim();
  const accountId = process.env.WOMPI_PAYOUTS_ACCOUNT_ID?.trim();
  if (!apiKey || !userPrincipalId || !accountId) return null;
  const sandbox = process.env.WOMPI_PAYOUTS_SANDBOX === 'true';
  const baseUrl = process.env.WOMPI_PAYOUTS_BASE_URL?.trim() || (sandbox ? SANDBOX_BASE : PROD_BASE);
  return { apiKey, userPrincipalId, accountId, baseUrl };
}

function headers(cfg: WompiPayoutsConfig, idempotencyKey?: string): HeadersInit {
  const h: Record<string, string> = {
    'x-api-key': cfg.apiKey,
    'user-principal-id': cfg.userPrincipalId,
    'Content-Type': 'application/json',
  };
  if (idempotencyKey) h['idempotency-key'] = idempotencyKey;
  return h;
}

export interface WompiBank {
  id: string;
  name: string;
  code?: string;
}

let banksCache: { at: number; banks: WompiBank[] } | null = null;

export async function listWompiBanks(cfg: WompiPayoutsConfig): Promise<WompiBank[]> {
  if (banksCache && Date.now() - banksCache.at < 60 * 60 * 1000) return banksCache.banks;
  const res = await fetch(`${cfg.baseUrl}/banks`, { headers: headers(cfg) });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Wompi /banks failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  const banks: WompiBank[] = Array.isArray(data) ? data : (data.data || data.banks || []);
  banksCache = { at: Date.now(), banks };
  return banks;
}

export function matchBankId(banks: WompiBank[], code: string): string | null {
  const c = code.toUpperCase().trim();
  const aliases: Record<string, string[]> = {
    NEQUI: ['NEQUI'],
    BANCOLOMBIA: ['BANCOLOMBIA', 'BANCO DE COLOMBIA'],
    DAVIVIENDA: ['DAVIVIENDA'],
    BBVA: ['BBVA'],
    BOGOTA: ['BOGOTA', 'BOGOTÁ'],
  };
  const names = aliases[c] || [c];
  for (const b of banks) {
    const n = (b.name || '').toUpperCase();
    if (names.some((a) => n.includes(a))) return b.id;
  }
  return null;
}

export interface CreatePayoutInput {
  reference: string;
  amountCents: number;
  name: string;
  email: string;
  legalIdType: string;
  legalId: string;
  bankId: string;
  accountType: 'AHORROS' | 'CORRIENTE';
  accountNumber: string;
  personType?: 'NATURAL' | 'JURIDICA';
}

export async function createWompiPayout(
  cfg: WompiPayoutsConfig,
  input: CreatePayoutInput
): Promise<{ payoutId: string; reference: string; raw: unknown }> {
  const body = {
    reference: input.reference,
    accountId: cfg.accountId,
    paymentType: 'PROVIDERS',
    transactions: [
      {
        personType: input.personType || 'NATURAL',
        legalIdType: input.legalIdType,
        legalId: input.legalId,
        bankId: input.bankId,
        accountType: input.accountType,
        accountNumber: input.accountNumber,
        name: input.name,
        email: input.email,
        amount: input.amountCents,
        reference: input.reference,
      },
    ],
  };

  const res = await fetch(`${cfg.baseUrl}/payouts`, {
    method: 'POST',
    headers: headers(cfg, input.reference),
    body: JSON.stringify(body),
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    devLog('[wompi-payouts] create failed', res.status, raw);
    const msg = (raw as { message?: string; error?: string })?.message
      || (raw as { error?: string })?.error
      || `Wompi payout failed (${res.status})`;
    throw new Error(msg);
  }

  const payout = (raw as { data?: { id?: string; payout?: { id?: string } }; id?: string }).data
    || (raw as { id?: string });
  const payoutId = (payout as { id?: string })?.id
    || (payout as { payout?: { id?: string } })?.payout?.id
    || (raw as { id?: string })?.id
    || '';

  return { payoutId, reference: input.reference, raw };
}

export async function getWompiPayoutByReference(
  cfg: WompiPayoutsConfig,
  reference: string
): Promise<{ id: string; status: string; raw: unknown } | null> {
  const url = `${cfg.baseUrl}/payouts?reference=${encodeURIComponent(reference)}&limit=5`;
  const res = await fetch(url, { headers: headers(cfg) });
  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  const list = Array.isArray(data) ? data : (data.data || data.payouts || []);
  const match = list.find((p: { reference?: string }) => p.reference === reference) || list[0];
  if (!match) return null;
  return { id: match.id || '', status: String(match.status || '').toUpperCase(), raw: match };
}

export function isPayoutSuccess(status: string): boolean {
  return ['TOTAL_PAYMENT', 'APPROVED', 'PAID'].includes(status.toUpperCase());
}
