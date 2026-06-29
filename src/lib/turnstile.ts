const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export function isTurnstileConfigured(): boolean {
  return !!(
    process.env.TURNSTILE_SECRET_KEY?.trim() &&
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
  )
}

export function getTurnstileSiteKey(): string | null {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
  return key || null
}

/** Verify Cloudflare Turnstile token. Skips when not configured (local dev). */
export async function verifyTurnstileToken(
  token: string | undefined | null,
  remoteIp?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isTurnstileConfigured()) {
    return { ok: true }
  }

  if (!token?.trim()) {
    return { ok: false, error: 'Completa la verificación anti-bot' }
  }

  const secret = process.env.TURNSTILE_SECRET_KEY!.trim()
  const body = new URLSearchParams({
    secret,
    response: token.trim(),
    ...(remoteIp && remoteIp !== 'unknown' ? { remoteip: remoteIp } : {}),
  })

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] }
    if (data.success) {
      return { ok: true }
    }
    return { ok: false, error: 'Verificación anti-bot fallida. Intenta de nuevo.' }
  } catch {
    return { ok: false, error: 'No se pudo verificar anti-bot. Intenta de nuevo.' }
  }
}