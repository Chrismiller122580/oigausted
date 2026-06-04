import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import bcrypt from 'bcryptjs'
import { notifications } from '@/lib/notifications'
import { logAuditEvent } from '@/lib/audit'

// Simple in-memory rate limiter (replace with Upstash/Redis in production)
const signupAttempts = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string, email: string): { allowed: boolean; retryAfter?: number } {
  const key = `${ip}:${email}`
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxAttempts = 5

  const attempt = signupAttempts.get(key)

  if (!attempt || now > attempt.resetTime) {
    signupAttempts.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true }
  }

  if (attempt.count >= maxAttempts) {
    const retryAfter = Math.ceil((attempt.resetTime - now) / 1000)
    return { allowed: false, retryAfter }
  }

  attempt.count++
  return { allowed: true }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role = 'buyer', referralCode } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Faltan campos requeridos (nombre, email, contraseña)" }, { status: 400 })
    }

    // Basic password strength
    if (password.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 })
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimit = checkRateLimit(ip, email.toLowerCase())
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many signup attempts. Please try again in ${rateLimit.retryAfter} seconds.` },
        { status: 429 }
      )
    }

    // Prevent public admin creation (only allow buyer/seller via signup)
    const safeRole = role === 'admin' ? 'buyer' : role

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
      return NextResponse.json({ error: "Este correo ya está registrado" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role: safeRole,
        password: hashedPassword,
      }
    })

    // Audit log for system change (new user registration)
    await logAuditEvent({
      performedById: newUser.id,
      action: 'USER_REGISTERED',
      targetType: 'User',
      targetId: newUser.id,
      details: { email: newUser.email, role: safeRole, viaReferral: !!referralCode },
    });

    // Link referral if referralCode was provided
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referralCode.toUpperCase() }
      })
      if (referrer && referrer.id !== newUser.id) {
        await prisma.user.update({
          where: { id: newUser.id },
          data: { referredById: referrer.id }
        })
      }
    }

    // Send welcome email
    await notifications.sendEmail(
      newUser.id,
      '¡Bienvenido a OigaUsted!',
      `Hola ${name}, gracias por registrarte. Ya puedes explorar servicios o publicar los tuyos.`,
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com'}/gigs`
    )

    return NextResponse.json({ 
      success: true, 
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    })

  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
