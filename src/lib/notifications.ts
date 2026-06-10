import { prisma } from './prisma';
import { Resend } from 'resend';
import { devLog, toPrismaJson, parseDeliveryLog } from './utils';

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
  // Use explicit select omitting newer columns (e.g. marketingEmails) that may not exist in prod DB yet.
  // This prevents "column does not exist" prisma errors on drifted deployments.
  let prefs: any = null;
  try {
    prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        inAppEnabled: true,
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: true,
        orderUpdates: true,
        gigUpdates: true,
        reviewAlerts: true,
        paymentAlerts: true,
        messageAlerts: true,
        systemAlerts: true,
        // marketingEmails intentionally omitted for prod DB compatibility (added post-deploy in some envs)
        desktopNotifications: true,
        soundEnabled: true,
        quietHoursEnabled: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        digestEnabled: true,
        digestFrequency: true,
        maxNotificationsPerHour: true,
        createdAt: true,
        updatedAt: true,
      }
    });
  } catch (e) {
    devLog('[Notifications] Prefs lookup failed, defaulting to enabled:', e);
  }

  // Inject default for marketingEmails (and any future columns) when the row was loaded without it
  if (prefs && (prefs as any).marketingEmails === undefined) {
    (prefs as any).marketingEmails = true;
  }

  const shouldSendInApp = prefs?.inAppEnabled !== false;
  const shouldSendEmail = prefs?.emailEnabled !== false;
  const shouldSendSMS   = prefs?.smsEnabled !== false;
  const shouldSendPush  = prefs?.pushEnabled !== false;

  // Global masters from PlatformConfig (set in /admin/settings)
  let globalEmailOk = true;
  let globalPushOk = true;
  try {
    const cfg = await prisma.platformConfig.findUnique({ where: { id: 'singleton' } });
    if (cfg) {
      globalEmailOk = (cfg as any).globalEmailNotificationsEnabled !== false;
      globalPushOk = (cfg as any).globalPushNotificationsEnabled !== false;
    }
  } catch (e) {
    devLog('[Notifications] Failed to read global notification masters');
  }

  const effectiveShouldSendEmail = shouldSendEmail && globalEmailOk;
  const effectiveShouldSendPush = shouldSendPush && globalPushOk;

  // === 2027 User Respect: Quiet Hours ===
  const isInQuietHours = checkQuietHours(prefs);
  // Quiet hours suppress *disturbing* channels (email, push, sms) for non-high priority.
  // in_app (bell) is still created so users see it when they open the app.
  // The auto-email side-effect (the common path) is also suppressed here.
  if (isInQuietHours && payload.priority !== 'high') {
    if (type !== 'in_app') {
      return { success: true, skipped: 'quiet hours (user preference)' };
    }
  }

  const emailAllowed = effectiveShouldSendEmail && !(isInQuietHours && payload.priority !== 'high');

  // === 2027 Rate Limiting + Grouping ===
  const rateLimitResult = await checkRateLimit(userId, category, prefs);
  if (rateLimitResult.limited) {
    devLog(`[RateLimit] Suppressed notification for user ${userId} (${category})`);
    return { success: true, skipped: rateLimitResult.reason };
  }

  // Granular checks per category
  const categoryEnabled = 
    category === 'order'     ? (prefs?.orderUpdates  !== false) :
    category === 'gig'       ? (prefs?.gigUpdates    !== false) :
    category === 'review'    ? (prefs?.reviewAlerts  !== false) :
    category === 'payment'   ? (prefs?.paymentAlerts !== false) :
    category === 'message'   ? (prefs?.messageAlerts !== false) :
    category === 'system'    ? (prefs?.systemAlerts  !== false) :
    category === 'marketing' ? (prefs?.marketingEmails !== false) : true;

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

  // === Email delivery tracking record (the key fix for reliable correlation) ===
  // We guarantee a concrete Notification row id for every email we send.
  // - Prefer the in_app row we just created for this event (best UX, users see it in history).
  // - If no in_app row exists for this send (user has inApp off, or explicit email type with inApp disabled),
  //   we create a lightweight type:'email' record whose only job is to carry the delivery status + resendEmailId.
  // This eliminates the previous racy findFirst({userId, category}) + "recent 20 scan" hacks.
  let emailTrackingNotifId: string | null = inAppNotifId;

  // Email sending helper (reusable for both explicit email and triggered in-app notifications)
  // IMPORTANT: We now *always* try to pass a concrete tracking Notification id so that
  // we can directly update the row with resendEmailId + status (no more racy findFirst).
  async function sendEmailIfEnabled(trackingNotifId?: string | null) {
    if (!resend || !emailAllowed) return;

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
      } else if ((category === 'system' || category === 'email') &&
                 (title?.toLowerCase().includes('bienvenido') || data?.isWelcome || data?.welcome)) {
        // Support the dedicated welcome template for signup (direct sendEmail) and tests.
        // This gives the nice branded header instead of the plain generic.
        const { welcomeEmail } = await import('./emails/templates');
        emailContent = welcomeEmail({ userName: user.name });
      } else if ((category === 'system' || category === 'email') &&
                 (title?.toLowerCase().includes('restablece') || title?.toLowerCase().includes('contraseña') || title?.toLowerCase().includes('password') || data?.resetLink)) {
        // Rich password reset template (used by forgot-password flow + tests)
        const { passwordResetEmail } = await import('./emails/templates');
        emailContent = passwordResetEmail({
          userName: user.name,
          resetLink: data?.resetLink || link || '',
        });
      } else if (category === 'gig' && data?.gigTitle) {
        const { gigPublishedEmail } = await import('./emails/templates');
        emailContent = gigPublishedEmail({
          userName: user.name,
          gigTitle: data.gigTitle,
          gigId: data.gigId,
        });
      } else if (category === 'payment' && data?.amount) {
        // Referral payout request or payment alerts
        const { referralPayoutRequestEmail } = await import('./emails/templates');
        emailContent = referralPayoutRequestEmail({
          userName: user.name,
          amount: data.amount,
          requesterName: data.requesterName,
        });
      } else if (category === 'system' && (data?.ticketId || title?.toLowerCase().includes('ticket') || title?.toLowerCase().includes('soporte'))) {
        const { supportTicketEmail } = await import('./emails/templates');
        emailContent = supportTicketEmail({
          userName: user.name,
          subject: data?.subject || title || 'Soporte',
          isAdmin: data?.isAdmin || false,
          ticketId: data?.ticketId,
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

      const resendId = (emailResult as any)?.id || null;

      // Update delivery tracking on the *known* tracking notification id (reliable, no findFirst).
      // We also set resendEmailId (new column) for O(1) webhook correlation.
      if (trackingNotifId && resendId) {
        try {
          const notif = await prisma.notification.findUnique({ where: { id: trackingNotifId } });
          if (notif) {
            const currentLog = parseDeliveryLog(notif.deliveryLog);

            await prisma.notification.update({
              where: { id: trackingNotifId },
              data: {
                emailStatus: 'sent',
                emailSentAt: new Date(),
                resendEmailId: resendId,
                deliveryLog: toPrismaJson({
                  ...currentLog,
                  emailAttempt: {
                    at: new Date().toISOString(),
                    resendId,
                  }
                })
              }
            });
          }
        } catch (trackErr) {
          devLog('Failed to update email tracking', trackErr);
        }
      }

      devLog(`[Resend] Email sent to ${user.email} (${category})`);
    } catch (emailError: any) {
      devLog('Resend email error:', emailError);
      // Basic backpressure note: if 429/rate from Resend, we just log; in future could
      // implement retry with backoff or queue.
      if (emailError?.status === 429) {
        devLog('[Resend] Rate limited (429) - consider backing off or queuing');
      }
    }
  }

  // 2. Handle Email via Resend (explicit 'email' type OR triggered alongside in_app)
  // Use emailAllowed (prefs + quiet hours) instead of raw shouldSendEmail.
  const shouldAlsoEmail = type === 'email' || (type === 'in_app' && shouldSendEmail);
  if (shouldAlsoEmail && emailAllowed) {
    // Ensure we have a tracking row for this email (create dedicated 'email' type record if needed)
    if (!emailTrackingNotifId) {
      try {
        const created = await prisma.notification.create({
          data: {
            userId,
            category,
            type: 'email', // dedicated delivery tracking record (visible in admin logs / user history)
            title,
            message,
            link: link || null,
            data: toPrismaJson(data),
            deliveryLog: toPrismaJson({
              emailTrackingCreatedAt: new Date().toISOString(),
            }),
          },
          select: { id: true }
        });
        emailTrackingNotifId = created.id;
      } catch (err) {
        devLog('Failed to create email tracking notification:', err);
      }
    }

    await sendEmailIfEnabled(emailTrackingNotifId);
  }

  // 3. SMS (future) and server-side Push (future, currently browser client-side in UI)
  if (type === 'sms' && shouldSendSMS) {
    devLog(`[NOTIF] SMS would be sent to user ${userId}`);
  }

  if ((type === 'push' || effectiveShouldSendPush) && effectiveShouldSendPush) {
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

  async sendEmail(userId: string, title: string, message: string, link?: string, dataOrOptions?: any) {
    // Support legacy data + new { category, priority, data } style from marketing broadcasts
    const opts = dataOrOptions || {};
    const category = opts.category || (opts.data ? 'system' : 'system');
    const priority = opts.priority || undefined;
    const data = opts.data || (opts.category || opts.priority ? undefined : opts);
    return sendNotification({ userId, category, type: 'email', title, message, link, data, priority });
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
 *
 * NOTE: This is an *in-memory* cache (per Node process / server instance).
 * On Vercel (serverless, cold starts, multiple regions/instances, scale):
 *   - The cache frequently resets.
 *   - It provides only best-effort protection against bursts within a single invocation.
 * For real production abuse protection, replace with Redis/Upstash or a DB-backed
 * sliding window (e.g. on Notification or a lightweight SentEvent table).
 *
 * The maxNotificationsPerHour pref is still respected as a soft client-side hint.
 */
const recentNotificationCache = new Map<string, { count: number; lastSent: number }>();

async function checkRateLimit(userId: string, category: string, prefs: any) {
  const maxPerHour = prefs?.maxNotificationsPerHour ?? 8;
  if (maxPerHour <= 0) return { limited: false };

  const key = `${userId}:${category}`;
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;

  let cached = recentNotificationCache.get(key);
  if (!cached || cached.lastSent < hourAgo) {
    cached = { count: 0, lastSent: 0 };
  }

  // DB-backed count for cross-instance reliability on serverless (authoritative fallback)
  let dbCount = cached.count;
  try {
    // Only query DB if in-mem suggests we are close to limit (to avoid perf hit on every notif)
    if (cached.count >= Math.max(1, Math.floor(maxPerHour * 0.6))) {
      dbCount = await prisma.notification.count({
        where: {
          userId,
          category,
          createdAt: { gte: new Date(hourAgo) },
        },
      });
    }
  } catch (e) {
    devLog('[RateLimit] DB count failed, using in-mem only:', e);
  }

  const effectiveCount = Math.max(cached.count, dbCount);

  if (effectiveCount >= maxPerHour) {
    return { limited: true, reason: `rate limit (${maxPerHour}/hour for ${category})` };
  }

  // Increment in-mem
  cached.count = effectiveCount + 1;
  cached.lastSent = now;
  recentNotificationCache.set(key, cached);

  // Basic grouping: if we just sent something very similar recently, skip
  // (this still only works within one process lifetime)
  if (now - cached.lastSent < 1000 * 90 && cached.count > 1) {
    // Allow it but note grouping happened (future: we could batch)
  }

  return { limited: false };
}
