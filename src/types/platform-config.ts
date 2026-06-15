import type { PlatformConfig } from '@prisma/client'

/** Fields exposed to unauthenticated / non-admin clients via GET /api/admin/config */
export type PublicPlatformConfig = Pick<
  PlatformConfig,
  | 'maintenanceMode'
  | 'maintenanceMessage'
  | 'siteName'
  | 'siteTagline'
  | 'logoUrl'
  | 'allowNewSignups'
  | 'referralsEnabled'
  | 'globalPushNotificationsEnabled'
  | 'globalEmailNotificationsEnabled'
  | 'wompiRealPaymentsEnabled'
  | 'wompiSftpEnabled'
  | 'tutorialsEnabled'
>

export type WompiMode = 'live' | 'sandbox' | 'missing'

export interface PaymentStatusMeta {
  wompiMode: WompiMode
  wompiPublicPreview: string | null
  wompiIntegrityConfigured: boolean
  wompiEventsConfigured: boolean
  wompiRealPaymentsEnabled: boolean
}

export interface AdminPlatformConfigMeta {
  lastUpdated?: string
  payment?: PaymentStatusMeta
  environment?: string
}

/** Admin GET /api/admin/config response (secrets masked, SFTP flags as booleans) */
export type AdminPlatformConfigResponse = Omit<
  PlatformConfig,
  'wompiSftpPassword' | 'wompiSftpPrivateKey'
> & {
  wompiSftpPasswordConfigured?: boolean
  wompiSftpPrivateKeyConfigured?: boolean
  _meta?: AdminPlatformConfigMeta
}

/** Admin settings form state — includes editable secret fields (API masks on read) */
export type AdminSettingsFormConfig = AdminPlatformConfigResponse & {
  wompiSftpPassword?: string
  wompiSftpPrivateKey?: string
}

export type { PlatformConfig }