import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import bcrypt from 'bcryptjs'
import { notifications } from '@/lib/notifications'
import { logAuditEvent } from '@/lib/audit'
import { notifyAdminsNewSignup } from '@/lib/admin-notifications'
import { checkRateLimit, getRequestIp, RATE_LIMITS } from '@/lib/rate-limit'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { getCountry, normalizeCountryCode, isComingSoonCountry } from '@/lib/countries'
import {
  countActiveSellers,
  isPioneerEligible,
  getPioneerNumber,
} from '@/lib/country-stats'

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      email,
      password,
      referralCode,
      role: requestedRole,
      turnstileToken,
      countryCode: requestedCountry,
    } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Faltan campos requeridos (nombre, email, contraseña)" }, { status: 400 })
    }

    // Basic password strength
    if (password.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 })
    }

    const ip = getRequestIp(request.headers)

    const turnstile = await verifyTurnstileToken(turnstileToken, ip)
    if (!turnstile.ok) {
      return NextResponse.json({ error: turnstile.error }, { status: 400 })
    }

    const rateLimit = await checkRateLimit({
      action: 'SIGNUP_ATTEMPT',
      ip,
      maxAttempts: RATE_LIMITS.signupPerIp.max,
      windowMs: RATE_LIMITS.signupPerIp.windowMs,
    })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many signup attempts. Please try again in ${rateLimit.retryAfter} seconds.` },
        { status: 429 }
      )
    }

    await logAuditEvent({
      performedById: null,
      action: 'SIGNUP_ATTEMPT',
      targetType: 'User',
      details: { email: email.toLowerCase() },
      ipAddress: ip,
    }).catch(() => {})

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

    const safeRole = requestedRole === 'seller' ? 'seller' : 'buyer'
    const countryCode = normalizeCountryCode(requestedCountry)
    const country = getCountry(countryCode)!
    const sellerCountBefore = await countActiveSellers(countryCode)
    const pioneerEligible =
      safeRole === 'seller' && isPioneerEligible(countryCode, sellerCountBefore)
    const pioneerNumber = pioneerEligible ? getPioneerNumber(sellerCountBefore) : null

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
      return NextResponse.json({ error: "Este correo ya está registrado" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user + default notification prefs atomically so welcome email (and future notifs)
    // see a real prefs row instead of defensive defaults. This reduces the large fallback
    // objects in the prefs API and ensures consistent behavior from signup.
    const newUser = await prisma.$transaction(async (tx: import('@prisma/client').Prisma.TransactionClient) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          role: safeRole,
          countryCode,
          password: hashedPassword,
          ...(safeRole === 'seller' && {
            businessName: String(name).trim() || 'Mi Negocio',
          }),
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
      details: {
        email: newUser.email,
        role: safeRole,
        countryCode,
        viaReferral: !!referralCode,
        pioneerNumber,
      },
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

    const welcomeMessage = pioneerEligible
      ? `Hola ${name}, eres el profesional pionero #${pioneerNumber} en ${country.name}. Destacado gratis y cero comisiones el primer mes cuando lancemos.`
      : isComingSoonCountry(countryCode) && safeRole === 'buyer'
        ? `Hola ${name}, gracias por registrarte. Te avisaremos cuando ${country.name} esté en vivo.`
        : `Hola ${name}, gracias por registrarte. Ya puedes explorar servicios o publicar los tuyos.`

    await notifications.sendEmail(
      newUser.id,
      '¡Bienvenido!',
      welcomeMessage,
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com'}/gigs`,
      { isWelcome: true }
    )

    notifyAdminsNewSignup({
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      countryName: country.name,
      pioneerNumber,
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        countryCode,
      },
      pioneer: pioneerEligible
        ? { number: pioneerNumber, countryName: country.name }
        : null,
      comingSoonCountry: isComingSoonCountry(countryCode),
    })

  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
