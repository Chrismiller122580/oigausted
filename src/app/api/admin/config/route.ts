import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    let config = await prisma.platformConfig.findFirst();

    if (!config) {
      config = await prisma.platformConfig.create({
        data: {
          commissionRate: 0.12,
          referralCommissionRate: 0.05,
          minPayoutAmount: 50000,
          supportEmail: 'soporte@oigausted.com',
          enableReviews: true,
          enableChat: true,
          maintenanceMode: false,
          maintenanceMessage: "Estamos realizando mejoras. Volveremos pronto.",
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Config GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();

    const existing = await prisma.platformConfig.findFirst();

    let updated;
    if (existing) {
      updated = await prisma.platformConfig.update({
        where: { id: existing.id },
        data: {
          commissionRate: body.commissionRate ?? existing.commissionRate,
          referralCommissionRate: body.referralCommissionRate ?? existing.referralCommissionRate,
          minPayoutAmount: body.minPayoutAmount ?? existing.minPayoutAmount,
          supportEmail: body.supportEmail ?? existing.supportEmail,
          enableReviews: body.enableReviews ?? existing.enableReviews,
          enableChat: body.enableChat ?? existing.enableChat,
          maintenanceMode: body.maintenanceMode ?? existing.maintenanceMode,
          maintenanceMessage: body.maintenanceMessage ?? existing.maintenanceMessage,
        },
      });
    } else {
      updated = await prisma.platformConfig.create({ data: body });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Config PUT error:', error);
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
  }
}