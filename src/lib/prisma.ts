import { PrismaClient, type Prisma } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { devLog } from './utils'

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || ''
  const scheme = dbUrl.split(':')[0] || 'unknown'
  const isAccelerateUrl = dbUrl.startsWith('prisma+postgres://')
  const isDirectPostgres = dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('file:')

  // Startup diagnostic (visible in Vercel logs / function cold starts)
  console.log(`[Prisma] Initializing client | scheme=${scheme} | accelerate=${isAccelerateUrl} | directPostgres=${isDirectPostgres} | hasDirectEnv=${!!process.env.DIRECT_DATABASE_URL}`)

  const baseClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

  // Use Prisma Accelerate extension **only** for Prisma Postgres / Accelerate URLs.
  // - `prisma+postgres://` is the Accelerate connection string (required for db.prisma.io in serverless).
  // - Regular `postgresql://` can also benefit on Prisma Data Platform if using their pooled endpoint.
  // - Skip for local SQLite (`file:`) or other providers during dev (the with-local-sqlite.sh wrapper + schema patch).
  // This prevents extension errors when running against SQLite in development.
  const useAccelerate = isAccelerateUrl || isDirectPostgres

  if (useAccelerate) {
    return baseClient.$extends(withAccelerate())
  }

  return baseClient
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Runtime guard against the most common cause of "too many connections for role \"prisma_migration\"":
// Someone accidentally set DATABASE_URL to the direct migration connection string in Vercel.
// The migration role usually has a tiny connection limit.
const dbUrl = process.env.DATABASE_URL || ''
if (dbUrl.includes('prisma_migration') || (dbUrl.includes('direct') && !dbUrl.includes('pooler') && !dbUrl.startsWith('prisma+postgres'))) {
  console.warn(
    '[Prisma] WARNING: DATABASE_URL appears to be a direct / migration connection string (contains "prisma_migration" or "direct" without pooler). ' +
    'This will cause "too many database connections" errors in serverless. ' +
    'For Prisma Data Platform (db.prisma.io): use the Accelerate connection string (prisma+postgres://...) as DATABASE_URL. ' +
    'Put the direct migration URL in DIRECT_DATABASE_URL only.'
  )
}

globalForPrisma.prisma = prisma

// Simple in-memory cache for the singleton PlatformConfig (rarely changes, hit on almost every admin + config + notif path).
// This dramatically reduces DB connection usage in serverless (each API route is a new invocation).
// TTL is short enough for admin changes to propagate quickly.
const platformConfigSelect = {
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
  tutorialsEnabled: true,
  wompiSftpEnabled: true,
  wompiSftpHost: true,
  wompiSftpPort: true,
  wompiSftpUsername: true,
  wompiSftpPassword: true,
  wompiSftpPrivateKey: true,
  wompiSftpRemotePath: true,
  marketingStudioProPriceCOP: true,
  marketingStudioFreeMonthlyLimit: true,
  updatedAt: true,
} satisfies Prisma.PlatformConfigSelect

export type PlatformConfigRow = Prisma.PlatformConfigGetPayload<{ select: typeof platformConfigSelect }>

let cachedPlatformConfig: PlatformConfigRow | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 30_000 // 30 seconds

/**
 * Idempotent ensure for the PlatformConfig singleton row.
 * Creates the row with safe defaults if it does not exist.
 * Safe to call frequently — the upsert is a no-op (update:{}) once the row is present.
 * This is the "one-off on first use / app boot" guarantee so that admin saves
 * (especially maintenanceMode) can never hit the old "update on missing row" failure mode.
 */
export async function ensurePlatformConfig(): Promise<void> {
  try {
    await prisma.platformConfig.upsert({
      where: { id: 'singleton' },
      update: {},
      create: {
        id: 'singleton',
        commissionRate: 0.12,
        referralCommissionRate: 0.05,
        minPayoutAmount: 50000,
        supportEmail: 'support@oigagig.com',
        supportPhone: '',
        enableReviews: true,
        enableChat: true,
        maintenanceMode: false,
        maintenanceMessage: "Estamos realizando mejoras. Volveremos pronto.",
        referralsEnabled: true,
        allowNewSignups: true,
        maxUploadSizeMB: 10,
        siteName: 'Oigagig',
        siteTagline: 'Conecta con profesionales locales en Colombia',
        logoUrl: null,
        globalPushNotificationsEnabled: true,
        globalEmailNotificationsEnabled: true,
        maintenanceBypassIps: '',
        wompiRealPaymentsEnabled: false,
        tutorialsEnabled: true,
        // SFTP fields use their own @default / best-effort handling
      },
      // Safe select (core columns only) so this upsert does not fail with "column does not exist"
      // on production databases that are still missing the wompiSftp* columns.
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
        tutorialsEnabled: true,
        // wompiSftp* included now that migration is expected
        wompiSftpEnabled: true,
        wompiSftpHost: true,
        wompiSftpPort: true,
        wompiSftpUsername: true,
        wompiSftpPassword: true,
        wompiSftpPrivateKey: true,
        wompiSftpRemotePath: true,
        updatedAt: true,
      },
    })
  } catch (e) {
    // Non-fatal: the caller will fall back to in-memory defaults.
    devLog('ensurePlatformConfig failed (non-fatal, will use in-memory defaults this time)', e)
  }
}

export async function getPlatformConfig(force = false) {
  const now = Date.now()
  if (cachedPlatformConfig && !force && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedPlatformConfig
  }

  try {
    // Select includes wompiSftp* (the previous omit was to protect old DBs; now that the migration exists we include them so admin SFTP config and getWompiSftpConfig can actually read persisted values).
    const config = await prisma.platformConfig.findUnique({
      where: { id: 'singleton' },
      select: platformConfigSelect,
    })
    if (config) {
      cachedPlatformConfig = config
      cacheTimestamp = now
      return config
    }

    // Row missing — lazily create it (one-off on first use / cold start / after DB reset).
    // This + the upsert in the config API makes saves for maintenanceMode etc. reliable.
    await ensurePlatformConfig()

    // Re-query to get the freshly created row (and let it be cached).
    const created = await prisma.platformConfig.findUnique({
      where: { id: 'singleton' },
      select: platformConfigSelect,
    })
    if (created) {
      cachedPlatformConfig = created
      cacheTimestamp = now
      return created
    }
  } catch (e) {
    // fall through to defaults
    devLog('PlatformConfig findUnique failed (possible missing columns like wompiSftpEnabled), using defaults')
  }

  // Defensive defaults (same as in the config route and ensurePlatformConfig)
  const defaults: PlatformConfigRow = {
    id: 'singleton',
    commissionRate: 0.12,
    referralCommissionRate: 0.05,
    minPayoutAmount: 50000,
    supportEmail: 'support@oigagig.com',
    supportPhone: '',
    enableReviews: true,
    enableChat: true,
    maintenanceMode: false,
    maintenanceMessage: "Estamos realizando mejoras. Volveremos pronto.",
    referralsEnabled: true,
    allowNewSignups: true,
    maxUploadSizeMB: 10,
    siteName: 'Oigagig',
    siteTagline: 'Conecta con profesionales locales en Colombia',
    logoUrl: null,
    globalPushNotificationsEnabled: true,
    globalEmailNotificationsEnabled: true,
    maintenanceBypassIps: '',
    wompiRealPaymentsEnabled: false,
    wompiSftpEnabled: false,
    wompiSftpHost: null,
    wompiSftpPort: 22,
    wompiSftpUsername: null,
    wompiSftpPassword: null,
    wompiSftpPrivateKey: null,
    wompiSftpRemotePath: '/',
    tutorialsEnabled: true,
    marketingStudioProPriceCOP: 29900,
    marketingStudioFreeMonthlyLimit: 3,
    updatedAt: new Date(),
  }

  cachedPlatformConfig = defaults
  cacheTimestamp = now
  return defaults
}

export default prisma
