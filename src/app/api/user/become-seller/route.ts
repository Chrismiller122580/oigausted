import { NextRequest, NextResponse } from 'next/server'
// @ts-ignore
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAuditEvent } from '@/lib/audit'
import { slugify, devLog } from '@/lib/utils'

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
    let slugSafe = false;

    // Ensure unique slug. Guard against missing column on drifted prod DBs
    // (identical problem that broke /seller/profile saves).
    if (slug) {
      let candidate = slug;
      let suffix = 1;
      while (true) {
        let exists = null;
        try {
          exists = await prisma.user.findUnique({
            where: { slug: candidate },
            select: { id: true }
          });
          slugSafe = true;
        } catch (e) {
          devLog('slug unique check failed (column may be missing in prod DB)');
          slugSafe = false;
        }
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

    const updateData: any = {
      role: "seller",
      businessName: trimmedBusinessName,
      nit: nit ? nit.trim() : null,
      bio: bio ? bio.trim() : null,
      updatedAt: new Date()
    };
    if (slugSafe) {
      updateData.slug = slug || undefined;
    }

    let updatedUser;
    try {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData
      });
    } catch (updateErr: any) {
      const msg = String(updateErr?.message || updateErr);
      if (msg.includes('slug') && 'slug' in updateData) {
        devLog('Retrying become-seller update without slug (prod DB missing column)');
        delete updateData.slug;
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: updateData
        });
      } else if (msg.includes('coverImageUrl') || msg.toLowerCase().includes('column') && msg.includes('does not exist')) {
        devLog('Retrying become-seller with raw SQL due to missing column(s) in prod DB (e.g. coverImageUrl, geo, payout fields)');
        // Use raw SQL to bypass Prisma client model validation for drifted columns.
        // Only touch fields we know are safe or have been added via prior migrations.
        await prisma.$executeRawUnsafe(`
          UPDATE "User" SET 
            role = 'seller',
            "businessName" = $1,
            nit = $2,
            bio = $3,
            "updatedAt" = NOW()
          WHERE id = $4
        `, trimmedBusinessName, nit ? nit.trim() : null, bio ? bio.trim() : null, userId);

        // Re-fetch with a very safe minimal select (avoid any columns that might be missing on this DB)
        updatedUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            businessName: true,
            // deliberately omit coverImageUrl, latitude, payout*, slug if it might be missing, etc.
          }
        });
      } else {
        throw updateErr;
      }
    }

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
