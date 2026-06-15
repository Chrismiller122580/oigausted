import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, getPlatformConfig, type PlatformConfigRow } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { devLog } from '@/lib/utils';
import { isSecretUnchanged, maskSecretConfigured } from '@/lib/secrets';
import type { PublicPlatformConfig } from '@/types/platform-config';
import type { JsonObject } from '@/types/json';

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'admin';

    const { searchParams } = new URL(req.url);
    const forceFresh = searchParams.has('fresh') || searchParams.has('bust');

    // Use cached getter (see lib/prisma.ts). This is the key mitigation for "too many database connections"
    // because /api/admin/config is called extremely frequently from the bell, checkout, admin layout, etc.
    // Each serverless invocation was previously opening a fresh connection for this singleton query.
    const config = await getPlatformConfig(forceFresh);

    // getPlatformConfig() (see src/lib/prisma.ts) now centrally does a lazy
    // ensurePlatformConfig() (idempotent upsert) the first time the row is absent.
    // This provides "one-off on first use / app boot / after DB reset" for the
    // entire app (public banners, middleware, checkout, admin settings, etc.).
    // No per-route duplication needed anymore. The old broken `if (!config?.id)`
    // guard has been removed.

    // For non-admins (including unauthenticated users), only expose public fields
    // so the MaintenanceBanner doesn't spam 403 errors in the console during normal testing.
    // We now also expose branding + important gates so public UI and signup can respect them.
    if (!isAdmin) {
      const publicConfig: PublicPlatformConfig = {
        maintenanceMode: config.maintenanceMode,
        maintenanceMessage: config.maintenanceMessage,
        siteName: config.siteName || 'Oigagig',
        siteTagline: config.siteTagline || 'Conecta con profesionales locales en Colombia',
        logoUrl: config.logoUrl || null,
        allowNewSignups: config.allowNewSignups ?? true,
        referralsEnabled: config.referralsEnabled ?? true,
        globalPushNotificationsEnabled: config.globalPushNotificationsEnabled ?? true,
        globalEmailNotificationsEnabled: config.globalEmailNotificationsEnabled ?? true,
        wompiRealPaymentsEnabled: config.wompiRealPaymentsEnabled ?? false,
        wompiSftpEnabled: config.wompiSftpEnabled ?? false,
        tutorialsEnabled: config.tutorialsEnabled ?? true,
      };
      return NextResponse.json(publicConfig);
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
        enabled: config.wompiSftpEnabled ?? false,
        configured: !!config.wompiSftpHost && !!config.wompiSftpUsername,
        host: config.wompiSftpHost || null,
      },
      appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
    };

    // Defensive normalization for rows created before the latest fields were added
    const normalizedConfig = {
      ...config,
      supportPhone: config.supportPhone ?? '',
      referralsEnabled: config.referralsEnabled ?? true,
      allowNewSignups: config.allowNewSignups ?? true,
      maxUploadSizeMB: config.maxUploadSizeMB ?? 10,
      siteName: config.siteName || 'Oigagig',
      siteTagline: config.siteTagline || 'Conecta con profesionales locales en Colombia',
      logoUrl: config.logoUrl || null,
      globalPushNotificationsEnabled: config.globalPushNotificationsEnabled ?? true,
      globalEmailNotificationsEnabled: config.globalEmailNotificationsEnabled ?? true,
      maintenanceBypassIps: config.maintenanceBypassIps || '',
      wompiRealPaymentsEnabled: config.wompiRealPaymentsEnabled ?? false,
      wompiSftpEnabled: config.wompiSftpEnabled ?? false,
      wompiSftpHost: config.wompiSftpHost || '',
      wompiSftpPort: config.wompiSftpPort || 22,
      wompiSftpUsername: config.wompiSftpUsername || '',
      wompiSftpRemotePath: config.wompiSftpRemotePath || '/',
      wompiSftpPasswordConfigured: !!config.wompiSftpPassword,
      wompiSftpPrivateKeyConfigured: !!config.wompiSftpPrivateKey,
      wompiSftpPassword: maskSecretConfigured(!!config.wompiSftpPassword),
      wompiSftpPrivateKey: maskSecretConfigured(!!config.wompiSftpPrivateKey),
      tutorialsEnabled: config.tutorialsEnabled ?? true,
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
    console.error('Config GET error (using safe defaults):', error);
    // Never 500 this endpoint -- it's called on nearly every page load (banner, nav, etc.).
    // Return minimal safe public config so the app remains usable.
    try {
      return NextResponse.json({
        maintenanceMode: false,
        maintenanceMessage: "Estamos realizando mejoras. Volveremos pronto.",
        siteName: 'Oigagig',
        siteTagline: 'Conecta con profesionales locales en Colombia',
        logoUrl: null,
        allowNewSignups: true,
        referralsEnabled: true,
        globalPushNotificationsEnabled: true,
        globalEmailNotificationsEnabled: true,
        wompiRealPaymentsEnabled: false,
        wompiSftpEnabled: false,
        tutorialsEnabled: true,
      });
    } catch (finalErr) {
      console.error('Config GET ultimate fallback error (returning plain 200):', finalErr);
      return new Response('{"maintenanceMode":false,"maintenanceMessage":"Estamos realizando mejoras. Volveremos pronto.","siteName":"Oigagig","siteTagline":"Conecta con profesionales locales en Colombia","logoUrl":null,"allowNewSignups":true,"referralsEnabled":true,"globalPushNotificationsEnabled":true,"globalEmailNotificationsEnabled":true,"wompiRealPaymentsEnabled":false,"wompiSftpEnabled":false,"tutorialsEnabled":true}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    // Snapshot current values (using the safe getPlatformConfig path with limited
    // select) so we can compute a meaningful diff for the audit log. This prevents
    // every save from appearing to change 25+ fields.
    let current: PlatformConfigRow | null = null;
    try {
      current = await getPlatformConfig(true);
    } catch {}

    // Use upsert for the core (stable) fields. This guarantees the singleton row is
    // created if it is missing (the previous getPlatformConfig + update path would
    // silently swallow "record not found", set updated= stale defaults, return 200,
    // and the change — e.g. maintenanceMode — would be lost). SFTP fields are still
    // handled best-effort afterward for DBs that are behind on the sftp columns.
    let updated;
    try {
      updated = await prisma.platformConfig.upsert({
        where: { id: 'singleton' },
        create: {
          id: 'singleton',
          commissionRate: body.commissionRate ?? 0.12,
          referralCommissionRate: body.referralCommissionRate ?? 0.05,
          minPayoutAmount: body.minPayoutAmount ?? 50000,
          supportEmail: body.supportEmail ?? 'support@oigagig.com',
          supportPhone: body.supportPhone ?? '',
          enableReviews: body.enableReviews ?? true,
          enableChat: body.enableChat ?? true,
          maintenanceMode: body.maintenanceMode ?? false,
          maintenanceMessage: body.maintenanceMessage ?? "Estamos realizando mejoras. Volveremos pronto.",
          referralsEnabled: body.referralsEnabled ?? true,
          allowNewSignups: body.allowNewSignups ?? true,
          maxUploadSizeMB: body.maxUploadSizeMB ?? 10,
          siteName: body.siteName ?? 'Oigagig',
          siteTagline: body.siteTagline ?? 'Conecta con profesionales locales en Colombia',
          logoUrl: body.logoUrl ?? null,
          globalPushNotificationsEnabled: body.globalPushNotificationsEnabled ?? true,
          globalEmailNotificationsEnabled: body.globalEmailNotificationsEnabled ?? true,
          maintenanceBypassIps: body.maintenanceBypassIps ?? '',
          wompiRealPaymentsEnabled: body.wompiRealPaymentsEnabled ?? false,
          tutorialsEnabled: body.tutorialsEnabled ?? true,
          // SFTP defaults are supplied in the best-effort block below (or left to schema @default)
        },
        update: {
          commissionRate: body.commissionRate,
          referralCommissionRate: body.referralCommissionRate,
          minPayoutAmount: body.minPayoutAmount,
          supportEmail: body.supportEmail,
          supportPhone: body.supportPhone ?? '',
          enableReviews: body.enableReviews,
          enableChat: body.enableChat,
          maintenanceMode: body.maintenanceMode,
          maintenanceMessage: body.maintenanceMessage,
          // Growth / access
          referralsEnabled: body.referralsEnabled,
          allowNewSignups: body.allowNewSignups,
          maxUploadSizeMB: body.maxUploadSizeMB,
          // Branding
          siteName: body.siteName,
          siteTagline: body.siteTagline,
          logoUrl: body.logoUrl ?? null,
          // Global notifs
          globalPushNotificationsEnabled: body.globalPushNotificationsEnabled,
          globalEmailNotificationsEnabled: body.globalEmailNotificationsEnabled,
          // Maintenance advanced
          maintenanceBypassIps: body.maintenanceBypassIps ?? '',
          // Wompi real payments master switch
          wompiRealPaymentsEnabled: body.wompiRealPaymentsEnabled ?? false,
          tutorialsEnabled: body.tutorialsEnabled,
        },
        // Select now includes wompiSftp* (safe selects in prisma.ts + here were updated).
        // The previous omit was causing SFTP values to disappear after save + reload.
        select: {
          id: true,
          commissionRate: true,
          referralCommissionRate: true,
          minPayoutAmount: true,
          supportEmail: true,
          supportPhone: true,
          enableReviews: true,
          enableChat: true,
          maintenanceMode: true,
          maintenanceMessage: true,
          referralsEnabled: true,
          allowNewSignups: true,
          maxUploadSizeMB: true,
          siteName: true,
          siteTagline: true,
          logoUrl: true,
          globalPushNotificationsEnabled: true,
          globalEmailNotificationsEnabled: true,
          maintenanceBypassIps: true,
          wompiRealPaymentsEnabled: true,
          // wompiSftp* included (the previous "safe omit" was causing values to be lost on reload after save)
          wompiSftpEnabled: true,
          wompiSftpHost: true,
          wompiSftpPort: true,
          wompiSftpUsername: true,
          wompiSftpPassword: true,
          wompiSftpPrivateKey: true,
          wompiSftpRemotePath: true,
          tutorialsEnabled: true,
          updatedAt: true,
        },
      });
    } catch (coreErr) {
      devLog('PlatformConfig upsert (core fields) failed', coreErr);
      return NextResponse.json({ error: 'Error al guardar configuración (core)' }, { status: 500 });
    }

    // SFTP fields in separate update. (Best-effort in case prod DB is behind on the add_wompi_sftp_columns migration.)
    // The row now exists thanks to the upsert above, so the update will target a real record.
    // Note: the main reason SFTP values "erased" on save was the safe selects in prisma.ts stripping the columns on every read.
    const hasAnySftpField =
      body.wompiSftpEnabled !== undefined ||
      body.wompiSftpHost !== undefined ||
      body.wompiSftpUsername !== undefined ||
      body.wompiSftpPassword !== undefined ||
      body.wompiSftpPrivateKey !== undefined ||
      body.wompiSftpRemotePath !== undefined;

    if (hasAnySftpField) {
      try {
        const sftpData: Record<string, unknown> = {
          wompiSftpEnabled: body.wompiSftpEnabled ?? false,
          wompiSftpHost: body.wompiSftpHost || '',
          wompiSftpPort: body.wompiSftpPort || 22,
          wompiSftpUsername: body.wompiSftpUsername || '',
          wompiSftpRemotePath: body.wompiSftpRemotePath || '/',
        }
        if (!isSecretUnchanged(body.wompiSftpPassword)) {
          sftpData.wompiSftpPassword = body.wompiSftpPassword
        }
        if (!isSecretUnchanged(body.wompiSftpPrivateKey)) {
          sftpData.wompiSftpPrivateKey = body.wompiSftpPrivateKey
        }

        const sftpUpdated = await prisma.platformConfig.update({
          where: { id: 'singleton' },
          data: sftpData,
        });
        if (sftpUpdated) updated = sftpUpdated;
      } catch (sftpErr: unknown) {
        // Expected in prod DBs that lag on the wompiSftp* migration columns.
        if (process.env.NODE_ENV !== 'production' || !errMessage(sftpErr).includes('does not exist')) {
          devLog('PlatformConfig SFTP fields update skipped (column may be missing in prod DB)', sftpErr);
        }
      }
    }

    // Log platform config changes (security + ops relevant)
    const adminId = session.user.id;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;

    // Only report fields that actually differ from the previous persisted values.
    // (Client always sends the full current form state.)
    const bodyRecord = body as Record<string, unknown>;
    const currentRecord = (current ?? {}) as Record<string, unknown>;
    const changedKeys = Object.keys(bodyRecord).filter(k => {
      if (bodyRecord[k] === undefined) return false;
      const oldVal = currentRecord[k];
      const newVal = bodyRecord[k];
      const norm = (v: unknown) => (v == null || v === '') ? '' : v;
      return norm(oldVal) !== norm(newVal);
    });

    // Redact secrets — they must never be stored in plain text inside AuditLog.details
    // (even when the admin legitimately updates the SFTP credentials).
    const redactedNewValues = { ...bodyRecord } as JsonObject;
    if (redactedNewValues.wompiSftpPassword) redactedNewValues.wompiSftpPassword = '[REDACTED]';
    if (redactedNewValues.wompiSftpPrivateKey) redactedNewValues.wompiSftpPrivateKey = '[REDACTED]';

    await logAuditEvent({
      adminId,
      action: 'PLATFORM_CONFIG_UPDATED',
      targetType: 'PlatformConfig',
      targetId: updated.id,
      details: {
        changedFields: changedKeys,
        newValues: redactedNewValues,
      },
      ipAddress,
      userAgent,
    });

    const { wompiSftpPassword, wompiSftpPrivateKey, ...safeUpdated } = updated as Record<string, unknown>
    return NextResponse.json({
      ...safeUpdated,
      wompiSftpPasswordConfigured: !!wompiSftpPassword,
      wompiSftpPrivateKeyConfigured: !!wompiSftpPrivateKey,
      wompiSftpPassword: maskSecretConfigured(!!wompiSftpPassword),
      wompiSftpPrivateKey: maskSecretConfigured(!!wompiSftpPrivateKey),
    });
  } catch (error) {
    console.error('Config PUT error:', error);
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
  }
}