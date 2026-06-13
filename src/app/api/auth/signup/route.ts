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

    // Gate new signups via admin settings (public config)
    try {
      const cfgRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/config`);
      if (cfgRes.ok) {
        const cfg = await cfgRes.json();
        if (cfg.allowNewSignups === false) {
          return NextResponse.json({ error: "Los registros nuevos están deshabilitados temporalmente. Intenta más tarde o contacta soporte." }, { status: 403 });
        }
      }
    } catch (e) {
      // If config fetch fails we allow (fail open for UX) but log
      console.warn('Could not check allowNewSignups gate');
    }

    // Prevent public admin creation (only allow buyer/seller via signup)
    const safeRole = role === 'admin' ? 'buyer' : role

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
      return NextResponse.json({ error: "Este correo ya está registrado" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user + default notification prefs atomically so welcome email (and future notifs)
    // see a real prefs row instead of defensive defaults. This reduces the large fallback
    // objects in the prefs API and ensures consistent behavior from signup.
    const newUser = await prisma.$transaction(async (tx: any) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          role: safeRole,
          password: hashedPassword,
        }
      })

      // Create default prefs immediately (matches the defaults used in the prefs API)
      await tx.notificationPreference.create({
        data: {
          userId: createdUser.id,
          inAppEnabled: true,
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          orderUpdates: true,
          gigUpdates: true,
          reviewAlerts: true,
          paymentAlerts: true,
          messageAlerts: true,
          systemAlerts: true,
          desktopNotifications: true,
          soundEnabled: true,
          quietHoursEnabled: false,
          quietHoursStart: "22:00",
          quietHoursEnd: "08:00",
          digestEnabled: false,
          digestFrequency: "daily",
          maxNotificationsPerHour: 8,
        }
      }).catch(() => {}); // non-fatal if schema drift

      return createdUser;
    })

    // Audit log for system change (new user registration)
    await logAuditEvent({
      performedById: newUser.id,
      action: 'USER_REGISTERED',
      targetType: 'User',
      targetId: newUser.id,
      details: { email: newUser.email, role: safeRole, viaReferral: !!referralCode },
    });

    // Link referral if referralCode was provided (outside tx for simplicity; can be improved)
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

    // Send welcome email (now uses rich welcomeEmail template + benefits from new reliable tracking + resendEmailId)
    await notifications.sendEmail(
      newUser.id,
      '¡Bienvenido!',
      `Hola ${name}, gracias por registrarte. Ya puedes explorar servicios o publicar los tuyos.`,
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com'}/gigs`,
      { isWelcome: true }
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
