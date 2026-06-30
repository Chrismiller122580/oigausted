import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { notifications } from '@/lib/notifications'
import { logAuditEvent } from '@/lib/audit'
import { checkRateLimit, getRequestIp, RATE_LIMITS } from '@/lib/rate-limit'
import { verifyTurnstileToken } from '@/lib/turnstile'

export async function POST(request: NextRequest) {
  try {
    const { email, turnstileToken } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const ip = getRequestIp(request.headers)

    const turnstile = await verifyTurnstileToken(turnstileToken, ip)
    if (!turnstile.ok) {
      return NextResponse.json({ error: turnstile.error }, { status: 400 })
    }

    const rateLimit = await checkRateLimit({
      action: 'PASSWORD_RESET_ATTEMPT',
      ip,
      maxAttempts: RATE_LIMITS.passwordResetPerIp.max,
      windowMs: RATE_LIMITS.passwordResetPerIp.windowMs,
    })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many reset requests. Please try again in ${rateLimit.retryAfter} seconds.`,
        },
        { status: 429 }
      )
    }

    await logAuditEvent({
      performedById: null,
      action: 'PASSWORD_RESET_ATTEMPT',
      targetType: 'User',
      details: { email: String(email).toLowerCase() },
      ipAddress: ip,
    }).catch(() => {})

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return success to avoid email enumeration
    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Invalidate previous tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    })

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    })

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com'}/reset-password?token=${token}`

    // Send real password reset email (now uses rich passwordResetEmail template + full tracking/resendEmailId)
    await notifications.sendEmail(
      user.id,
      'Restablece tu contraseña en OigaGIG',
      `Recibimos una solicitud para restablecer tu contraseña. El enlace expira en 1 hora.`,
      resetLink,
      { resetLink }
    )

    return NextResponse.json({ 
      success: true,
      message: "If an account exists, password reset instructions have been sent to your email."
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
