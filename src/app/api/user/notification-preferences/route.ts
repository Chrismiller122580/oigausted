import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET current user's notification preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id }
    });

    // Create default preferences if none exist
    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: {
          userId: session.user.id,
          inAppEnabled: true,
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          orderUpdates: true,
          gigUpdates: true,
          reviewAlerts: true,
          paymentAlerts: true,
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const updated = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: {
        inAppEnabled: body.inAppEnabled ?? undefined,
        emailEnabled: body.emailEnabled ?? undefined,
        smsEnabled: body.smsEnabled ?? undefined,
        pushEnabled: body.pushEnabled ?? undefined,
        orderUpdates: body.orderUpdates ?? undefined,
        gigUpdates: body.gigUpdates ?? undefined,
        reviewAlerts: body.reviewAlerts ?? undefined,
        paymentAlerts: body.paymentAlerts ?? undefined,
      },
      create: {
        userId: session.user.id,
        inAppEnabled: body.inAppEnabled ?? true,
        emailEnabled: body.emailEnabled ?? true,
        smsEnabled: body.smsEnabled ?? false,
        pushEnabled: body.pushEnabled ?? true,
        orderUpdates: body.orderUpdates ?? true,
        gigUpdates: body.gigUpdates ?? true,
        reviewAlerts: body.reviewAlerts ?? true,
        paymentAlerts: body.paymentAlerts ?? true,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
  }
}
