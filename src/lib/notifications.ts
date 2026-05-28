import { prisma } from './prisma';
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'OigaUsted <onboarding@resend.dev>';

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

  // 1. Always store in-app notification
  if (type === 'in_app' || type === 'email' || type === 'sms' || type === 'push') {
    try {
      await prisma.notification.create({
        data: {
          userId,
          category,
          type: 'in_app',
          title,
          message,
          link: link || null,
          data: data || undefined,
        },
      });
    } catch (err) {
      console.error('Failed to save in-app notification:', err);
    }
  }

  // 2. Handle Email via Resend
  if (type === 'email' && resend) {
    try {
      // Try to get user's email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (user?.email) {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: user.email,
          subject: title,
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #f97316;">${title}</h2>
              <p style="font-size: 16px; line-height: 1.5; color: #333;">${message}</p>
              ${link ? `<p><a href="${link}" style="color: #f97316; text-decoration: underline;">Ver detalles →</a></p>` : ''}
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
              <p style="font-size: 12px; color: #888;">OigaUsted • La plataforma de gigs en Colombia</p>
            </div>
          `,
        });
        console.log(`[Resend] Email sent to ${user.email}`);
      }
    } catch (emailError) {
      console.error('Resend email error:', emailError);
    }
  }

  // 3. SMS and Push placeholders (to be implemented later)
  if (type === 'sms') {
    console.log(`[NOTIF] SMS would be sent to user ${userId}: ${message}`);
  }

  if (type === 'push') {
    console.log(`[NOTIF] Push would be sent to user ${userId}: ${title}`);
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
};

// Export Resend instance in case you want to send custom emails directly
export { resend };
