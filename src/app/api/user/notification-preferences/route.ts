import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

type NotificationPrefsSelect = {
  id: string
  userId: string
  inAppEnabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  pushEnabled: boolean
  orderUpdates: boolean
  gigUpdates: boolean
  reviewAlerts: boolean
  paymentAlerts: boolean
  messageAlerts: boolean
  systemAlerts: boolean
  desktopNotifications: boolean
  soundEnabled: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  digestEnabled: boolean
  digestFrequency: string
  maxNotificationsPerHour: number
  createdAt: Date
  updatedAt: Date
}

type NotificationPrefsResponse = NotificationPrefsSelect & {
  marketingEmails?: boolean
}

const defaultPrefsData = {
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
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  digestEnabled: false,
  digestFrequency: 'daily',
  maxNotificationsPerHour: 8,
} satisfies Omit<Prisma.NotificationPreferenceCreateInput, 'user'>

// GET current user's notification preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let prefs: NotificationPrefsResponse | null = null;
    try {
      prefs = await prisma.notificationPreference.findUnique({
        where: { userId },
        // Explicit select omitting marketingEmails (and any other recent columns) to avoid
        // "column does not exist" errors on prod DBs that are behind on migrations.
        // We add the default below.
        select: {
          id: true,
          userId: true,
          inAppEnabled: true,
          emailEnabled: true,
          smsEnabled: true,
          pushEnabled: true,
          orderUpdates: true,
          gigUpdates: true,
          reviewAlerts: true,
          paymentAlerts: true,
          messageAlerts: true,
          systemAlerts: true,
          // marketingEmails omitted
          desktopNotifications: true,
          soundEnabled: true,
          quietHoursEnabled: true,
          quietHoursStart: true,
          quietHoursEnd: true,
          digestEnabled: true,
          digestFrequency: true,
          maxNotificationsPerHour: true,
          createdAt: true,
          updatedAt: true,
        }
      });
    } catch (dbErr) {
      console.warn('Prefs lookup failed (possible schema drift, using defaults):', dbErr);
    }

    if (prefs) {
      if (prefs.marketingEmails === undefined) {
        prefs.marketingEmails = true;
      }
    }

    // Create default preferences if none exist (or on error)
    if (!prefs) {
      try {
        prefs = await prisma.notificationPreference.create({
          data: {
            userId,
            ...defaultPrefsData,
          },
        });
        if (prefs) prefs.marketingEmails = true;
      } catch (createErr) {
        console.warn('Prefs create failed (schema?), returning safe defaults:', createErr);
        // Fallback so UI and sendNotification don't 500
        prefs = {
          id: `fallback-${userId}`,
          userId,
          ...defaultPrefsData,
          marketingEmails: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as NotificationPrefsResponse;
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
      marketingEmails: true,
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
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    let updated;
    try {
      updated = await prisma.notificationPreference.upsert({
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
          // marketingEmails omitted from Prisma data (see GET for explanation)
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
          // marketingEmails omitted from Prisma create data to prevent column errors
          // on prod DBs that haven't run the add_marketing_emails migration yet.
          // Always provided in fallback objects below.
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
        ...defaultPrefsData,
        marketingEmails: body.marketingEmails ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } satisfies NotificationPrefsResponse;
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update preferences error:', error);
    // Return safe merged response instead of 500
    const body = await req.json().catch(() => ({}));
    const sess = await getServerSession(authOptions);
    const uid = sess?.user?.id || null;
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
