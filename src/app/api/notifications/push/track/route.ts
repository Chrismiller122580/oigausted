import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

// Endpoint called by Service Worker to report push delivery/clicks
export async function POST(req: NextRequest) {
  try {
    const { notificationId, event } = await req.json();

    if (!notificationId || !event) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const updateData: Prisma.NotificationUpdateInput = {};

    if (event === 'delivered') {
      updateData.pushStatus = 'delivered';
      updateData.pushSentAt = new Date();
    } else if (event === 'clicked') {
      updateData.pushStatus = 'clicked';
      updateData.pushClickedAt = new Date();
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
