import { PrismaClient } from '@prisma/client'
import { devLog } from './utils'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Runtime guard against the most common cause of "too many connections for role \"prisma_migration\"":
// Someone accidentally set DATABASE_URL to the direct migration connection string in Vercel.
// The migration role usually has a tiny connection limit.
const dbUrl = process.env.DATABASE_URL || ''
if (dbUrl.includes('prisma_migration') || (dbUrl.includes('direct') && !dbUrl.includes('pooler'))) {
  console.warn(
    '[Prisma] WARNING: DATABASE_URL appears to be a direct / migration connection string (contains "prisma_migration" or "direct" without pooler). ' +
    'This will cause "too many database connections" errors in serverless. Use the *pooled* connection string as DATABASE_URL and put the direct one in DIRECT_DATABASE_URL only.'
  )
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Simple in-memory cache for the singleton PlatformConfig (rarely changes, hit on almost every admin + config + notif path).
// This dramatically reduces DB connection usage in serverless (each API route is a new invocation).
// TTL is short enough for admin changes to propagate quickly.
let cachedPlatformConfig: any = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 30_000 // 30 seconds

export async function getPlatformConfig() {
  const now = Date.now()
  if (cachedPlatformConfig && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedPlatformConfig
  }

  try {
    // Explicit select omitting new columns (wompiSftp*) to avoid "column does not exist" on prod DBs behind on migrations.
    const config = await prisma.platformConfig.findUnique({
      where: { id: 'singleton' },
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
        // wompiSftp* fields intentionally omitted for prod DB compatibility
        updatedAt: true,
      }
    })
    if (config) {
      cachedPlatformConfig = config
      cacheTimestamp = now
      return config
    }
  } catch (e) {
    // fall through to defaults
    devLog('PlatformConfig findUnique failed (possible missing columns like wompiSftpEnabled), using defaults')
  }

  // Defensive defaults (same as in the config route)
  const defaults = {
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
    // SFTP fields default to disabled/empty until column exists and configured
    wompiSftpEnabled: false,
    wompiSftpHost: null,
    wompiSftpPort: 22,
    wompiSftpUsername: null,
    wompiSftpPassword: null,
    wompiSftpPrivateKey: null,
    wompiSftpRemotePath: '/',
    updatedAt: new Date(),
    createdAt: new Date(),
  } as any

  cachedPlatformConfig = defaults
  cacheTimestamp = now
  return defaults
}

export default prisma
