export interface AuditLogDetails {
  changedFields?: string[]
  [key: string]: unknown
}

export interface AuditActor {
  id: string
  name: string | null
  email: string
  role?: string
}

export interface AuditLogEntry {
  id: string
  action: string
  userId?: string | null
  targetId?: string | null
  targetType?: string
  metadata?: string | Record<string, unknown> | null
  details?: AuditLogDetails | string | Record<string, unknown> | null
  createdAt: string
  user?: { id: string; name: string | null; email: string | null } | null
  performedBy?: AuditActor | null
  admin?: { id: string; name: string | null; email: string } | null
}

export function asAuditDetails(
  details: AuditLogEntry['details']
): AuditLogDetails | null {
  if (!details || typeof details === 'string') return null
  return details as AuditLogDetails
}