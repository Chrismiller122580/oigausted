import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
// @ts-ignore
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, getPlatformConfig } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { devLog } from '@/lib/utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = (session?.user as any)?.role === 'admin';

    // Use cached getter (see lib/prisma.ts). This is the key mitigation for "too many database connections"
    // because /api/admin/config is called extremely frequently from the bell, checkout, admin layout, etc.
    // Each serverless invocation was previously opening a fresh connection for this singleton query.
    let config = await getPlatformConfig();

    // Only hit the DB for upsert on cache miss or for admins (rare). The cached defaults already
    // protect the hot path from 500s and connection exhaustion.
    if (!config?.id) {
      try {
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
            siteName: 'OigaUsted',
            siteTagline: 'Conecta con profesionales locales en Colombia',
            logoUrl: null,
            globalPushNotificationsEnabled: true,
            globalEmailNotificationsEnabled: true,
            maintenanceBypassIps: '',
            wompiRealPaymentsEnabled: false,
            wompiSftpEnabled: false,
            wompiSftpPort: 22,
            wompiSftpRemotePath: '/',
          },
        });
      } catch (upsertErr) {
        console.error('PlatformConfig upsert also failed (DB columns missing or connection issue). Using cached defaults.', upsertErr);
      }
    }

    // For non-admins (including unauthenticated users), only expose public fields
    // so the MaintenanceBanner doesn't spam 403 errors in the console during normal testing.
    // We now also expose branding + important gates so public UI and signup can respect them.
    if (!isAdmin) {
      return NextResponse.json({
        maintenanceMode: config.maintenanceMode,
        maintenanceMessage: config.maintenanceMessage,
        // Public branding
        siteName: (config as any).siteName || 'OigaUsted',
        siteTagline: (config as any).siteTagline || 'Conecta con profesionales locales en Colombia',
        logoUrl: (config as any).logoUrl || null,
        // Public gates (clients can use these to hide/disable features)
        allowNewSignups: (config as any).allowNewSignups ?? true,
        referralsEnabled: (config as any).referralsEnabled ?? true,
        // Global notification masters (for future client respect)
        globalPushNotificationsEnabled: (config as any).globalPushNotificationsEnabled ?? true,
        globalEmailNotificationsEnabled: (config as any).globalEmailNotificationsEnabled ?? true,
        // Wompi payments status (public so checkout UI can show "test mode" warnings)
        wompiRealPaymentsEnabled: (config as any).wompiRealPaymentsEnabled ?? false,
        // SFTP status (public for admin UI indicators)
        wompiSftpEnabled: (config as any).wompiSftpEnabled ?? false,
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
        hasPrivateKey: !!process.env.WOMPI_PRIVATE_KEY, // for full API / third-party payouts if used
      },
      sftp: {
        enabled: (config as any).wompiSftpEnabled ?? false,
        configured: !!(config as any).wompiSftpHost && !!(config as any).wompiSftpUsername,
        host: (config as any).wompiSftpHost || null,
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
      siteName: (config as any).siteName || 'OigaUsted',
      siteTagline: (config as any).siteTagline || 'Conecta con profesionales locales en Colombia',
      logoUrl: (config as any).logoUrl || null,
      globalPushNotificationsEnabled: (config as any).globalPushNotificationsEnabled ?? true,
      globalEmailNotificationsEnabled: (config as any).globalEmailNotificationsEnabled ?? true,
      maintenanceBypassIps: (config as any).maintenanceBypassIps || '',
      wompiRealPaymentsEnabled: (config as any).wompiRealPaymentsEnabled ?? false,
      // SFTP config (non-sensitive fields only in response; secrets sent back only for editing in admin UI)
      wompiSftpEnabled: (config as any).wompiSftpEnabled ?? false,
      wompiSftpHost: (config as any).wompiSftpHost || '',
      wompiSftpPort: (config as any).wompiSftpPort || 22,
      wompiSftpUsername: (config as any).wompiSftpUsername || '',
      wompiSftpRemotePath: (config as any).wompiSftpRemotePath || '/',
      // Secrets are returned for the edit form (they are stored in DB; in high-security setups move to env/secret manager)
      wompiSftpPassword: (config as any).wompiSftpPassword || '',
      wompiSftpPrivateKey: (config as any).wompiSftpPrivateKey || '',
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
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    const existing = await prisma.platformConfig.findFirst();

    let updated;
    if (existing) {
      // Base update with stable columns only
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
          siteName: body.siteName ?? existing.siteName ?? 'OigaUsted',
          siteTagline: body.siteTagline ?? existing.siteTagline ?? 'Conecta con profesionales locales en Colombia',
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

      // SFTP fields in separate best-effort update (may fail if columns missing in prod DB)
      if (body.wompiSftpEnabled !== undefined || body.wompiSftpHost !== undefined || body.wompiSftpUsername !== undefined || body.wompiSftpPassword !== undefined || body.wompiSftpPrivateKey !== undefined || body.wompiSftpRemotePath !== undefined) {
        try {
          updated = await prisma.platformConfig.update({
            where: { id: existing.id },
            data: {
              wompiSftpEnabled: body.wompiSftpEnabled ?? existing.wompiSftpEnabled ?? false,
              wompiSftpHost: body.wompiSftpHost ?? existing.wompiSftpHost,
              wompiSftpPort: body.wompiSftpPort ?? existing.wompiSftpPort ?? 22,
              wompiSftpUsername: body.wompiSftpUsername ?? existing.wompiSftpUsername,
              wompiSftpPassword: body.wompiSftpPassword ?? existing.wompiSftpPassword,
              wompiSftpPrivateKey: body.wompiSftpPrivateKey ?? existing.wompiSftpPrivateKey,
              wompiSftpRemotePath: body.wompiSftpRemotePath ?? existing.wompiSftpRemotePath,
            },
          });
        } catch (sftpErr) {
          devLog('PlatformConfig SFTP fields update skipped (column may be missing in prod DB)', sftpErr);
        }
      }
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