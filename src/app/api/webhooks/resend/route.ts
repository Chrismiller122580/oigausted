import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { devLog, toPrismaJson, parseDeliveryLog } from '@/lib/utils';
import type { Notification, Prisma } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __lastResendWebhookAt: string | undefined;
}

// Resend Webhook Handler for email delivery tracking
// Configure this webhook URL in your Resend dashboard: /api/webhooks/resend

function verifyResendSignature(
  rawBody: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string
): boolean {
  if (!svixId || !svixTimestamp || !svixSignature || !secret) {
    return false;
  }

  const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  // Svix signatures are like "v1,hexvalue" (may have multiple space-separated)
  const signatures = svixSignature.split(' ');
  for (const sig of signatures) {
    const [version, sigHex] = sig.split(',');
    if (version === 'v1' && sigHex) {
      try {
        const received = Buffer.from(sigHex, 'hex');
        const expected = Buffer.from(expectedSignature, 'hex');
        if (received.length === expected.length && crypto.timingSafeEqual(received, expected)) {
          return true;
        }
      } catch (e) {
        // invalid hex, continue
      }
    }
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const event = JSON.parse(rawBody);

    const svixId = req.headers.get('svix-id') || '';
    const svixTimestamp = req.headers.get('svix-timestamp') || '';
    const svixSignature = req.headers.get('svix-signature') || '';
    const secret = process.env.RESEND_WEBHOOK_SECRET || '';

    if (!verifyResendSignature(rawBody, svixId, svixTimestamp, svixSignature, secret)) {
      devLog('[Resend] Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Optional replay protection (similar to Wompi)
    if (svixTimestamp) {
      const now = Math.floor(Date.now() / 1000);
      const ts = parseInt(svixTimestamp, 10);
      if (Math.abs(now - ts) > 5 * 60) { // 5 min tolerance
        devLog('[Resend] Webhook timestamp too old/future');
        return NextResponse.json({ error: 'Timestamp too old' }, { status: 400 });
      }
    }

    devLog('[Resend Webhook]', event.type, event.data?.email_id);

    const emailId = event.data?.email_id;

    if (!emailId) {
      return NextResponse.json({ received: true });
    }

    const notificationsToUpdate: Notification[] = [];

    // 1. Fast path: direct lookup by the new resendEmailId column (set at send time).
    // This is the reliable mechanism after the auto-emails correlation fixes.
    try {
      const byId = await prisma.notification.findUnique({ where: { resendEmailId: emailId } });
      if (byId) {
        notificationsToUpdate.push(byId);
      }
    } catch (e) {
      devLog('[Resend] resendEmailId lookup failed (column may not be migrated yet):', e);
    }

    // 2. Fallback for legacy rows (pre-fix) or rows where the column wasn't populated:
    // scan a modest number of recent notifications and match inside deliveryLog (string or object).
    if (notificationsToUpdate.length === 0) {
      const recent = await prisma.notification.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
      const legacyMatches = recent.filter((n: (typeof recent)[number]) => {
        // If it already has the column, we would have found it above.
        if (n.resendEmailId === emailId) return true;
        const log = n.deliveryLog;
        if (!log) return false;
        const str = typeof log === 'string' ? log : JSON.stringify(log);
        return str.includes(emailId);
      });
      notificationsToUpdate.push(...legacyMatches);
    }

    for (const notif of notificationsToUpdate) {
      const currentLog = parseDeliveryLog(notif.deliveryLog);

      const updateData: Prisma.NotificationUpdateInput = {
        deliveryLog: toPrismaJson({
          ...currentLog,
          lastResendEvent: {
            type: event.type,
            at: new Date().toISOString(),
            data: event.data,
          }
        }) as typeof updateData.deliveryLog
      };

      // Ensure the direct id is recorded (helps future events + admin visibility)
      if (!notif.resendEmailId) {
        updateData.resendEmailId = emailId;
      }

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

    // Simple in-memory last received for ops visibility (in prod use a DB row or metric)
    global.__lastResendWebhookAt = new Date().toISOString();

    return NextResponse.json({ received: true });
  } catch (error) {
    devLog('Resend webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
