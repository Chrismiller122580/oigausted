// @ts-ignore
// @ts-ignore
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseJsonArrayField, toPrismaJson } from '@/lib/utils';
import { gigCategories as staticGigCategories } from '@/lib/gig-categories';
import { getCategoryIconKey } from '@/lib/icon-registry';
import type { Category } from '@prisma/client';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || role !== 'admin') {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });

    const names = categories.map((c: Category) => c.name);
    const gigUsage = await prisma.gig.groupBy({
      by: ['category'],
      where: { category: { in: names } },
      _count: { _all: true },
    });
    const usageMap = Object.fromEntries(gigUsage.map((g: any) => [g.category, g._count._all]));

    // Normalize fields for response (handle sqlite string vs json)
    const normalized = categories.map((c: Category) => ({
      ...c,
      fields: parseJsonArrayField(c.fields),
      // Surface iconKey (additive; computed via registry if column empty or types stale)
      iconKey: (c as any).iconKey ?? getCategoryIconKey(c.name),
      gigCount: usageMap[c.name] || 0,
    }));

    return NextResponse.json({ categories: normalized });
  } catch (error) {
    console.error('Admin categories GET error:', error);
    return NextResponse.json({ error: 'Error al cargar categorías' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();

    // Special action: seed initial categories from the static source (gig-categories.ts)
    // This populates the DB so admin UI and public pages use DB as source of truth.
    if (body.seedInitial) {
      const staticNames = new Set(staticGigCategories.map(c => c.name));
      let cleaned = 0;
      let seeded = 0;

      if (body.force) {
        // Force reset: remove categories that are in DB but NOT in the static list
        // (only safe ones with 0 gigs)
        const dbCategories = await prisma.category.findMany({
          select: { name: true }
        });

        for (const dbCat of dbCategories) {
          if (!staticNames.has(dbCat.name)) {
            const gigCount = await prisma.gig.count({ where: { category: dbCat.name } });
            if (gigCount === 0) {
              await prisma.category.delete({ where: { name: dbCat.name } });
              cleaned++;
            }
            // If it has gigs, we leave it (can't safely delete)
          }
        }
      }

      // Now upsert all static ones (adds missing + refreshes icon/fields/order/isActive + iconKey)
      for (const [index, cat] of staticGigCategories.entries()) {
        const defaultIconKey = getCategoryIconKey(cat.name);
        await prisma.category.upsert({
          where: { name: cat.name },
          update: {
            icon: cat.icon,
            // iconKey left as-is on update (admin can override); set only on create below
            fields: toPrismaJson(cat.fields || []),
            order: index,
            isActive: true,
          },
          create: {
            name: cat.name,
            icon: cat.icon,
            iconKey: defaultIconKey || null,
            fields: toPrismaJson(cat.fields || []),
            description: null,
            order: index,
            isActive: true,
          },
        });
        seeded++;
      }

      const message = body.force 
        ? `Reset completado. Se eliminaron ${cleaned} categorías extra. Se importaron/actualizaron ${seeded} categorías.`
        : `Se importaron/actualizaron ${seeded} categorías iniciales.`;

      return NextResponse.json({ success: true, seeded, cleaned, message });
    }

    const { name, icon, iconKey, description, fields, isActive, order } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return NextResponse.json({ error: 'Nombre de categoría requerido (mínimo 3 caracteres)' }, { status: 400 });
    }

    const normalizedFields = Array.isArray(fields) ? fields : [];

    // Build data with any to tolerate additive iconKey column (prisma types may be stale until generate + migrate)
    const createData: any = {
      name: name.trim(),
      icon: icon || '🛠️',
      description: description || null,
      fields: toPrismaJson(normalizedFields),
      isActive: isActive !== false,
      order: typeof order === 'number' ? order : 0,
    };
    if (iconKey) createData.iconKey = iconKey;

    const created = await prisma.category.create({
      data: createData,
    });

    return NextResponse.json({ category: { ...created, fields: normalizedFields, iconKey: iconKey || (created as any).iconKey || getCategoryIconKey(name) } });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una categoría con ese nombre' }, { status: 409 });
    }
    console.error('Admin categories POST error:', error);
    return NextResponse.json({ error: 'Error al crear categoría' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, icon, iconKey, description, fields, isActive, order } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nombre (identificador) requerido para actualizar' }, { status: 400 });
    }

    const data: any = {};
    if (icon !== undefined) data.icon = icon;
    if (iconKey !== undefined) data.iconKey = iconKey || null; // accept + persist additive iconKey
    if (description !== undefined) data.description = description || null;
    if (fields !== undefined) data.fields = toPrismaJson(Array.isArray(fields) ? fields : []);
    if (isActive !== undefined) data.isActive = !!isActive;
    if (order !== undefined) data.order = Number(order) || 0;

    const updated = await prisma.category.update({
      where: { name },
      data,
    });

    return NextResponse.json({ category: { ...updated, fields: parseJsonArrayField(updated.fields), iconKey: (updated as any).iconKey ?? iconKey ?? getCategoryIconKey(name) } });
  } catch (error) {
    console.error('Admin categories PUT error:', error);
    return NextResponse.json({ error: 'Error al actualizar categoría' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Nombre requerido (?name=...)' }, { status: 400 });
    }

    // Safety: check if any gigs use this category name
    const gigCount = await prisma.gig.count({ where: { category: name } });
    if (gigCount > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: ${gigCount} gigs usan esta categoría. Desactívala en su lugar.` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { name } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin categories DELETE error:', error);
    return NextResponse.json({ error: 'Error al eliminar categoría' }, { status: 500 });
  }
}
