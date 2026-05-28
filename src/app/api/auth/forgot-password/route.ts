import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { notifications } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

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

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.co.com'}/reset-password?token=${token}`

    // Send real password reset email
    await notifications.sendEmail(
      user.id,
      'Restablece tu contraseña en OigaUsted',
      `Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva:\n\n${resetLink}\n\nEste enlace expirará en 1 hora. Si no solicitaste esto, puedes ignorar este correo.`,
      resetLink
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
