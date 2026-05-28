import { prisma } from './prisma';

export interface NotificationPayload {
  userId: string;
  category: string;           // "order", "gig", "payment", "review", "system", etc.
  type: 'in_app' | 'email' | 'sms' | 'push';
  title: string;
  message: string;
  link?: string;              // URL to navigate to
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Main notification sender.
 * For now it only persists in_app notifications.
 * Email/SMS/Push will be plugged in later.
 */
export async function sendNotification(payload: NotificationPayload) {
  const { userId, category, type, title, message, link, data, priority = 'normal' } = payload;

  // Always create in-app notification (even if type is email/sms)
  if (type === 'in_app') {
    await prisma.notification.create({
      data: {
        userId,
        category,
        type,
        title,
        message,
        link: link || null,
        data: data || undefined,
      },
    });
  }

  // Placeholder for other channels (will be implemented later)
  if (type === 'email') {
    console.log(`[NOTIF] Email queued for ${userId}: ${title}`);
    // TODO: integrate Resend / SendGrid
  }

  if (type === 'sms') {
    console.log(`[NOTIF] SMS queued for ${userId}: ${message}`);
    // TODO: integrate Twilio
  }

  if (type === 'push') {
    console.log(`[NOTIF] Push queued for ${userId}: ${title}`);
    // TODO: integrate Expo / Firebase
  }

  return { success: true };
}

// Convenience helpers
export const notifications = {
  async sendInApp(userId: string, category: string, title: string, message: string, link?: string, data?: any) {
    return sendNotification({ userId, category, type: 'in_app', title, message, link, data });
  },

  async sendEmail(userId: string, title: string, message: string, data?: any) {
    return sendNotification({ userId, category: 'system', type: 'email', title, message, data });
  },

  async sendSMS(userId: string, message: string) {
    return sendNotification({ userId, category: 'system', type: 'sms', title: 'OigaUsted', message });
  },

  async sendPush(userId: string, title: string, message: string, data?: any) {
    return sendNotification({ userId, category: 'system', type: 'push', title, message, data });
  },
};
