import { prisma } from './prisma';

interface LogAuditParams {
  // Preferred: the user (admin, seller, buyer) or system that performed the action
  performedById?: string | null;
  // Legacy / fallback for admin-only calls (will be mapped to performedById)
  adminId?: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logAuditEvent({
  performedById,
  adminId,
  action,
  targetType,
  targetId,
  details,
  ipAddress,
  userAgent,
}: LogAuditParams) {
  try {
    const actorId = performedById || adminId || null;

    await prisma.auditLog.create({
      data: {
        performedById: actorId ?? undefined,
        // Keep legacy adminId populated when we have an admin actor (for backward compat)
        adminId: adminId ?? (actorId && action.includes('ADMIN') ? actorId : undefined),
        action,
        targetType,
        targetId: targetId ?? undefined,
        // We stringify to be compatible with both SQLite (String columns in dev) and Postgres Json.
        // The admin UI knows how to display string or object.
        details: details ? (JSON.stringify(details) as any) : undefined,
        ipAddress: ipAddress ?? undefined,
        userAgent: userAgent ?? undefined,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
    // Do not throw — audit logging should never break the main flow
  }
}
