import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
// @ts-ignore
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resend } from '@/lib/notifications';

// Vercel Cron + Digest Job for OigaUsted
// Automatically called by Vercel Cron (see vercel.json)
// Supports manual admin trigger too.

// Basic Digest Email Job (2027 feature stub)
// Call this via Vercel Cron, Inngest, or manually for now.
// Example cron: POST /api/notifications/digest?frequency=daily

export async function GET(req: NextRequest) {
  // Vercel Cron calls use GET; delegate to the same logic
  return POST(req);
}

export async function POST(req: NextRequest) {
  // Vercel Cron protection + optional admin key
  const authHeader = req.headers.get('authorization');
  const vercelCronHeader = req.headers.get('x-vercel-cron');
  const isVercelCron = vercelCronHeader === '1' || authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron) {
    // Allow manual trigger from admin UI (for testing)
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const { searchParams } = new URL(req.url);
  const frequency = searchParams.get('frequency') || 'daily';

  try {
    const usersWithDigest = await prisma.notificationPreference.findMany({
      where: {
        digestEnabled: true,
        digestFrequency: frequency,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    let sent = 0;

    for (const pref of usersWithDigest) {
      if (!pref.user?.email) continue;

      // Get recent unread notifications
      const since = new Date();
      if (frequency === 'daily') {
        since.setDate(since.getDate() - 1);
      } else {
        since.setDate(since.getDate() - 7);
      }

      const recent = await prisma.notification.findMany({
        where: {
          userId: pref.user.id,
          createdAt: { gte: since },
          read: false,
        },
        take: 20,
        orderBy: { createdAt: 'desc' }
      });

      if (recent.length === 0) continue;

      // Send digest email
      const subject = `📬 Resumen de tus notificaciones (${frequency === 'daily' ? 'de hoy' : 'de esta semana'})`;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';

      const html = `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 620px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #f1f1f1;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 24px; color: white; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; margin-bottom: 4px;">OigaUsted</div>
            <div style="font-size: 15px; opacity: 0.95;">${frequency === 'daily' ? 'Resumen diario' : 'Resumen semanal'}</div>
          </div>

          <div style="padding: 32px 28px;">
            <p style="margin: 0 0 16px 0; font-size: 16px; color: #222;">
              Hola <strong>${pref.user.name || 'Usuario'}</strong>,
            </p>

            <p style="margin: 0 0 20px 0; font-size: 15px; color: #444;">
              Tienes <strong>${recent.length} notificaciones nuevas</strong> desde tu último resumen.
            </p>

            <!-- Notifications List -->
            <div style="background: #fafafa; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
              ${recent.map(n => `
                <div style="padding: 10px 0; border-bottom: 1px solid #eee;">
                  <div style="font-weight: 600; color: #111; font-size: 14.5px;">${n.title}</div>
                  <div style="color: #555; font-size: 13.5px; margin-top: 2px; line-height: 1.35;">${n.message}</div>
                </div>
              `).join('')}
            </div>

            <!-- CTA -->
            <div style="text-align: center;">
              <a href="${appUrl}/notifications" 
                 style="background: #f97316; color: white; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 15px;">
                Ver todas mis notificaciones →
              </a>
            </div>

            <div style="margin-top: 28px; text-align: center; font-size: 12px; color: #888;">
              Puedes ajustar la frecuencia de resúmenes en 
              <a href="${appUrl}/settings/notifications" style="color: #f97316;">Preferencias de notificaciones</a>
            </div>
          </div>

          <div style="background: #f8f8f8; padding: 14px; text-align: center; font-size: 11px; color: #888;">
            OigaUsted • Servicios locales de confianza en Colombia
          </div>
        </div>
      `;

      try {
        await resend?.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'OigaUsted <support@support.oigagig.com>',
          to: pref.user.email,
          subject,
          html,
        });
        sent++;
      } catch (e) {
        console.error('Digest email failed for', pref.user.email);
      }
    }

    return NextResponse.json({ success: true, digestsSent: sent, frequency });
  } catch (error) {
    console.error('Digest job error:', error);
    return NextResponse.json({ error: 'Failed to process digest' }, { status: 500 });
  }
}
