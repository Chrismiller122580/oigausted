import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET current user's notification preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    // Create default preferences if none exist
    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: {
          userId,
          inAppEnabled: true,
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          orderUpdates: true,
          gigUpdates: true,
          reviewAlerts: true,
          paymentAlerts: true,
          messageAlerts: true,
          systemAlerts: true,
          desktopNotifications: true,
          soundEnabled: true,
          quietHoursEnabled: false,
          quietHoursStart: "22:00",
          quietHoursEnd: "08:00",
          digestEnabled: false,
          digestFrequency: "daily",
          maxNotificationsPerHour: 8,
        }
      });
    }

    return NextResponse.json(prefs);
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json({ error: 'Failed to load preferences' }, { status: 500 });
  }
}

// PUT / PATCH to update preferences
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const updated = await prisma.notificationPreference.upsert({
      where: { userId },
      update: {
        inAppEnabled: body.inAppEnabled ?? undefined,
        emailEnabled: body.emailEnabled ?? undefined,
        smsEnabled: body.smsEnabled ?? undefined,
        pushEnabled: body.pushEnabled ?? undefined,
        orderUpdates: body.orderUpdates ?? undefined,
        gigUpdates: body.gigUpdates ?? undefined,
        reviewAlerts: body.reviewAlerts ?? undefined,
        paymentAlerts: body.paymentAlerts ?? undefined,
        messageAlerts: body.messageAlerts ?? undefined,
        systemAlerts: body.systemAlerts ?? undefined,
        desktopNotifications: body.desktopNotifications ?? undefined,
        soundEnabled: body.soundEnabled ?? undefined,
        quietHoursEnabled: body.quietHoursEnabled ?? undefined,
        quietHoursStart: body.quietHoursStart ?? undefined,
        quietHoursEnd: body.quietHoursEnd ?? undefined,
        digestEnabled: body.digestEnabled ?? undefined,
        digestFrequency: body.digestFrequency ?? undefined,
        maxNotificationsPerHour: body.maxNotificationsPerHour ?? undefined,
      },
      create: {
        userId,
        inAppEnabled: body.inAppEnabled ?? true,
        emailEnabled: body.emailEnabled ?? true,
        smsEnabled: body.smsEnabled ?? false,
        pushEnabled: body.pushEnabled ?? true,
        orderUpdates: body.orderUpdates ?? true,
        gigUpdates: body.gigUpdates ?? true,
        reviewAlerts: body.reviewAlerts ?? true,
        paymentAlerts: body.paymentAlerts ?? true,
        messageAlerts: body.messageAlerts ?? true,
        systemAlerts: body.systemAlerts ?? true,
        desktopNotifications: body.desktopNotifications ?? true,
        soundEnabled: body.soundEnabled ?? true,
        quietHoursEnabled: body.quietHoursEnabled ?? false,
        quietHoursStart: body.quietHoursStart ?? "22:00",
        quietHoursEnd: body.quietHoursEnd ?? "08:00",
        digestEnabled: body.digestEnabled ?? false,
        digestFrequency: body.digestFrequency ?? "daily",
        maxNotificationsPerHour: body.maxNotificationsPerHour ?? 8,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
  }
}
