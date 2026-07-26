import { after, NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAuditEvent } from '@/lib/audit'
import { getRequestIp } from '@/lib/rate-limit'
import { lookupCityFromIp } from '@/lib/ip-geolocation'

const FRESH_LOGIN_WINDOW_MS = 2 * 60 * 1000

/**
 * Enrich last login with IP, city, and user-agent shortly after sign-in.
 * Responds immediately and runs IP geolocation after the response so the
 * login page never waits on a slow/timed-out city lookup (up to 3s).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastLoginAt: true },
    })

    if (!user?.lastLoginAt) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'no_last_login' })
    }

    const ageMs = Date.now() - user.lastLoginAt.getTime()
    if (ageMs > FRESH_LOGIN_WINDOW_MS) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'not_fresh' })
    }

    const ip = getRequestIp(request.headers)
    const userAgent = request.headers.get('user-agent') || null
    const ipValue = ip !== 'unknown' ? ip : null

    // Persist IP/UA immediately; city lookup can hang ~3s and must not block the client.
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginIp: ipValue,
        lastLoginUserAgent: userAgent,
      },
    })

    after(() => enrichLoginCityAndAudit(userId, ip, ipValue, userAgent))

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error registrando inicio de sesión' }, { status: 500 })
  }
}

async function enrichLoginCityAndAudit(
  userId: string,
  ip: string,
  ipValue: string | null,
  userAgent: string | null,
) {
  try {
    const city = await lookupCityFromIp(ip)
    if (city) {
      await prisma.user.update({
        where: { id: userId },
        data: { lastLoginCity: city },
      })
    }

    await logAuditEvent({
      performedById: userId,
      action: 'LOGIN_SUCCESS',
      targetType: 'User',
      targetId: userId,
      details: { city, ip: ipValue },
      ipAddress: ipValue,
      userAgent,
    }).catch(() => {})
  } catch {
    // Non-fatal enrichment
  }
}