import { devLog } from './utils';

/**
 * WhatsApp Cloud API (Meta).
 * Env: WHATSAPP_TOKEN, WHATSAPP_PHONE_ID
 * Optional: WHATSAPP_ADMIN_NUMBER (E.164, for OigaGIG alerts)
 */
export function getWhatsAppConfig(): { token: string; phoneId: string; adminNumber?: string } | null {
  const token = process.env.WHATSAPP_TOKEN?.trim();
  const phoneId = process.env.WHATSAPP_PHONE_ID?.trim();
  if (!token || !phoneId) return null;
  return { token, phoneId, adminNumber: process.env.WHATSAPP_ADMIN_NUMBER?.trim() || undefined };
}

/** Normalize a Colombian or international number to E.164 digits (no +). */
export function normalizeWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith('3')) digits = '57' + digits; // Colombia mobile
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

export async function sendWhatsApp(to: string, body: string): Promise<boolean> {
  const cfg = getWhatsAppConfig();
  const number = normalizeWhatsAppNumber(to);
  if (!cfg || !number) return false;

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${cfg.phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: number,
        type: 'text',
        text: { body },
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      devLog('[whatsapp] send failed', res.status, err);
      return false;
    }
    return true;
  } catch (e) {
    devLog('[whatsapp] error', e);
    return false;
  }
}

export async function sendAdminWhatsApp(body: string): Promise<boolean> {
  const cfg = getWhatsAppConfig();
  if (!cfg?.adminNumber) return false;
  return sendWhatsApp(cfg.adminNumber, body);
}
