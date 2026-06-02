import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = (session?.user as any)?.role === 'admin';

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword, userId, isAdminReset } = body;

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 });
    }

    // Admin can reset any user's password
    const targetUserId = isAdmin && (userId || isAdminReset) ? userId : session.user.id;

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, password: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Non-admin users must provide current password (unless they have none)
    if (!isAdmin && user.password) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
    }

    // Hash and save the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Audit log for admin password resets (important security event)
    if (isAdmin && targetUserId !== session.user.id) {
      const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
      const userAgent = req.headers.get('user-agent') || null;
      await logAuditEvent({
        adminId: session.user.id,
        action: 'USER_PASSWORD_RESET',
        targetType: 'User',
        targetId: targetUserId,
        details: {
          targetEmail: user.email,
          resetByAdmin: true,
        },
        ipAddress,
        userAgent,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: isAdmin ? `Password updated for ${user.email}` : 'Password updated successfully' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
