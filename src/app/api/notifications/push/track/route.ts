import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { verifyPushTrackToken } from '@/lib/push-track-token';

// Service Worker reports push delivery/clicks with an HMAC track token
// (issued when the push is sent). Unauthenticated writes without token are rejected.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { notificationId, event, trackToken } = body as {
      notificationId?: string;
      event?: string;
      trackToken?: string;
    };

    if (!notificationId || !event) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (!verifyPushTrackToken(notificationId, trackToken)) {
      return NextResponse.json({ error: 'Invalid track token' }, { status: 401 });
    }

    const updateData: Prisma.NotificationUpdateInput = {};

    if (event === 'delivered') {
      updateData.pushStatus = 'delivered';
      updateData.pushSentAt = new Date();
    } else if (event === 'clicked') {
      updateData.pushStatus = 'clicked';
      updateData.pushClickedAt = new Date();
    } else {
      return NextResponse.json({ error: 'Unknown event' }, { status: 400 });
    }

    await prisma.notification.updateMany({
      where: { id: notificationId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push track error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
