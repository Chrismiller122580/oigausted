import { NextRequest, NextResponse } from 'next/server'
import { logAuditEvent } from '@/lib/audit'
import { checkRateLimit, getRequestIp, RATE_LIMITS } from '@/lib/rate-limit'
import { verifyTurnstileToken } from '@/lib/turnstile'

/** Gate credentials sign-in: rate limits + Turnstile before NextAuth authorize runs. */
export async function POST(request: NextRequest) {
  try {
    const { email, turnstileToken } = await request.json()
    const normalizedEmail = String(email || '').trim().toLowerCase()

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }

    const ip = getRequestIp(request.headers)

    const ipLimit = await checkRateLimit({
      action: ['LOGIN_ATTEMPT', 'LOGIN_FAILURE'],
      ip,
      maxAttempts: RATE_LIMITS.loginPerIp.max,
      windowMs: RATE_LIMITS.loginPerIp.windowMs,
    })
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: `Demasiados intentos de inicio de sesión. Espera ${ipLimit.retryAfter} segundos.`,
        },
        { status: 429 }
      )
    }

    const emailLimit = await checkRateLimit({
      action: ['LOGIN_ATTEMPT', 'LOGIN_FAILURE'],
      email: normalizedEmail,
      maxAttempts: RATE_LIMITS.loginPerEmail.max,
      windowMs: RATE_LIMITS.loginPerEmail.windowMs,
    })
    if (!emailLimit.allowed) {
      return NextResponse.json(
        {
          error: `Demasiados intentos para esta cuenta. Espera ${emailLimit.retryAfter} segundos.`,
        },
        { status: 429 }
      )
    }

    const turnstile = await verifyTurnstileToken(turnstileToken, ip)
    if (!turnstile.ok) {
      return NextResponse.json({ error: turnstile.error }, { status: 400 })
    }

    await logAuditEvent({
      performedById: null,
      action: 'LOGIN_ATTEMPT',
      targetType: 'User',
      details: { email: normalizedEmail },
      ipAddress: ip,
    }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error al validar inicio de sesión' }, { status: 500 })
  }
}