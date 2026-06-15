import { NextResponse } from 'next/server';
// @ts-ignore
// @ts-ignore
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { slugify, devLog } from '@/lib/utils';

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();

    const updateData: any = {
      name: data.name || undefined,
      tagline: data.tagline !== undefined ? (data.tagline || null) : undefined,
      profilePicture: data.imageUrl || undefined,
      coverImageUrl: data.coverImageUrl || undefined,
      bio: data.bio || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      instagram: data.instagram || null,
      facebook: data.facebook || null,
      city: data.city || undefined,
      latitude: data.latitude ?? undefined,
      longitude: data.longitude ?? undefined,
      serviceRadiusKm: data.serviceRadiusKm ?? undefined,
    };

    // Business name + slug handling.
    // Slug column may be missing on some prod DBs (no migration ever added it; see sellers/[slug] defensive code).
    // We only write slug if the pre-check SELECT succeeded without error.
    let slugSafe = false;
    if (data.businessName !== undefined) {
      const trimmed = (data.businessName || '').trim();
      updateData.businessName = trimmed || null;

      if (trimmed) {
        let slug = slugify(trimmed);
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
              slugSafe = true; // check passed => column exists and we can use it for update
            } catch (e) {
              devLog('slug check skipped (possible missing column in prod DB)');
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
        if (slugSafe) {
          updateData.slug = slug || null;
        }
        // If !slugSafe we intentionally omit slug from the update to avoid Prisma column error on drifted prod DBs.
      } else {
        if (slugSafe) {
          updateData.slug = null;
        }
      }
    }

    let updatedUser;
    try {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    } catch (updateErr: any) {
      // If the failure was due to the slug column (prod drift), retry once without it.
      const msg = String(updateErr?.message || updateErr);
      if (msg.includes('slug') && updateData.slug !== undefined) {
        devLog('Retrying profile update without slug field (prod DB missing column)');
        delete updateData.slug;
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: updateData,
        });
      } else if (msg.includes('coverImageUrl') || (msg.toLowerCase().includes('column') && msg.includes('does not exist'))) {
        devLog('Retrying profile update with raw SQL due to missing column(s) in prod DB (coverImageUrl, geo, etc.)');
        // Fallback to raw update for fields we control. Omit potentially drifted columns.
        const safeUpdate = { ...updateData };
        delete safeUpdate.coverImageUrl;
        delete safeUpdate.latitude;
        delete safeUpdate.longitude;
        delete safeUpdate.serviceRadiusKm;
        // payout* and other advanced fields are also omitted here for safety
        delete safeUpdate.payoutBankCode;
        delete safeUpdate.payoutAccountNumber;
        // etc. - Prisma will still complain if any other drifted field is in the data object for this call
        // so use raw as ultimate fallback
        await prisma.$executeRawUnsafe(`
          UPDATE "User" SET 
            name = $1,
            tagline = $2,
            "profilePicture" = $3,
            bio = $4,
            phone = $5,
            whatsapp = $6,
            instagram = $7,
            facebook = $8,
            city = $9,
            "businessName" = $10,
            "updatedAt" = NOW()
          WHERE id = $11
        `, 
          safeUpdate.name || null, 
          safeUpdate.tagline || null, 
          safeUpdate.profilePicture || null, 
          safeUpdate.bio || null, 
          safeUpdate.phone || null, 
          safeUpdate.whatsapp || null, 
          safeUpdate.instagram || null, 
          safeUpdate.facebook || null, 
          safeUpdate.city || null, 
          safeUpdate.businessName || null, 
          userId
        );
        updatedUser = await prisma.user.findUnique({ where: { id: userId } });
      } else {
        throw updateErr;
      }
    }

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    });

  } catch (error: any) {
    console.error('Profile update error:', error);
    // Surface a bit more detail for the client (seller UI will now display it)
    const message = error?.message?.includes('column') || error?.message?.includes('slug')
      ? 'Error al guardar: la base de datos no tiene todas las columnas de perfil (contacta soporte o ejecuta migraciones).'
      : 'Error al actualizar perfil';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
