import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Resend Webhook Handler for email delivery tracking
// Configure this webhook URL in your Resend dashboard: /api/webhooks/resend

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();

    console.log('[Resend Webhook]', event.type, event.data?.email_id);

    const emailId = event.data?.email_id;

    if (!emailId) {
      return NextResponse.json({ received: true });
    }

    // Find notification by resend id in deliveryLog
    const notifications = await prisma.notification.findMany({
      where: {
        deliveryLog: {
          path: ['emailAttempt', 'resendId'],
          equals: emailId,
        },
      },
      take: 5,
    });

    for (const notif of notifications) {
      const currentLog = (notif.deliveryLog as any) || {};

      let updateData: any = {
        deliveryLog: {
          ...currentLog,
          lastResendEvent: {
            type: event.type,
            at: new Date().toISOString(),
            data: event.data,
          }
        }
      };

      switch (event.type) {
        case 'email.delivered':
          updateData.emailStatus = 'delivered';
          break;
        case 'email.opened':
          updateData.emailStatus = 'opened';
          updateData.emailOpenedAt = new Date();
          break;
        case 'email.clicked':
          updateData.emailStatus = 'clicked';
          break;
        case 'email.bounced':
        case 'email.complained':
          updateData.emailStatus = 'bounced';
          break;
        case 'email.failed':
          updateData.emailStatus = 'failed';
          break;
      }

      await prisma.notification.update({
        where: { id: notif.id },
        data: updateData,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Resend webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
