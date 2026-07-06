import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildNativePushEndpoint, type NativePushPlatform } from '@/lib/push-subscription';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const platform = body.platform as NativePushPlatform | undefined;
    const token = typeof body.token === 'string' ? body.token.trim() : '';

    // Native FCM/APNs token (Capacitor mobile app)
    if (platform === 'android' || platform === 'ios') {
      if (!token) {
        return NextResponse.json({ error: 'Invalid native token' }, { status: 400 });
      }

      const endpoint = buildNativePushEndpoint(platform, token);
      await prisma.pushSubscription.upsert({
        where: { endpoint },
        update: {
          userId,
          p256dh: 'native',
          auth: 'native',
          userAgent: req.headers.get('user-agent') || undefined,
          device: body.device || (platform === 'android' ? 'Android App' : 'iOS App'),
          updatedAt: new Date(),
        },
        create: {
          userId,
          endpoint,
          p256dh: 'native',
          auth: 'native',
          userAgent: req.headers.get('user-agent') || undefined,
          device: body.device || (platform === 'android' ? 'Android App' : 'iOS App'),
        },
      });

      return NextResponse.json({ success: true, message: 'Native push token registered' });
    }

    // Web Push (browser service worker)
    const { subscription, device } = body;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
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