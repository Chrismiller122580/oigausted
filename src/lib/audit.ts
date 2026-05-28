import { prisma } from './prisma';

interface LogAuditParams {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logAuditEvent({
  adminId,
  action,
  targetType,
  targetId,
  details,
  ipAddress,
  userAgent,
}: LogAuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId: targetId || null,
        details: details || undefined,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
    // Do not throw — audit logging should never break the main flow
  }
}
