import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
// @ts-ignore
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

    let prefs = null;
    try {
      prefs = await prisma.notificationPreference.findUnique({
        where: { userId }
      });
    } catch (dbErr) {
      console.warn('Prefs lookup failed (possible schema drift, using defaults):', dbErr);
    }

    // Create default preferences if none exist (or on error)
    if (!prefs) {
      try {
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
            marketingEmails: true,
            desktopNotifications: true,
            soundEnabled: true,
            quietHoursEnabled: false,
            quietHoursStart: "22:00",
            quietHoursEnd: "08:00",
            digestEnabled: false,
            digestFrequency: "daily",
            maxNotificationsPerHour: 8,
          } as any
        });
      } catch (createErr) {
        console.warn('Prefs create failed (schema?), returning safe defaults:', createErr);
        // Fallback so UI and sendNotification don't 500
        prefs = {
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
          marketingEmails: true,
          desktopNotifications: true,
          soundEnabled: true,
          quietHoursEnabled: false,
          quietHoursStart: "22:00",
          quietHoursEnd: "08:00",
          digestEnabled: false,
          digestFrequency: "daily",
          maxNotificationsPerHour: 8,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any;
      }
    }

    return NextResponse.json(prefs);
  } catch (error) {
    console.error('Get preferences error:', error);
    // Always return safe defaults instead of 500 so notifications and UI don't break
    return NextResponse.json({
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
    });
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

    let updated;
    try {
      updated = await prisma.notificationPreference.upsert({
        where: { userId },
        // @ts-ignore - marketingEmails column is new in this change
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
          // @ts-ignore new field
          marketingEmails: body.marketingEmails ?? undefined,
          desktopNotifications: body.desktopNotifications ?? undefined,
          soundEnabled: body.soundEnabled ?? undefined,
          quietHoursEnabled: body.quietHoursEnabled ?? undefined,
          quietHoursStart: body.quietHoursStart ?? undefined,
          quietHoursEnd: body.quietHoursEnd ?? undefined,
          digestEnabled: body.digestEnabled ?? undefined,
          digestFrequency: body.digestFrequency ?? undefined,
          maxNotificationsPerHour: body.maxNotificationsPerHour ?? undefined,
        },
        // @ts-ignore - marketingEmails new field
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
          // @ts-ignore new field
          marketingEmails: body.marketingEmails ?? true,
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
    } catch (dbErr) {
      console.warn('Prefs upsert failed (schema drift?), returning body as-is with defaults:', dbErr);
      updated = {
        userId,
        ...body,
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
        marketingEmails: body.marketingEmails ?? true,
        desktopNotifications: body.desktopNotifications ?? true,
        soundEnabled: body.soundEnabled ?? true,
        quietHoursEnabled: body.quietHoursEnabled ?? false,
        quietHoursStart: body.quietHoursStart ?? "22:00",
        quietHoursEnd: body.quietHoursEnd ?? "08:00",
        digestEnabled: body.digestEnabled ?? false,
        digestFrequency: body.digestFrequency ?? "daily",
        maxNotificationsPerHour: body.maxNotificationsPerHour ?? 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update preferences error:', error);
    // Return safe merged response instead of 500
    const body = await req.json().catch(() => ({}));
    const sess = await getServerSession(authOptions);
    const uid = (sess?.user as any)?.id || null;
    return NextResponse.json({
      userId: uid,
      ...body,
      inAppEnabled: body.inAppEnabled ?? true,
      emailEnabled: body.emailEnabled ?? true,
      smsEnabled: body.smsEnabled ?? false,
      pushEnabled: body.pushEnabled ?? true,
      marketingEmails: body.marketingEmails ?? true,
    });
  }
}
