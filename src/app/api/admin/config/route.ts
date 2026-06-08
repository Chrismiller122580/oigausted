import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
// @ts-ignore
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = (session?.user as any)?.role === 'admin';

    let config = await prisma.platformConfig.findUnique({ where: { id: 'singleton' } });

    if (!config) {
      // upsert for race safety (in case concurrent first creates)
      config = await prisma.platformConfig.upsert({
        where: { id: 'singleton' },
        update: {},
        create: {
          id: 'singleton',
          commissionRate: 0.12,
          referralCommissionRate: 0.05,
          minPayoutAmount: 50000,
          supportEmail: 'support@support.oigagig.com',
          supportPhone: '',
          enableReviews: true,
          enableChat: true,
          maintenanceMode: false,
          maintenanceMessage: "Estamos realizando mejoras. Volveremos pronto.",
          referralsEnabled: true,
          allowNewSignups: true,
          maxUploadSizeMB: 10,
          siteName: 'FitMe Live',
          siteTagline: 'Your personal style companion',
          logoUrl: null,
          globalPushNotificationsEnabled: true,
          globalEmailNotificationsEnabled: true,
          maintenanceBypassIps: '',
          wompiRealPaymentsEnabled: false,
        },
      });
    }

    // For non-admins (including unauthenticated users), only expose public fields
    // so the MaintenanceBanner doesn't spam 403 errors in the console during normal testing.
    // We now also expose branding + important gates so public UI and signup can respect them.
    if (!isAdmin) {
      return NextResponse.json({
        maintenanceMode: config.maintenanceMode,
        maintenanceMessage: config.maintenanceMessage,
        // Public branding
        siteName: (config as any).siteName || 'FitMe Live',
        siteTagline: (config as any).siteTagline || 'Your personal style companion',
        logoUrl: (config as any).logoUrl || null,
        // Public gates (clients can use these to hide/disable features)
        allowNewSignups: (config as any).allowNewSignups ?? true,
        referralsEnabled: (config as any).referralsEnabled ?? true,
        // Global notification masters (for future client respect)
        globalPushNotificationsEnabled: (config as any).globalPushNotificationsEnabled ?? true,
        globalEmailNotificationsEnabled: (config as any).globalEmailNotificationsEnabled ?? true,
        // Wompi payments status (public so checkout UI can show "test mode" warnings)
        wompiRealPaymentsEnabled: (config as any).wompiRealPaymentsEnabled ?? false,
      });
    }

    // Admin-only rich response: include payment status derived from env (no secrets)
    const wompiPublic = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || '';
    const wompiIntegrity = process.env.WOMPI_INTEGRITY_KEY || '';
    const wompiEvents = process.env.WOMPI_EVENTS_KEY || '';

    let wompiMode: 'live' | 'sandbox' | 'missing' = 'missing';
    let wompiPublicPreview: string | null = null;

    if (wompiPublic) {
      if (wompiPublic.includes('test') || wompiPublic.includes('_test_')) {
        wompiMode = 'sandbox';
      } else if (wompiPublic.includes('live') || wompiPublic.includes('_live_')) {
        wompiMode = 'live';
      } else {
        // Unknown prefix - treat as potentially live but flag
        wompiMode = 'live';
      }
      // Safe preview (first 12 + last 4 chars)
      const len = wompiPublic.length;
      if (len > 16) {
        wompiPublicPreview = `${wompiPublic.slice(0, 12)}…${wompiPublic.slice(-4)}`;
      } else {
        wompiPublicPreview = wompiPublic.slice(0, 8) + '…';
      }
    }

    const paymentStatus = {
      wompi: {
        configured: !!wompiPublic && !!wompiIntegrity,
        mode: wompiMode,
        publicKeyPreview: wompiPublicPreview,
        hasIntegrityKey: !!wompiIntegrity,
        hasEventsKey: !!wompiEvents,
      },
      appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
    };

    // Defensive normalization for rows created before the latest fields were added
    const normalizedConfig = {
      ...config,
      supportPhone: (config as any).supportPhone ?? '',
      referralsEnabled: (config as any).referralsEnabled ?? true,
      allowNewSignups: (config as any).allowNewSignups ?? true,
      maxUploadSizeMB: (config as any).maxUploadSizeMB ?? 10,
      siteName: (config as any).siteName || 'FitMe Live',
      siteTagline: (config as any).siteTagline || 'Your personal style companion',
      logoUrl: (config as any).logoUrl || null,
      globalPushNotificationsEnabled: (config as any).globalPushNotificationsEnabled ?? true,
      globalEmailNotificationsEnabled: (config as any).globalEmailNotificationsEnabled ?? true,
      maintenanceBypassIps: (config as any).maintenanceBypassIps || '',
      wompiRealPaymentsEnabled: (config as any).wompiRealPaymentsEnabled ?? false,
    };

    return NextResponse.json({
      ...normalizedConfig,
      _meta: {
        lastUpdated: config.updatedAt,
        payment: paymentStatus,
        environment: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    console.error('Config GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();

    const existing = await prisma.platformConfig.findFirst();

    let updated;
    if (existing) {
      updated = await prisma.platformConfig.update({
        where: { id: existing.id },
        data: {
          commissionRate: body.commissionRate ?? existing.commissionRate,
          referralCommissionRate: body.referralCommissionRate ?? existing.referralCommissionRate,
          minPayoutAmount: body.minPayoutAmount ?? existing.minPayoutAmount,
          supportEmail: body.supportEmail ?? existing.supportEmail,
          supportPhone: body.supportPhone ?? existing.supportPhone ?? '',
          enableReviews: body.enableReviews ?? existing.enableReviews,
          enableChat: body.enableChat ?? existing.enableChat,
          maintenanceMode: body.maintenanceMode ?? existing.maintenanceMode,
          maintenanceMessage: body.maintenanceMessage ?? existing.maintenanceMessage,
          // Growth / access
          referralsEnabled: body.referralsEnabled ?? existing.referralsEnabled ?? true,
          allowNewSignups: body.allowNewSignups ?? existing.allowNewSignups ?? true,
          maxUploadSizeMB: body.maxUploadSizeMB ?? existing.maxUploadSizeMB ?? 10,
          // Branding
          siteName: body.siteName ?? existing.siteName ?? 'FitMe Live',
          siteTagline: body.siteTagline ?? existing.siteTagline ?? 'Your personal style companion',
          logoUrl: body.logoUrl ?? existing.logoUrl ?? null,
          // Global notifs
          globalPushNotificationsEnabled: body.globalPushNotificationsEnabled ?? existing.globalPushNotificationsEnabled ?? true,
          globalEmailNotificationsEnabled: body.globalEmailNotificationsEnabled ?? existing.globalEmailNotificationsEnabled ?? true,
          // Maintenance advanced
          maintenanceBypassIps: body.maintenanceBypassIps ?? existing.maintenanceBypassIps ?? '',
          // Wompi real payments master switch
          wompiRealPaymentsEnabled: body.wompiRealPaymentsEnabled ?? existing.wompiRealPaymentsEnabled ?? false,
        },
      });
    } else {
      updated = await prisma.platformConfig.create({ data: body });
    }

    // Log platform config changes (security + ops relevant)
    const adminId = (session.user as any).id;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;
    const changedKeys = Object.keys(body).filter(k => body[k] !== undefined);
    await logAuditEvent({
      adminId,
      action: 'PLATFORM_CONFIG_UPDATED',
      targetType: 'PlatformConfig',
      targetId: updated.id,
      details: {
        changedFields: changedKeys,
        newValues: body,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Config PUT error:', error);
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
  }
}