import { prisma } from './prisma';
import type { PlatformConfigRow } from './prisma';
import { Resend } from 'resend';
import { devLog, toPrismaJson, parseDeliveryLog } from './utils';
import type { JsonObject } from '@/types/json';
import type { PushSubscription } from '@prisma/client';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Oigagig <support@oigagig.com>';

export interface NotificationPayload {
  userId: string;
  category: string;
  type: 'in_app' | 'email' | 'sms' | 'push';
  title: string;
  message: string;
  link?: string;
  data?: JsonObject;
  priority?: 'low' | 'normal' | 'high';
}

/** Prefs row shape from explicit select (marketingEmails omitted for prod DB compatibility). */
type NotificationPrefs = {
  id: string;
  userId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  orderUpdates: boolean;
  gigUpdates: boolean;
  reviewAlerts: boolean;
  paymentAlerts: boolean;
  messageAlerts: boolean;
  systemAlerts: boolean;
  desktopNotifications: boolean;
  soundEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  digestEnabled: boolean;
  digestFrequency: string;
  maxNotificationsPerHour: number;
  createdAt: Date;
  updatedAt: Date;
  marketingEmails?: boolean;
};

type SendEmailDataOrOptions = JsonObject & {
  category?: string;
  priority?: 'low' | 'normal' | 'high';
  data?: JsonObject;
};

function jsonString(data: JsonObject | undefined, key: string, fallback = ''): string {
  const value = data?.[key];
  return typeof value === 'string' ? value : fallback;
}

function jsonNumber(data: JsonObject | undefined, key: string, fallback = 0): number {
  const value = data?.[key];
  return typeof value === 'number' ? value : fallback;
}

function jsonBoolean(data: JsonObject | undefined, key: string, fallback = false): boolean {
  const value = data?.[key];
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * Sends a notification through the requested channel(s).
 */
export async function sendNotification(payload: NotificationPayload) {
  const { userId, category, type, title, message, link, data } = payload;

  // 1. Respect user preferences (defensive: default to enabled if prefs table/query fails due to schema)
  // Use explicit select omitting newer columns (e.g. marketingEmails) that may not exist in prod DB yet.
  // This prevents "column does not exist" prisma errors on drifted deployments.
  let prefs: NotificationPrefs | null = null;
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
  if (prefs && prefs.marketingEmails === undefined) {
    prefs.marketingEmails = true;
  }

  const shouldSendInApp = prefs?.inAppEnabled !== false;
  const shouldSendEmail = prefs?.emailEnabled !== false;
  const shouldSendSMS   = prefs?.smsEnabled !== false;
  const shouldSendPush  = prefs?.pushEnabled !== false;

  // Global masters from PlatformConfig (set in /admin/settings)
  let globalEmailOk = true;
  let globalPushOk = true;
  try {
    const { getPlatformConfig } = await import('@/lib/prisma');
    const cfg: PlatformConfigRow | null = await getPlatformConfig();
    if (cfg) {
      globalEmailOk = cfg.globalEmailNotificationsEnabled !== false;
      globalPushOk = cfg.globalPushNotificationsEnabled !== false;
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
      if (category === 'order' && jsonString(data, 'gigTitle')) {
        const { newOrderEmail, orderStatusUpdatedEmail } = await import('./emails/templates');
        const gigTitle = jsonString(data, 'gigTitle');
        const newStatus = jsonString(data, 'newStatus');
        if (newStatus) {
          emailContent = orderStatusUpdatedEmail({
            userName: user.name,
            gigTitle,
            amount: jsonNumber(data, 'amount'),
            otherPartyName: jsonString(data, 'buyerName') || jsonString(data, 'sellerName') || 'Otra parte',
            orderId: jsonString(data, 'orderId'),
            newStatus,
          });
        } else {
          emailContent = newOrderEmail({
            userName: user.name,
            gigTitle,
            amount: jsonNumber(data, 'amount'),
            otherPartyName: jsonString(data, 'buyerName') || jsonString(data, 'sellerName') || 'Otra parte',
            orderId: jsonString(data, 'orderId'),
          });
        }
      } else if (category === 'review' && jsonString(data, 'gigTitle')) {
        const { reviewReceivedEmail } = await import('./emails/templates');
        const reviewerName = jsonString(data, 'reviewerName', 'Un cliente');
        emailContent = reviewReceivedEmail({
          userName: user.name,
          gigTitle: jsonString(data, 'gigTitle'),
          rating: jsonNumber(data, 'rating', 5),
          reviewerName,
          orderId: jsonString(data, 'orderId'),
          amount: jsonNumber(data, 'amount'),
          otherPartyName: reviewerName,
        });
      } else if ((category === 'system' || category === 'email') &&
                 (title?.toLowerCase().includes('bienvenido') || jsonBoolean(data, 'isWelcome') || jsonBoolean(data, 'welcome'))) {
        // Support the dedicated welcome template for signup (direct sendEmail) and tests.
        // This gives the nice branded header instead of the plain generic.
        const { welcomeEmail } = await import('./emails/templates');
        emailContent = welcomeEmail({ userName: user.name });
      } else if ((category === 'system' || category === 'email') &&
                 (title?.toLowerCase().includes('restablece') || title?.toLowerCase().includes('contraseña') || title?.toLowerCase().includes('password') || jsonString(data, 'resetLink'))) {
        // Rich password reset template (used by forgot-password flow + tests)
        const { passwordResetEmail } = await import('./emails/templates');
        emailContent = passwordResetEmail({
          userName: user.name,
          resetLink: jsonString(data, 'resetLink') || link || '',
        });
      } else if (category === 'gig' && jsonString(data, 'gigTitle')) {
        const { gigPublishedEmail } = await import('./emails/templates');
        emailContent = gigPublishedEmail({
          userName: user.name,
          gigTitle: jsonString(data, 'gigTitle'),
          gigId: jsonString(data, 'gigId'),
        });
      } else if (category === 'payment' && jsonNumber(data, 'amount') > 0) {
        // Referral payout request or payment alerts
        const { referralPayoutRequestEmail } = await import('./emails/templates');
        emailContent = referralPayoutRequestEmail({
          userName: user.name,
          amount: jsonNumber(data, 'amount'),
          requesterName: jsonString(data, 'requesterName'),
        });
      } else if (category === 'system' && (jsonString(data, 'ticketId') || title?.toLowerCase().includes('ticket') || title?.toLowerCase().includes('soporte'))) {
        const { supportTicketEmail } = await import('./emails/templates');
        emailContent = supportTicketEmail({
          userName: user.name,
          subject: jsonString(data, 'subject') || title || 'Soporte',
          isAdmin: jsonBoolean(data, 'isAdmin'),
          ticketId: jsonString(data, 'ticketId') || undefined,
        });
      } else if (category === 'marketing' && jsonString(data, 'playbookId')) {
        const { lifecycleNudgeEmail } = await import('./emails/templates');
        emailContent = lifecycleNudgeEmail({
          userName: user.name,
          subject: title || 'Oigagig',
          body: message,
          ctaLabel: jsonString(data, 'ctaLabel') || undefined,
          ctaUrl: jsonString(data, 'ctaUrl') || undefined,
        });
      } else if (category === 'message' && jsonString(data, 'gigTitle')) {
        // Simple but useful message email
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';
        const gigTitle = jsonString(data, 'gigTitle');
        emailContent = {
          subject: title || `Nuevo mensaje sobre "${gigTitle}"`,
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
              <h2 style="color: #111;">${title || 'Nuevo mensaje'}</h2>
              <p>Hola <strong>${user.name || 'Usuario'}</strong>,</p>
              <p>${message}</p>
              <a href="${appUrl}${link || `/orders/${jsonString(data, 'orderId')}`}" 
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
              <p style="margin-top: 32px; font-size: 12px; color: #888;">Oigagig • Servicios locales de confianza</p>
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

      const resendId = emailResult.data?.id || null;

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
    } catch (emailError: unknown) {
      devLog('Resend email error:', emailError);
      // Basic backpressure note: if 429/rate from Resend, we just log; in future could
      // implement retry with backoff or queue.
      if (
        emailError &&
        typeof emailError === 'object' &&
        'status' in emailError &&
        (emailError as { status: number }).status === 429
      ) {
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
  async sendInApp(userId: string, category: string, title: string, message: string, link?: string, data?: JsonObject) {
    return sendNotification({ userId, category, type: 'in_app', title, message, link, data });
  },

  async sendEmail(userId: string, title: string, message: string, link?: string, dataOrOptions?: SendEmailDataOrOptions) {
    // Support legacy data + new { category, priority, data } style from marketing broadcasts
    const opts: SendEmailDataOrOptions = dataOrOptions || {};
    const category = opts.category || (opts.data ? 'system' : 'system');
    const priority = opts.priority || undefined;
    const data = opts.data || (opts.category || opts.priority ? undefined : opts);
    return sendNotification({ userId, category, type: 'email', title, message, link, data, priority });
  },

  async sendSMS(userId: string, message: string) {
    return sendNotification({ userId, category: 'system', type: 'sms', title: 'Oigagig', message });
  },

  async sendPush(userId: string, title: string, message: string, data?: JsonObject) {
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
function checkQuietHours(prefs: NotificationPrefs | null): boolean {
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
  data?: JsonObject
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
    'mailto:support@oigagig.com',
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

  const sendPromises = subscriptions.map(async (sub: PushSubscription) => {
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
    } catch (err: unknown) {
      // If subscription is expired/invalid, remove it
      const statusCode =
        err && typeof err === 'object' && 'statusCode' in err
          ? (err as { statusCode: number }).statusCode
          : undefined;
      if (statusCode === 410 || statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
      const message = err instanceof Error ? err.message : String(err);
      devLog('Failed to send push to one subscription:', message);
    }
  });

  await Promise.allSettled(sendPromises);
  devLog(`[WebPush] Attempted push to ${subscriptions.length} device(s) for user ${userId}`);
}

/** DB-backed hourly rate limit (reliable across serverless instances). */
async function checkRateLimit(userId: string, category: string, prefs: NotificationPrefs | null) {
  const maxPerHour = prefs?.maxNotificationsPerHour ?? 8;
  if (maxPerHour <= 0) return { limited: false };

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

  try {
    const dbCount = await prisma.notification.count({
      where: {
        userId,
        category,
        createdAt: { gte: hourAgo },
      },
    });

    if (dbCount >= maxPerHour) {
      return { limited: true, reason: `rate limit (${maxPerHour}/hour for ${category})` };
    }
  } catch (e) {
    devLog('[RateLimit] DB count failed (allowing notification):', e);
  }

  return { limited: false };
}
