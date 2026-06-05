import { prisma } from './prisma';
import { Resend } from 'resend';
import { devLog, toPrismaJson } from './utils';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'OigaUsted <support@support.oigagig.com>';

export interface NotificationPayload {
  userId: string;
  category: string;
  type: 'in_app' | 'email' | 'sms' | 'push';
  title: string;
  message: string;
  link?: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Sends a notification through the requested channel(s).
 */
export async function sendNotification(payload: NotificationPayload) {
  const { userId, category, type, title, message, link, data } = payload;

  // 1. Respect user preferences (defensive: default to enabled if prefs table/query fails due to schema)
  let prefs: any = null;
  try {
    prefs = await prisma.notificationPreference.findUnique({
      where: { userId }
    });
  } catch (e) {
    devLog('[Notifications] Prefs lookup failed, defaulting to enabled:', e);
  }

  const shouldSendInApp = prefs?.inAppEnabled !== false;
  const shouldSendEmail = prefs?.emailEnabled !== false;
  const shouldSendSMS   = prefs?.smsEnabled !== false;
  const shouldSendPush  = prefs?.pushEnabled !== false;

  // === 2027 User Respect: Quiet Hours ===
  const isInQuietHours = checkQuietHours(prefs);
  if (isInQuietHours) {
    if (payload.priority !== 'high') {
      const onlyInApp = type === 'in_app';
      if (!onlyInApp) {
        return { success: true, skipped: 'quiet hours (user preference)' };
      }
    }
  }

  // === 2027 Rate Limiting + Grouping ===
  const rateLimitResult = await checkRateLimit(userId, category, prefs);
  if (rateLimitResult.limited) {
    devLog(`[RateLimit] Suppressed notification for user ${userId} (${category})`);
    return { success: true, skipped: rateLimitResult.reason };
  }

  // Granular checks per category
  const categoryEnabled = 
    category === 'order'   ? (prefs?.orderUpdates  !== false) :
    category === 'gig'     ? (prefs?.gigUpdates    !== false) :
    category === 'review'  ? (prefs?.reviewAlerts  !== false) :
    category === 'payment' ? (prefs?.paymentAlerts !== false) :
    category === 'message' ? (prefs?.messageAlerts !== false) :
    category === 'system'  ? (prefs?.systemAlerts  !== false) : true;

  if (!categoryEnabled) {
    return { success: true, skipped: 'disabled by user preference' };
  }

  // 2. Store in-app notification (if enabled)
  let inAppNotifId: string | null = null;
  if ((type === 'in_app' || ['email','sms','push'].includes(type)) && shouldSendInApp) {
    try {
      const created = await prisma.notification.create({
        data: {
          userId,
          category,
          type: 'in_app',
          title,
          message,
          link: link || null,
          data: toPrismaJson(data),
          deliveryLog: toPrismaJson({
            inAppCreatedAt: new Date().toISOString(),
          }),
        },
        select: { id: true }
      });
      inAppNotifId = created.id;
    } catch (err) {
      devLog('Failed to save in-app notification:', err);
    }
  }

  // Email sending helper (reusable for both explicit email and triggered in-app notifications)
  async function sendEmailIfEnabled(existingInAppId?: string | null) {
    if (!resend || !shouldSendEmail) return;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (!user?.email) return;

      let emailContent;

      // Use rich templates when we have enough context
      if (category === 'order' && data?.gigTitle) {
        const { newOrderEmail, orderStatusUpdatedEmail } = await import('./emails/templates');
        if (data.newStatus) {
          emailContent = orderStatusUpdatedEmail({
            userName: user.name,
            gigTitle: data.gigTitle,
            amount: data.amount || 0,
            otherPartyName: data.buyerName || data.sellerName || 'Otra parte',
            orderId: data.orderId || '',
            newStatus: data.newStatus,
          });
        } else {
          emailContent = newOrderEmail({
            userName: user.name,
            gigTitle: data.gigTitle,
            amount: data.amount || 0,
            otherPartyName: data.buyerName || data.sellerName || 'Otra parte',
            orderId: data.orderId || '',
          });
        }
      } else if (category === 'review' && data?.gigTitle) {
        const { reviewReceivedEmail } = await import('./emails/templates');
        emailContent = reviewReceivedEmail({
          userName: user.name,
          gigTitle: data.gigTitle,
          rating: data.rating || 5,
          reviewerName: data.reviewerName || 'Un cliente',
          orderId: data.orderId || '',
          amount: data.amount || 0,
          otherPartyName: data.reviewerName || 'Un cliente',
        });
      } else if (category === 'message' && data?.gigTitle) {
        // Simple but useful message email
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';
        emailContent = {
          subject: title || `Nuevo mensaje sobre "${data.gigTitle}"`,
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
              <h2 style="color: #111;">${title || 'Nuevo mensaje'}</h2>
              <p>Hola <strong>${user.name || 'Usuario'}</strong>,</p>
              <p>${message}</p>
              <a href="${appUrl}${link || `/orders/${data.orderId || ''}`}" 
                 style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; margin-top: 16px;">
                Ver conversación
              </a>
            </div>
          `
        };
      } else {
        // Generic fallback for all other categories (system, payment, gig, etc.)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';
        emailContent = {
          subject: title,
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #f97316;">${title}</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">${message}</p>
              ${link ? `<p style="margin-top: 24px;"><a href="${appUrl}${link}" style="background:#f97316;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">Ver detalles →</a></p>` : ''}
              <p style="margin-top: 32px; font-size: 12px; color: #888;">OigaUsted • Servicios locales de confianza</p>
            </div>
          `
        };
      }

      const emailResult = await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
      });

      // Update delivery tracking
      try {
        let notifToUpdate = null;
        if (existingInAppId) {
          notifToUpdate = await prisma.notification.findUnique({ where: { id: existingInAppId } });
        }
        if (!notifToUpdate) {
          notifToUpdate = await prisma.notification.findFirst({
            where: { userId, category },
            orderBy: { createdAt: 'desc' }
          });
        }

        if (notifToUpdate) {
          await prisma.notification.update({
            where: { id: notifToUpdate.id },
            data: {
              emailStatus: 'sent',
              emailSentAt: new Date(),
              deliveryLog: toPrismaJson({
                ...(typeof notifToUpdate.deliveryLog === 'string' ? JSON.parse(notifToUpdate.deliveryLog) : (notifToUpdate.deliveryLog || {})),
                emailAttempt: {
                  at: new Date().toISOString(),
                  resendId: (emailResult as any)?.id || null,
                }
              })
            }
          });
        }
      } catch (trackErr) {
        devLog('Failed to update email tracking', trackErr);
      }

      devLog(`[Resend] Email sent to ${user.email} (${category})`);
    } catch (emailError) {
      devLog('Resend email error:', emailError);
    }
  }

  // 2. Handle Email via Resend (explicit 'email' type OR triggered alongside in_app)
  const shouldAlsoEmail = type === 'email' || (type === 'in_app' && shouldSendEmail);
  if (shouldAlsoEmail) {
    await sendEmailIfEnabled(inAppNotifId);
  }

  // 3. SMS (future) and server-side Push (future, currently browser client-side in UI)
  if (type === 'sms' && shouldSendSMS) {
    devLog(`[NOTIF] SMS would be sent to user ${userId}`);
  }

  if ((type === 'push' || shouldSendPush) && shouldSendPush) {
    // Real Web Push will be attempted
    try {
      await sendWebPushIfEnabled(userId, title, message, link, data);
    } catch (e) {
      devLog('Web Push error:', e);
    }
  }

  return { success: true };
}

// Convenience helpers
export const notifications = {
  async sendInApp(userId: string, category: string, title: string, message: string, link?: string, data?: any) {
    return sendNotification({ userId, category, type: 'in_app', title, message, link, data });
  },

  async sendEmail(userId: string, title: string, message: string, link?: string, data?: any) {
    return sendNotification({ userId, category: 'system', type: 'email', title, message, link, data });
  },

  async sendSMS(userId: string, message: string) {
    return sendNotification({ userId, category: 'system', type: 'sms', title: 'OigaUsted', message });
  },

  async sendPush(userId: string, title: string, message: string, data?: any) {
    return sendNotification({ userId, category: 'system', type: 'push', title, message, data });
  },

  // Direct access for custom category/type (e.g. message notifications)
  sendNotification,
};

// Export Resend instance in case you want to send custom emails directly
export { resend };

/**
 * Checks if current time is within user's quiet hours.
 * Supports overnight ranges (e.g. 22:00 → 08:00).
 */
function checkQuietHours(prefs: any): boolean {
  if (!prefs?.quietHoursEnabled || !prefs.quietHoursStart || !prefs.quietHoursEnd) {
    return false;
  }

  try {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = prefs.quietHoursStart.split(':').map(Number);
    const [endH, endM] = prefs.quietHoursEnd.split(':').map(Number);

    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);

    if (startMinutes < endMinutes) {
      // Same day range (e.g. 09:00 - 17:00)
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight range (e.g. 22:00 - 08:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  } catch {
    return false;
  }
}

/**
 * Send real Web Push notification using VAPID + web-push library.
 * Requires: npm install web-push
 * And VAPID keys in environment:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
 *   VAPID_PRIVATE_KEY=...
 */
async function sendWebPushIfEnabled(
  userId: string,
  title: string,
  message: string,
  link?: string,
  data?: any
) {
  const webpush = await import('web-push').catch(() => null);
  if (!webpush) {
    devLog('[WebPush] web-push not installed - skipping real push');
    return;
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    devLog('[WebPush] VAPID keys not configured');
    return;
  }

  webpush.setVapidDetails(
    'mailto:support@support.oigagig.com',
    publicKey,
    privateKey
  );

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) return;

  const payload = JSON.stringify({
    title,
    body: message,
    icon: '/logo.png',
    url: link || '/',
    data: data || {},
  });

  const sendPromises = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payload
      );
    } catch (err: any) {
      // If subscription is expired/invalid, remove it
      if (err.statusCode === 410 || err.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
      devLog('Failed to send push to one subscription:', err.message);
    }
  });

  await Promise.allSettled(sendPromises);
  devLog(`[WebPush] Attempted push to ${subscriptions.length} device(s) for user ${userId}`);
}

/**
 * Simple but effective rate limiting + grouping (2027 user respect)
 */
// In-memory rate limit cache (per server instance).
// NOTE: On Vercel/serverless this is best-effort only (resets on cold starts / scale).
// For production abuse protection consider Redis/Upstash or DB-backed counters.
const recentNotificationCache = new Map<string, { count: number; lastSent: number }>();

async function checkRateLimit(userId: string, category: string, prefs: any) {
  const maxPerHour = prefs?.maxNotificationsPerHour ?? 8;
  if (maxPerHour <= 0) return { limited: false };

  const key = `${userId}:${category}`;
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;

  const cached = recentNotificationCache.get(key) || { count: 0, lastSent: 0 };

  // Clean old entries
  if (cached.lastSent < hourAgo) {
    cached.count = 0;
  }

  if (cached.count >= maxPerHour) {
    return { limited: true, reason: `rate limit (${maxPerHour}/hour for ${category})` };
  }

  // Increment
  cached.count++;
  cached.lastSent = now;
  recentNotificationCache.set(key, cached);

  // Basic grouping: if we just sent something very similar recently, skip
  if (now - cached.lastSent < 1000 * 90 && cached.count > 1) {
    // Allow it but note grouping happened (future: we could batch)
  }

  return { limited: false };
}
