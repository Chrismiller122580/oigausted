import { prisma } from './prisma';
import type { PlatformConfigRow } from './prisma';
import { Resend } from 'resend';
import { devLog, toPrismaJson, parseDeliveryLog } from './utils';
import type { JsonObject } from '@/types/json';
import type { PushSubscription } from '@prisma/client';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'OigaGIG <support@oigagig.com>';
const DEFAULT_SUPPORT_EMAIL = 'support@oigagig.com';

/** Reply-To for user-facing mail so CS can answer from the support inbox. */
async function getSupportReplyTo(): Promise<string | undefined> {
  try {
    const { getPlatformConfig } = await import('@/lib/prisma');
    const cfg = await getPlatformConfig();
    const email = cfg?.supportEmail?.trim() || DEFAULT_SUPPORT_EMAIL;
    return email || undefined;
  } catch {
    return DEFAULT_SUPPORT_EMAIL;
  }
}

/** Which delivery channels to attempt (user prefs + quiet hours still apply). */
export type NotificationChannels = 'in_app' | 'email' | 'both';

export interface NotificationPayload {
  userId: string;
  category: string;
  type: 'in_app' | 'email' | 'sms' | 'push';
  title: string;
  message: string;
  link?: string;
  data?: JsonObject;
  priority?: 'low' | 'normal' | 'high';
  /**
   * Explicit channel control (admin/CS manual sends).
   * - both: in-app + email when prefs allow (default for type in_app)
   * - in_app: bell only, never side-effect email
   * - email: email only (tracking row if needed; no bell unless prefs force via type)
   */
  channels?: NotificationChannels;
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
  channels?: NotificationChannels;
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
  const { userId, category, type, title, message, link, data, channels } = payload;

  // Resolve channel intent: explicit channels override type defaults.
  // type 'email' alone historically also created in-app; channels:'email' is email-only.
  const channelMode: NotificationChannels =
    channels ||
    (type === 'email' ? 'both' : type === 'in_app' ? 'both' : 'both');
  const wantInApp = channelMode === 'both' || channelMode === 'in_app';
  const wantEmail = channelMode === 'both' || channelMode === 'email';

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

  // 2. Store in-app notification (if enabled and channel wants in-app)
  let inAppNotifId: string | null = null;
  if (wantInApp && shouldSendInApp) {
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
      if (
        category === 'order' &&
        jsonString(data, 'kind') === 'seller_open_orders_reminder'
      ) {
        const { sellerOpenOrdersReminderEmail } = await import('./emails/templates');
        const openCount = jsonNumber(data, 'openCount', 1);
        const paidCount = jsonNumber(data, 'paidCount', 0);
        const inProgressCount = jsonNumber(data, 'inProgressCount', 0);
        const gigTitlesRaw = data?.gigTitles;
        const gigTitles = Array.isArray(gigTitlesRaw)
          ? gigTitlesRaw.filter((t): t is string => typeof t === 'string')
          : [];
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';
        emailContent = sellerOpenOrdersReminderEmail({
          userName: user.name,
          openCount,
          paidCount,
          inProgressCount,
          gigTitles,
          ctaUrl: `${appUrl}${link || '/seller/orders'}`,
        });
      } else if (category === 'order' && jsonString(data, 'gigTitle')) {
        const {
          newOrderEmail,
          buyerOrderCreatedEmail,
          orderStatusUpdatedEmail,
        } = await import('./emails/templates');
        const gigTitle = jsonString(data, 'gigTitle');
        const newStatus = jsonString(data, 'newStatus');
        const orderId = jsonString(data, 'orderId');
        const otherPartyName =
          jsonString(data, 'buyerName') || jsonString(data, 'sellerName') || 'Otra parte';
        const amount = jsonNumber(data, 'amount');
        const isBuyerConfirmation =
          jsonString(data, 'recipientRole') === 'buyer' ||
          jsonBoolean(data, 'buyerOrderConfirmation');

        if (newStatus) {
          emailContent = orderStatusUpdatedEmail({
            userName: user.name,
            gigTitle,
            amount,
            otherPartyName,
            orderId,
            newStatus,
          });
        } else if (isBuyerConfirmation) {
          emailContent = buyerOrderCreatedEmail({
            userName: user.name,
            gigTitle,
            amount,
            otherPartyName,
            orderId,
          });
        } else {
          emailContent = newOrderEmail({
            userName: user.name,
            gigTitle,
            amount,
            otherPartyName,
            orderId,
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
        const amount = jsonNumber(data, 'amount');
        const orderId = jsonString(data, 'orderId');
        const gigTitle = jsonString(data, 'gigTitle');
        const isOrderPayment =
          Boolean(orderId) ||
          jsonBoolean(data, 'paymentConfirmed') ||
          jsonString(data, 'kind') === 'payment_confirmed';
        const isReferralPayoutAdmin =
          Boolean(jsonString(data, 'requesterName')) ||
          jsonString(data, 'kind') === 'referral_payout' ||
          title?.toLowerCase().includes('referido');

        if (isOrderPayment && (gigTitle || orderId)) {
          const { paymentConfirmedEmail } = await import('./emails/templates');
          emailContent = paymentConfirmedEmail({
            userName: user.name,
            gigTitle: gigTitle || 'tu servicio',
            amount,
            orderId: orderId || '',
          });
        } else if (isReferralPayoutAdmin) {
          const { referralPayoutRequestEmail } = await import('./emails/templates');
          emailContent = referralPayoutRequestEmail({
            userName: user.name,
            amount,
            requesterName: jsonString(data, 'requesterName'),
          });
        } else if (gigTitle && orderId) {
          const { paymentConfirmedEmail } = await import('./emails/templates');
          emailContent = paymentConfirmedEmail({
            userName: user.name,
            gigTitle,
            amount,
            orderId,
          });
        } else {
          // Generic payment fallback (e.g. referrer commission notice without order context)
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';
          emailContent = {
            subject: title,
            html: `
              <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
                <h2 style="color: #111;">${title}</h2>
                <p>Hola <strong>${user.name || 'Usuario'}</strong>,</p>
                <p>${message}</p>
                <a href="${appUrl}${link || '/referrals'}"
                   style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; margin-top: 16px;">
                  Ver detalles
                </a>
              </div>
            `,
          };
        }
      } else if (category === 'system' && (jsonString(data, 'ticketId') || title?.toLowerCase().includes('ticket') || title?.toLowerCase().includes('soporte'))) {
        const { supportTicketEmail } = await import('./emails/templates');
        const kindRaw = jsonString(data, 'kind') || (jsonBoolean(data, 'supportUpdate') ? 'update' : 'received');
        const kind =
          kindRaw === 'resolved' || kindRaw === 'update' || kindRaw === 'received'
            ? kindRaw
            : 'received';
        emailContent = supportTicketEmail({
          userName: user.name,
          subject: jsonString(data, 'subject') || title || 'Soporte',
          isAdmin: jsonBoolean(data, 'isAdmin'),
          ticketId: jsonString(data, 'ticketId') || undefined,
          kind,
          adminReply: jsonString(data, 'adminReply') || undefined,
          status: jsonString(data, 'status') || undefined,
        });
      } else if (category === 'marketing' && jsonString(data, 'playbookId')) {
        const { lifecycleNudgeEmail } = await import('./emails/templates');
        emailContent = lifecycleNudgeEmail({
          userName: user.name,
          subject: title || 'OigaGIG',
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
              <p style="margin-top: 32px; font-size: 12px; color: #888;">OigaGIG • Servicios locales de confianza</p>
            </div>
          `
        };
      }

      const replyTo = await getSupportReplyTo();
      const emailResult = await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        ...(replyTo ? { replyTo } : {}),
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

  // 2. Handle Email via Resend when channel wants email (prefs + quiet hours still apply)
  if (wantEmail && emailAllowed) {
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

  // Push rides with in-app / both (not email-only admin sends)
  if (
    (type === 'push' || (wantInApp && effectiveShouldSendPush)) &&
    effectiveShouldSendPush
  ) {
    try {
      await sendDevicePushIfEnabled(userId, title, message, link, data, inAppNotifId);
    } catch (e) {
      devLog('Web Push error:', e);
    }
  }

  return { success: true };
}

// Convenience helpers
export const notifications = {
  async sendInApp(
    userId: string,
    category: string,
    title: string,
    message: string,
    link?: string,
    data?: JsonObject,
    options?: { channels?: NotificationChannels; priority?: 'low' | 'normal' | 'high' },
  ) {
    return sendNotification({
      userId,
      category,
      type: 'in_app',
      title,
      message,
      link,
      data,
      channels: options?.channels,
      priority: options?.priority,
    });
  },

  async sendEmail(userId: string, title: string, message: string, link?: string, dataOrOptions?: SendEmailDataOrOptions) {
    // Support legacy data + new { category, priority, data, channels } style
    const opts: SendEmailDataOrOptions = dataOrOptions || {};
    const category = opts.category || (opts.data ? 'system' : 'system');
    const priority = opts.priority || undefined;
    const channels = (opts.channels as NotificationChannels | undefined) || undefined;
    const data = opts.data || (opts.category || opts.priority || opts.channels ? undefined : opts);
    return sendNotification({
      userId,
      category,
      type: 'email',
      title,
      message,
      link,
      data,
      priority,
      // Default undefined → both channels (legacy). Pass channels:'email' for email-only.
      channels,
    });
  },

  async sendSMS(userId: string, message: string) {
    return sendNotification({ userId, category: 'system', type: 'sms', title: 'OigaGIG', message });
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
 * Send push to web (VAPID) and native mobile (FCM) subscriptions.
 * Web: NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY
 * Native: FIREBASE_SERVICE_ACCOUNT_JSON
 */
async function sendDevicePushIfEnabled(
  userId: string,
  title: string,
  message: string,
  link?: string,
  data?: JsonObject,
  notificationId?: string | null,
) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) return;

  const webSubs = subscriptions.filter((sub: PushSubscription) => !sub.endpoint.startsWith('fcm:'));
  const nativeSubs = subscriptions.filter((sub: PushSubscription) => sub.endpoint.startsWith('fcm:'));

  if (webSubs.length > 0) {
    const webpush = await import('web-push').catch(() => null);
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (webpush && publicKey && privateKey) {
      webpush.setVapidDetails('mailto:support@oigagig.com', publicKey, privateKey);

      const { createPushTrackToken } = await import('@/lib/push-track-token');
      const trackToken =
        notificationId ? createPushTrackToken(notificationId) : null;

      const payload = JSON.stringify({
        title,
        body: message,
        icon: '/brand/oiga-gig-marketing.png',
        url: link || '/',
        notificationId: notificationId || undefined,
        trackToken: trackToken || undefined,
        data: data || {},
      });

      const sendPromises = webSubs.map(async (sub: PushSubscription) => {
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
          const statusCode =
            err && typeof err === 'object' && 'statusCode' in err
              ? (err as { statusCode: number }).statusCode
              : undefined;
          if (statusCode === 410 || statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
          const errMsg = err instanceof Error ? err.message : String(err);
          devLog('Failed to send web push to one subscription:', errMsg);
        }
      });

      await Promise.allSettled(sendPromises);
      devLog(`[WebPush] Attempted push to ${webSubs.length} web device(s) for user ${userId}`);
    } else {
      devLog('[WebPush] VAPID keys not configured — web push skipped');
    }
  }

  if (nativeSubs.length > 0) {
    const { parseNativePushEndpoint } = await import('@/lib/push-subscription');
    const { sendFcmPush } = await import('@/lib/fcm-push');
    const tokens = nativeSubs
      .map((sub: PushSubscription) => parseNativePushEndpoint(sub.endpoint)?.token)
      .filter((token: string | undefined): token is string => !!token);

    await sendFcmPush(tokens, title, message, link);

    devLog(`[FCM] Attempted push to ${tokens.length} native device(s) for user ${userId}`);
  }
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
