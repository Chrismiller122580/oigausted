import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
// @ts-ignore
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: return current push subscription count for the user (for UI)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await prisma.pushSubscription.count({ where: { userId } });
    return NextResponse.json({ count, subscribed: count > 0 });
  } catch (error) {
    return NextResponse.json({ count: 0, subscribed: false });
  }
}

// Subscribe to real Web Push notifications (2027 standard)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription, device } = await req.json();

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    // Upsert subscription (one per device/endpoint)
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: req.headers.get('user-agent') || undefined,
        device: device || undefined,
        updatedAt: new Date(),
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: req.headers.get('user-agent') || undefined,
        device: device || 'Unknown device',
      },
    });

    return NextResponse.json({ success: true, message: 'Subscribed to push notifications' });
  } catch (error) {
    console.error('Push subscribe error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
