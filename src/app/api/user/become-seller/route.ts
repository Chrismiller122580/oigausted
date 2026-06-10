import { NextRequest, NextResponse } from 'next/server'
// @ts-ignore
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAuditEvent } from '@/lib/audit'
import { slugify } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const currentUserId = (session?.user as any)?.id
    const isAdmin = (session?.user as any)?.role === 'admin'

    if (!currentUserId) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
    }

    const { userId, businessName, nit, bio } = await request.json()

    if (!userId || !businessName) {
      return NextResponse.json({ error: "User ID and business name are required" }, { status: 400 })
    }

    // Only self or admin can promote
    if (!isAdmin && currentUserId !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Last-admin safety for self-action
    if (currentUserId === userId) {
      const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (me?.role === 'admin') {
        const adminCount = await prisma.user.count({ where: { role: 'admin' } });
        if (adminCount <= 1) {
          return NextResponse.json({ error: 'No puedes cambiar tu rol si eres el último administrador' }, { status: 400 });
        }
      }
    }

    const trimmedBusinessName = businessName.trim();
    let slug = slugify(trimmedBusinessName);

    // Ensure unique slug
    if (slug) {
      let candidate = slug;
      let suffix = 1;
      while (true) {
        const exists = await prisma.user.findUnique({
          where: { slug: candidate },
          select: { id: true }
        });
        if (!exists || exists.id === userId) {
          slug = candidate;
          break;
        }
        candidate = `${slug}-${suffix++}`;
        if (suffix > 50) {
          candidate = `${slug}-${Date.now().toString(36)}`;
          break;
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: "seller",
        businessName: trimmedBusinessName,
        slug: slug || undefined,
        nit: nit ? nit.trim() : null,
        bio: bio ? bio.trim() : null,
        updatedAt: new Date()
      }
    })

    // Audit log (user self-service or admin action)
    await logAuditEvent({
      performedById: currentUserId,
      action: 'USER_BECAME_SELLER',
      targetType: 'User',
      targetId: userId,
      details: { previousRole: 'buyer', businessName, byAdmin: isAdmin },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Role updated to seller successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        businessName: updatedUser.businessName
      }
    })

  } catch (error: any) {
    console.error("Become seller error:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to update role" 
    }, { status: 500 })
  }
}
